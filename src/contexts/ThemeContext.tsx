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
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
            if (savedTheme) {
                setThemeMode(savedTheme);
                applyTheme(savedTheme);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const applyTheme = (mode: ThemeMode) => {
        if (mode === 'system') {
            setColorScheme('system');
        } else {
            setColorScheme(mode);
        }
    };

    const setTheme = async (mode: ThemeMode) => {
        try {
            setThemeMode(mode);
            applyTheme(mode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const isDark = colorScheme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme: themeMode, setTheme, isDark }}>
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
