import apiClient, { STATIC_ASSETS_BASE_URL } from './apiClient';

export interface LessonResource {
    id: number;
    lesson_id: number;
    title: string;
    file_path: string;
    file_type: string;
    file_size: number | string;
    created_at: string;
}

export interface Lesson {
    id: number;
    section_id: number;
    title: string;
    description?: string;
    content_type: 'video' | 'text' | 'quiz' | 'live';
    content_body?: string;
    file_path?: string;
    video_url?: string;
    duration?: number;
    order: number;
    is_free_preview: boolean;
    is_published: boolean;
    resources?: LessonResource[];
    completed?: boolean;
    zoom_meeting_id?: string;
    zoom_join_url?: string;
    start_time?: string;
}

export interface CourseSection {
    id: number;
    course_id: number;
    title: string;
    order: number;
    lessons: Lesson[];
}

export interface Course {
    id: number;
    title: string;
    slug: string;
    description?: string;
    short_description?: string;
    thumbnail?: string;
    category?: string;
    level?: string;
    duration_hours?: number;
    price?: number;
    discounted_price?: number;
    is_free?: boolean;
    instructors?: any[];
    sections: CourseSection[];
    status?: string;
    visibility?: string;
}

export interface CourseProgress {
    course_id: number;
    total_lessons: number;
    completed_lessons: number;
    progress_percentage: number;
    completed_lesson_ids: number[];
    enrollment_status: string;
}

export interface LessonProgress {
    lesson_id: number;
    completed: boolean;
    completed_at: string | null;
}

export const courseService = {
    getMyEnrolledCourses: async () => {
        const response = await apiClient.get('/enrollments/enrollments/my-courses');
        return response.data;
    },

    getCourseWithCurriculum: async (courseId: number): Promise<{ status: string; data: Course }> => {
        const response = await apiClient.get(`/courses/${courseId}`);
        return response.data;
    },

    getCourseForCheckout: async (courseId: number): Promise<{ status: string; data: Course }> => {
        const response = await apiClient.get(`/courses/${courseId}?checkout=true`);
        return response.data;
    },

    getLesson: async (lessonId: number): Promise<{ status: string; data: Lesson }> => {
        const response = await apiClient.get(`/courses/lessons/${lessonId}`);
        return response.data;
    },

    getCourseProgress: async (courseId: number): Promise<{ status: string; data: CourseProgress }> => {
        const response = await apiClient.get(`/courses/${courseId}/progress`);
        return response.data;
    },

    markLessonComplete: async (courseId: number, lessonId: number) => {
        const response = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
        return response.data;
    },

    markLessonIncomplete: async (courseId: number, lessonId: number) => {
        const response = await apiClient.delete(`/courses/${courseId}/lessons/${lessonId}/complete`);
        return response.data;
    },

    getLessonProgress: async (courseId: number, lessonId: number): Promise<{ status: string; data: LessonProgress }> => {
        const response = await apiClient.get(`/courses/${courseId}/lessons/${lessonId}/progress`);
        return response.data;
    },

    getThumbnailUrl: (thumbnail: string | null | undefined) => {
        if (!thumbnail) return null;
        if (thumbnail.startsWith('http')) return thumbnail;
        return `${STATIC_ASSETS_BASE_URL}/${thumbnail}`;
    },

    getVideoUrl: (videoPath: string | null | undefined) => {
        if (!videoPath) return null;
        if (videoPath.startsWith('http')) return videoPath;
        return `${STATIC_ASSETS_BASE_URL}/${videoPath}`;
    },

    getResourceUrl: (resourcePath: string) => {
        if (resourcePath.startsWith('http')) return resourcePath;
        return `${STATIC_ASSETS_BASE_URL}/${resourcePath}`;
    },
};

export default courseService;
