'use client';

import { Suspense } from 'react';
import PurchaseSuccessPage from '@/components/student/PurchaseSuccessPage';
import RoleGuard from '@/components/shared/RoleGuard';
import { useSearchParams } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

function PurchaseSuccessContent() {
    const searchParams = useSearchParams();
    const courseId = parseInt(searchParams.get('courseId') as string, 10);

    if (isNaN(courseId)) {
        return <div>Invalid course ID</div>;
    }

    return (
        <RoleGuard allowedRoles={['student']}>
            <PurchaseSuccessPage courseId={courseId} />
        </RoleGuard>
    );
}

export default function PurchaseSuccessRoute() {
    return (
        <Suspense
            fallback={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <CircularProgress />
                </Box>
            }
        >
            <PurchaseSuccessContent />
        </Suspense>
    );
}
