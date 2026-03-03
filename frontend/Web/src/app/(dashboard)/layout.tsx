'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

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
    const pathname = usePathname();
    const nextPath = pathname;

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        }
    }, [isLoading, isAuthenticated, router, nextPath]);

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '3px solid rgba(0, 0, 0, 0.15)',
                        borderTopColor: 'rgba(0, 0, 0, 0.65)',
                        animation: 'edunura-spin 0.8s linear infinite',
                    }}
                />
                <style>{`@keyframes edunura-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
