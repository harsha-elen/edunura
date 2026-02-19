import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider, Theme } from '@mui/material/styles';
import { getSettings } from '../services/settings';

// Define the context shape
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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Load theme from localStorage first, fallback to default
    const [primaryColor, setPrimaryColor] = useState<string>(
        localStorage.getItem('branding_primary_color') || '#2b8cee'
    );

    // Fetch theme from backend on mount
    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const settings = await getSettings();
                if (settings.data && settings.data['branding_primary_color']) {
                    setPrimaryColor(settings.data['branding_primary_color']);
                    // Cache in localStorage for instant load next time
                    localStorage.setItem('branding_primary_color', settings.data['branding_primary_color']);
                }
            } catch (error) {
                console.warn('Failed to load theme settings, using default:', error);
                // Use default color - don't throw error
            }
        };
        fetchTheme();
    }, []);

    const updatePrimaryColor = (color: string) => {
        setPrimaryColor(color);
        // Update localStorage when color changes
        localStorage.setItem('branding_primary_color', color);
    };

    // Create dynamic theme based on primaryColor
    const theme = createTheme({
        palette: {
            primary: {
                main: primaryColor,
                contrastText: '#ffffff',
            },
            // You can add logic here to generate shades if needed, 
            // but MUI does it automatically for 'main'.
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
