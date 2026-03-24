'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type UserRole = 'admin' | 'moderator' | 'teacher' | 'student';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    bio?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User, refreshToken?: string, redirectTo?: string) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Returns the dashboard base path for a given user role.
 */
export const getDashboardPath = (role: UserRole): string => {
    switch (role) {
        case 'admin':
        case 'moderator':
            return '/admin';
        case 'teacher':
            return '/teacher';
        case 'student':
            return '/student';
        default:
            return '/login';
    }
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Load auth state from localStorage on mount
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');
            console.log('[AuthContext] Initializing auth state...');
            console.log('[AuthContext] Saved token exists:', !!savedToken);
            console.log('[AuthContext] Saved user exists:', !!savedUser);
            
            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
                console.log('[AuthContext] Auth state restored from localStorage');
            } else {
                console.log('[AuthContext] No saved auth state found');
            }
        } catch (error) {
            console.error('[AuthContext] Failed to load auth state:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('[AuthContext] Corrupted auth data cleared');
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((newToken: string, newUser: User, newRefreshToken?: string, redirectTo?: string) => {
        console.log('[AuthContext] Login called for user:', newUser.email);
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
            console.log('[AuthContext] Refresh token saved');
        }

        // Redirect to the appropriate dashboard
        const dashboardPath = getDashboardPath(newUser.role);
        const safeRedirect = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
            ? redirectTo
            : dashboardPath;

        console.log('[AuthContext] Redirecting to:', safeRedirect);
        router.push(safeRedirect);
    }, [router]);

    const logout = useCallback(() => {
        console.log('[AuthContext] Logout called');
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        console.log('[AuthContext] Auth data cleared, redirecting to login');
        router.push('/login');
    }, [router]);

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
