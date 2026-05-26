import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (mode: ThemeMode) => Promise<void>;
    isDark: boolean;
}

const THEME_STORAGE_KEY = '@flybook_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { colorScheme, setColorScheme } = useColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

    useEffect(() => {
        setColorScheme('dark');
    }, []);

    const loadTheme = async () => {
        try {
            // Always enforce dark
            setColorScheme('dark');
            setThemeMode('dark');
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const applyTheme = (mode: ThemeMode) => {
        setColorScheme('dark');
    };

    const setTheme = async (mode: ThemeMode) => {
        try {
            setThemeMode('dark');
            setColorScheme('dark');
            await AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark');
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const isDark = true;

    return (
        <ThemeContext.Provider value={{ theme: 'dark', setTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
