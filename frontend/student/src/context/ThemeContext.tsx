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
                const response = await getSettings('branding');
                if (response.status === 'success' && response.data) {
                    const color = response.data['branding_primary_color'];
                    if (color) {
                        setPrimaryColor(color);
                        localStorage.setItem('branding_primary_color', color);
                    }
                }
            } catch (error) {
                console.error('Failed to load theme settings:', error);
            }
        };

        fetchTheme();
    }, []);

    const updatePrimaryColor = (color: string) => {
        setPrimaryColor(color);
        localStorage.setItem('branding_primary_color', color);
    };

    // Create dynamic theme based on primaryColor
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
