'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider, Theme } from '@mui/material/styles';
import { getSettings } from '../services/settings';

interface ThemeContextType {
    primaryColor: string;
    updatePrimaryColor: (color: string) => void;
    theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

// Default brand color matching --color-primary in globals.css
const DEFAULT_PRIMARY_COLOR = '#F15A24';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [primaryColor, setPrimaryColor] = useState<string>(
        (typeof window !== 'undefined' && localStorage.getItem('branding_primary_color')) || DEFAULT_PRIMARY_COLOR
    );

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const settings = await getSettings();
                if (settings.data && settings.data['branding_primary_color']) {
                    setPrimaryColor(settings.data['branding_primary_color']);
                    localStorage.setItem('branding_primary_color', settings.data['branding_primary_color']);
                }
            } catch (error) {
                console.warn('Failed to load theme settings, using default:', error);
            }
        };
        fetchTheme();
    }, []);

    const updatePrimaryColor = (color: string) => {
        setPrimaryColor(color);
        localStorage.setItem('branding_primary_color', color);
    };

    const theme = createTheme({
        palette: {
            primary: {
                main: primaryColor,
                contrastText: '#ffffff',
            },
        },
        typography: {
            fontFamily: '"Lexend", sans-serif',
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 8,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
        },
    });

    return (
        <ThemeContext.Provider value={{ primaryColor, updatePrimaryColor, theme }}>
            <MUIThemeProvider theme={theme}>
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
