import apiClient from './apiClient';

export interface Enrollment {
    id: number;
    course_id: number;
    student_id: number;
    status: 'active' | 'completed' | 'suspended';
    enrollment_date: string;
    completion_date?: string;
    progress_percentage: number;
    course: {
        id: number;
        title: string;
        slug: string;
        description: string;
        short_description?: string;
        thumbnail?: string;
        category?: string;
        level: string;
        total_enrollments: number;
        rating?: number;
        total_reviews: number;
        instructors?: { id: number; first_name: string; last_name: string; email: string; avatar?: string }[];
    };
}

export interface EnrolledCourse {
    enrollment_id: number;
    course_id: number;
    status: 'active' | 'completed' | 'suspended';
    enrollment_date: string;
    completion_date?: string;
    progress_percentage: number;
    title: string;
    slug: string;
    description: string;
    short_description?: string;
    thumbnail?: string;
    category?: string;
    level: string;
    instructors: string;
    total_lessons: number;
    completed_lessons: number;
}

export const enrollmentService = {
    // Get all enrolled courses for the current student
    getMyEnrollments: async (): Promise<EnrolledCourse[]> => {
        const response = await apiClient.get('/enrollments/my-courses');
        return response.data.data || [];
    },

    // Get enrollment details for a specific course
    getCourseEnrollment: async (courseId: number): Promise<Enrollment | null> => {
        const response = await apiClient.get(`/enrollments/course/${courseId}`);
        return response.data.data || null;
    },

    // Get enrollment progress
    getProgress: async (courseId: number): Promise<number> => {
        const response = await apiClient.get(`/enrollments/course/${courseId}/progress`);
        return response.data.data?.progress_percentage || 0;
    },

    // Check enrollment status for a course
    checkEnrollmentStatus: async (courseId: number) => {
        const response = await apiClient.get(`/courses/${courseId}/enrollment-status`);
        return response.data.data;
    },

    // Self-enroll in a free course
    enrollSelf: async (courseId: number) => {
        const response = await apiClient.post(`/courses/${courseId}/enroll`);
        return response.data;
    },
};

export default enrollmentService;
