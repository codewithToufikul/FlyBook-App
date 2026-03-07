import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BASE_URL, get } from '../services/api';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    unreadNotifyCount: number;
    setUnreadNotifyCount: (count: number) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    setUnreadCount: () => { },
    unreadNotifyCount: 0,
    setUnreadNotifyCount: () => { }
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadNotifyCount, setUnreadNotifyCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(BASE_URL as string, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true,
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        if (!user?._id) return;
        try {
            const response = await get<any>('/api/messages/unread-count');
            if (response?.success) {
                setUnreadCount(response.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [user?._id]);

    const fetchUnreadNotifyCount = useCallback(async () => {
        if (!user?._id) return;
        try {
            const response = await get<any>(`/api/notifications/${user._id}/unread-count`);
            if (response?.success) {
                setUnreadNotifyCount(response.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    }, [user?._id]);

    // Fetch initial counts immediately when user is available
    useEffect(() => {
        if (user?._id) {
            fetchUnreadCount();
            fetchUnreadNotifyCount();
        }
    }, [user?._id, fetchUnreadCount, fetchUnreadNotifyCount]);

    // Handle background/foreground transitions
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && user?._id) {
                fetchUnreadCount();
                fetchUnreadNotifyCount();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [user?._id, fetchUnreadCount, fetchUnreadNotifyCount]);

    // Effect to join user room whenever user logs in or socket connects
    useEffect(() => {
        if (socket && isConnected && user?._id) {
            socket.emit('joinUser', user._id);

            // Listen for unread count updates
            socket.on('unreadCountUpdate', (data: { count: number }) => {
                setUnreadCount(data.count);
            });

            // Listen for notification updates
            socket.on('newNotification', () => {
                fetchUnreadNotifyCount();
                // We no longer call fetchUnreadCount() here because the server 
                // now emits a direct 'unreadCountUpdate' which is more accurate/real-time
            });

            socket.on('notificationsRead', () => {
                fetchUnreadNotifyCount();
            });

            // Fallback: listen for generic receiveMessage if server doesn't send count
            socket.on('receiveMessage', () => {
                fetchUnreadCount();
            });

            // Listen for messages read in other sessions or current session
            socket.on('messagesRead', () => {
                fetchUnreadCount();
            });

            return () => {
                socket.off('unreadCountUpdate');
                socket.off('receiveMessage');
                socket.off('messagesRead');
                socket.off('newNotification');
                socket.off('notificationsRead');
            };
        }
    }, [socket, isConnected, user?._id, fetchUnreadCount, fetchUnreadNotifyCount]);

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            unreadCount,
            setUnreadCount,
            unreadNotifyCount,
            setUnreadNotifyCount
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
