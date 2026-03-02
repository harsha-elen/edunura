'use client';

import React from 'react';
import RoleGuard from '@/components/shared/RoleGuard';

/**
 * Standalone course player layout — no sidebar, just RoleGuard protection.
 * The CoursePlayer component provides its own header and sidebar.
 */
export default function CourseLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['student']}>
            {children}
        </RoleGuard>
    );
}
