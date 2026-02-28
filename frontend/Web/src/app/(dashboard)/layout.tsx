'use client';

import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getDashboardPath } from '@/context/AuthContext';

/**
 * (dashboard) layout — wraps all authenticated portal routes.
 * Checks auth and redirects to login if not authenticated.
 * The sidebar is NOT rendered here; each portal has its own layout (admin/layout.tsx, etc.)
 */
export default function DashboardGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
