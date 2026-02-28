'use client';

import React from 'react';
import RoleGuard from '@/components/shared/RoleGuard';

/**
 * Student portal layout — wraps all /student/* routes.
 * Uses RoleGuard to ensure only student users can access.
 * 
 * The actual StudentLayout sidebar component will be ported here from
 * student/src/components/StudentLayout.tsx in Phase 7.
 */
export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['student']}>
            {/* StudentLayout sidebar will go here */}
            <div style={{ minHeight: '100vh' }}>
                {children}
            </div>
        </RoleGuard>
    );
}
