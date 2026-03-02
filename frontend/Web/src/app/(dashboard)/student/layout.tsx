'use client';

import React from 'react';
import RoleGuard from '@/components/shared/RoleGuard';
import StudentLayoutComponent from '@/components/student/StudentLayoutComponent';

/**
 * Student portal layout — wraps all /student/* routes.
 * Uses RoleGuard to ensure only student users can access.
 * Ported from student/src/components/StudentLayout.tsx
 */
export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['student']}>
            <StudentLayoutComponent>{children}</StudentLayoutComponent>
        </RoleGuard>
    );
}
