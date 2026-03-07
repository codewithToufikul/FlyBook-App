import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
    _id: string;
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    quantity: number;
    stock: number;
    selectedSize?: string;
    selectedColor?: string;
    vendorId?: string;
    coinUsagePercentage?: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: any, quantity: number, size?: string, color?: string) => void;
    removeFromCart: (productId: string, size?: string, color?: string) => void;
    updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
}

const CART_STORAGE_KEY = '@flybook_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // 1. Load cart on mount
    useEffect(() => {
        const loadCart = async () => {
            try {
                const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
                if (storedCart) {
                    setCartItems(JSON.parse(storedCart));
                }
            } catch (error) {
                console.error('Failed to load cart:', error);
            }
        };
        loadCart();
    }, []);

    // 2. Persist cart on changes
    useEffect(() => {
        const saveCart = async () => {
            try {
                await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
            } catch (error) {
                console.error('Failed to save cart:', error);
            }
        };
        saveCart();
    }, [cartItems]);

    const addToCart = useCallback((product: any, quantity: number, size?: string, color?: string) => {
        setCartItems(prev => {
            // Check if item with same variant already exists
            const existingIndex = prev.findIndex(item =>
                item._id === product._id &&
                item.selectedSize === size &&
                item.selectedColor === color
            );

            if (existingIndex > -1) {
                const newItems = [...prev];
                const newQty = newItems[existingIndex].quantity + quantity;
                // Clamp to stock
                newItems[existingIndex].quantity = Math.min(newQty, product.stock || 99);
                return newItems;
            }

            const newItem: CartItem = {
                _id: product._id,
                title: product.title,
                price: product.price,
                originalPrice: product.originalPrice,
                discount: product.discount,
                image: product.images[0],
                quantity,
                stock: product.stock,
                selectedSize: size,
                selectedColor: color,
                vendorId: product.vendorId,
                coinUsagePercentage: product.coinUsagePercentage,
            };

            return [...prev, newItem];
        });
    }, []);

    const removeFromCart = useCallback((productId: string, size?: string, color?: string) => {
        setCartItems(prev => prev.filter(item =>
            !(item._id === productId && item.selectedSize === size && item.selectedColor === color)
        ));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number, size?: string, color?: string) => {
        setCartItems(prev => prev.map(item => {
            if (item._id === productId && item.selectedSize === size && item.selectedColor === color) {
                return { ...item, quantity: Math.max(1, Math.min(quantity, item.stock || 99)) };
            }
            return item;
        }));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
