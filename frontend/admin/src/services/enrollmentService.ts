import apiClient from './apiClient';

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

export const enrollmentService = {
    // Get all enrollments for a course
    getCourseEnrollments: async (courseId: number): Promise<{ enrollments: Enrollment[]; stats: EnrollmentStats }> => {
        const response = await apiClient.get(`/courses/${courseId}/enrollments`);
        return response.data.data;
    },

    // Enroll a student in a course
    enrollStudent: async (courseId: number, studentId: number): Promise<Enrollment> => {
        const response = await apiClient.post(`/courses/${courseId}/enrollments`, { student_id: studentId });
        return response.data.data;
    },

    // Unenroll a student from a course
    unenrollStudent: async (courseId: number, studentId: number): Promise<void> => {
        await apiClient.delete(`/courses/${courseId}/enrollments/${studentId}`);
    },

    // Update enrollment status
    updateEnrollmentStatus: async (courseId: number, studentId: number, status: string): Promise<void> => {
        await apiClient.patch(`/courses/${courseId}/enrollments/${studentId}`, { status });
    },

    // Search for available students to enroll
    searchAvailableStudents: async (courseId: number, search: string = '', page: number = 1, limit: number = 10): Promise<{
        students: AvailableStudent[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> => {
        const response = await apiClient.get(`/courses/${courseId}/available-students`, {
            params: { search, page, limit },
        });
        return response.data.data;
    },
};
