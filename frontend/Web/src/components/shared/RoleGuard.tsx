'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

/**
 * RoleGuard — client-side component that restricts access to specific user roles.
 * 
 * Usage in portal layouts:
 * ```tsx
 * <RoleGuard allowedRoles={['admin', 'moderator']}>
 *   <AdminLayout>{children}</AdminLayout>
 * </RoleGuard>
 * ```
 */
export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const nextPath = pathname;

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
            return;
        }

        if (!isLoading && isAuthenticated && user) {
            if (!allowedRoles.includes(user.role)) {
                // User is authenticated but wrong role - redirect to correct dashboard
                const roleRedirects: Record<string, string> = {
                    admin: '/admin',
                    moderator: '/admin',
                    teacher: '/teacher',
                    student: '/student',
                };
                router.push(roleRedirects[user.role] || '/login');
            }
        }
    }, [isLoading, isAuthenticated, user, allowedRoles, router, nextPath]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
