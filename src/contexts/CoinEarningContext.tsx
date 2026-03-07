import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import { useAuth } from './AuthContext';
import { post } from '../services/api';
import { useSocket } from './SocketContext';
import CoinEarnedToast from '../components/CoinEarnedToast';

interface CoinEarningContextType {
    isActive: boolean;
    totalMinutesEarned: number;
}

const CoinEarningContext = createContext<CoinEarningContextType | undefined>(undefined);

const ACTIVITY_TIMEOUT = 60000; // 1 minute pause for anti-idle

export const CoinEarningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, refreshUser, token } = useAuth();
    const { socket } = useSocket();
    const [isActive, setIsActive] = useState(true);
    const [totalMinutesEarned, setTotalMinutesEarned] = useState(0);

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastCoins, setToastCoins] = useState(0);

    const accumulatedSecondsRef = useRef<any>(null);
    accumulatedSecondsRef.current = accumulatedSecondsRef.current ?? 0;
    const secondsRef = useRef(0);
    const intervalRef = useRef<any>(null);
    const activityTimeoutRef = useRef<any>(null);
    const appStateRef = useRef(AppState.currentState);

    // Show the custom coin toast
    const showCoinToast = useCallback((coinsAdded: number) => {
        setToastCoins(coinsAdded);
        setToastVisible(true);
    }, []);

    // Reset activity timer on user touch
    const resetActivityTimeout = useCallback(() => {
        setIsActive(true);

        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }

        activityTimeoutRef.current = setTimeout(() => {
            setIsActive(false);
        }, ACTIVITY_TIMEOUT);
    }, []);

    const addCoins = useCallback(async (minutes: number) => {
        if (!token || !user?._id || minutes <= 0) return;


        try {
            const response = await post<any>('/wallet/add-coins', { minutes });

            if (response.success) {
                const earned = response.coinsAdded ?? minutes * 1.6;
                setTotalMinutesEarned(prev => prev + minutes);
                showCoinToast(earned);
                refreshUser();
            } else {
                console.warn('❌ [CoinEarning] Failed:', response.message);
            }
        } catch (error) {
            console.error('❌ [CoinEarning] Error adding coins:', error);
        }
    }, [token, user?._id, refreshUser, showCoinToast]);

    const startEarning = useCallback(() => {
        if (!user?._id || !token) return;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            if (appStateRef.current !== 'active' || !isActive) return;

            secondsRef.current += 1;

            if (secondsRef.current % 10 === 0) {
            }

            if (secondsRef.current >= 60) {
                addCoins(1);
                secondsRef.current = 0;
            }
        }, 1000);
    }, [user?._id, token, isActive, addCoins]);

    const stopEarning = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // App foreground/background detection
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            appStateRef.current = nextAppState;
            if (nextAppState === 'active') {
                resetActivityTimeout();
                if (user?._id) startEarning();
            } else {
                stopEarning();
            }
        });

        return () => subscription.remove();
    }, [user?._id, startEarning, stopEarning, resetActivityTimeout]);

    // Start/stop based on login state
    useEffect(() => {
        if (user?._id && token && appStateRef.current === 'active') {
            resetActivityTimeout();
            startEarning();
        } else {
            stopEarning();
            secondsRef.current = 0;
            setTotalMinutesEarned(0);
        }

        return () => {
            stopEarning();
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        };
    }, [user?._id, token, startEarning, stopEarning, resetActivityTimeout]);

    // Socket wallet updates
    useEffect(() => {
        if (!socket || !user?._id) return;

        const handleWalletUpdate = (data: any) => {
            refreshUser();
        };

        socket.on('walletUpdated', handleWalletUpdate);
        return () => socket.off('walletUpdated', handleWalletUpdate);
    }, [socket, user?._id, refreshUser]);

    return (
        <CoinEarningContext.Provider value={{ isActive, totalMinutesEarned }}>
            {/* Touch responder to detect user activity */}
            <View
                style={{ flex: 1 }}
                onStartShouldSetResponderCapture={() => {
                    resetActivityTimeout();
                    return false;
                }}
            >
                {children}

                {/* Minimal floating coin notification */}
                <CoinEarnedToast
                    visible={toastVisible}
                    coinsAdded={toastCoins}
                    onHide={() => setToastVisible(false)}
                />
            </View>
        </CoinEarningContext.Provider>
    );
};

export const useCoinEarning = () => {
    const context = useContext(CoinEarningContext);
    if (context === undefined) {
        throw new Error('useCoinEarning must be used within a CoinEarningProvider');
    }
    return context;
};
