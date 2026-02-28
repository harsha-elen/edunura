'use client';

import React from 'react';
import RoleGuard from '@/components/shared/RoleGuard';

/**
 * Teacher portal layout — wraps all /teacher/* routes.
 * Uses RoleGuard to ensure only teacher users can access.
 * 
 * The actual TeacherLayout sidebar component will be ported here from
 * teacher/src/components/TeacherLayout.tsx in Phase 6.
 */
export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['teacher']}>
            {/* TeacherLayout sidebar will go here */}
            <div style={{ minHeight: '100vh' }}>
                {children}
            </div>
        </RoleGuard>
    );
}
