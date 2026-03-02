'use client';

import CheckoutPage from '@/components/student/CheckoutPage';
import RoleGuard from '@/components/shared/RoleGuard';
import { useParams } from 'next/navigation';

export default function CheckoutRoute() {
    const params = useParams();
    const courseId = parseInt(params.courseId as string, 10);

    if (isNaN(courseId)) {
        return <div>Invalid course ID</div>;
    }

    return (
        <RoleGuard allowedRoles={['student']}>
            <CheckoutPage courseId={courseId} />
        </RoleGuard>
    );
}
