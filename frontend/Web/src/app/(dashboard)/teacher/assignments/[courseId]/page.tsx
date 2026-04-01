'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AssignmentSubmissionsDashboard from '@/components/shared/AssignmentSubmissionsDashboard';

const TeacherAssignmentSubmissionsPage: React.FC = () => {
    const params = useParams();
    const courseId = params.courseId ? Number(params.courseId) : undefined;

    return <AssignmentSubmissionsDashboard role="teacher" courseId={courseId} />;
};

export default TeacherAssignmentSubmissionsPage;
