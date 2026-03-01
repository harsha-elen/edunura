'use client';

import React from 'react';
import RoleGuard from '@/components/shared/RoleGuard';
import TeacherLayoutComponent from '@/components/teacher/TeacherLayoutComponent';

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['teacher']}>
            <TeacherLayoutComponent>
                {children}
            </TeacherLayoutComponent>
        </RoleGuard>
    );
}
