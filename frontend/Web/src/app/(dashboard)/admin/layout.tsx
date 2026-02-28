'use client';

import React from 'react';
import RoleGuard from '@/components/shared/RoleGuard';
import AdminLayoutComponent from '@/components/admin/AdminLayoutComponent';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={['admin', 'moderator']}>
            <AdminLayoutComponent>
                {children}
            </AdminLayoutComponent>
        </RoleGuard>
    );
}
