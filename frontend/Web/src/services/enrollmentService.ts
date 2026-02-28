import apiClient from './apiClient';

// ─── Interfaces ───────────────────────────────────────────────

export interface Enrollment {
    id: number;
    course_id: number;
    student_id: number;
    status: 'active' | 'completed' | 'suspended';
    enrollment_date: string;
    completion_date?: string;
    progress_percentage: number;
    student: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        avatar?: string;
    };
}

export interface EnrollmentStats {
    total: number;
    active: number;
    completed: number;
    suspended: number;
}

export interface AvailableStudent {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
}

// ─── Student-facing APIs ──────────────────────────────────────

export const getEnrollments = async (params?: Record<string, unknown>) => {
    const response = await apiClient.get('/enrollments', { params });
    return response.data;
};

export const enrollInCourse = async (courseId: string | number) => {
    const response = await apiClient.post('/enrollments', { courseId });
    return response.data;
};

export const updateEnrollment = async (id: string | number, data: Record<string, unknown>) => {
    const response = await apiClient.patch(`/enrollments/${id}`, data);
    return response.data;
};

export const getLessonProgress = async (params?: Record<string, unknown>) => {
    const response = await apiClient.get('/progress', { params });
    return response.data;
};

export const markLessonComplete = async (lessonId: string | number) => {
    const response = await apiClient.post(`/progress/${lessonId}`);
    return response.data;
};

// ─── Admin course-enrollment APIs ─────────────────────────────

export const getCourseEnrollments = async (courseId: number): Promise<{ enrollments: Enrollment[]; stats: EnrollmentStats }> => {
    const response = await apiClient.get(`/courses/${courseId}/enrollments`);
    return response.data.data;
};

export const enrollStudent = async (courseId: number, studentId: number): Promise<Enrollment> => {
    const response = await apiClient.post(`/courses/${courseId}/enrollments`, { student_id: studentId });
    return response.data.data;
};

export const unenrollStudent = async (courseId: number, studentId: number): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/enrollments/${studentId}`);
};

export const updateEnrollmentStatus = async (courseId: number, studentId: number, status: string): Promise<void> => {
    await apiClient.patch(`/courses/${courseId}/enrollments/${studentId}`, { status });
};

export const searchAvailableStudents = async (
    courseId: number,
    search: string = '',
    page: number = 1,
    limit: number = 10
): Promise<{ students: AvailableStudent[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
    const response = await apiClient.get(`/courses/${courseId}/available-students`, {
        params: { search, page, limit },
    });
    return response.data.data;
};
