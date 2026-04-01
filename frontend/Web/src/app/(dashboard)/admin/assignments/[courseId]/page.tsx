'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AssignmentSubmissionsDashboard from '@/components/shared/AssignmentSubmissionsDashboard';

const AdminAssignmentSubmissionsPage: React.FC = () => {
    const params = useParams();
    const courseId = params.courseId ? Number(params.courseId) : undefined;

    return <AssignmentSubmissionsDashboard role="admin" courseId={courseId} />;
};

export default AdminAssignmentSubmissionsPage;
