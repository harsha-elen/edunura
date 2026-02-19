import apiClient from './apiClient';

export interface Instructor {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

export interface CourseData {
    id?: number;
    title: string;
    description: string;
    short_description?: string;
    category?: string;
    level: string;
    status: string;
    outcomes: string[];
    prerequisites: string[];
    instructors?: Instructor[];
    price?: number;
    discounted_price?: number;
    is_free?: boolean;
    validity_period?: number | null;
    intro_video?: string;
    enable_discussion_forum?: boolean;
    show_course_rating?: boolean;
    enable_certificate?: boolean;
    visibility?: string;
    meta_title?: string;
    meta_description?: string;
    total_enrollments?: number;
}

export interface Section {
    id: number;
    course_id: number;
    title: string;
    order: number;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateSectionData {
    title: string;
    order?: number;
    is_published?: boolean;
}

export interface LessonResource {
    id: number;
    lesson_id: number;
    title: string;
    file_path: string;
    file_size: string;
    file_type: string;
    created_at?: string;
    updated_at?: string;
}

export interface Lesson {
    id: number;
    section_id: number;
    title: string;
    content_type: 'video' | 'text' | 'quiz' | 'document' | 'live';
    content_body?: string;
    file_path?: string;
    zoom_meeting_id?: string;
    zoom_join_url?: string;
    order: number;
    duration?: number;
    is_free_preview: boolean;
    is_published: boolean;
    resources?: LessonResource[];
    created_at?: string;
    updated_at?: string;
    start_time?: string;
}

export interface CreateLessonData {
    title: string;
    content_type: 'video' | 'text' | 'quiz' | 'document' | 'live';
    content_body?: string;
    file_path?: string;
    zoom_meeting_id?: string;
    zoom_join_url?: string;
    order?: number;
    duration?: number;
    is_free_preview?: boolean;
    is_published?: boolean;
}

export const getCourses = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
}) => {
    try {
        const response = await apiClient.get('/courses', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
};

export const getCourseById = async (id: number) => {
    try {
        const response = await apiClient.get(`/courses/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching course:', error);
        throw error;
    }
};

export const courseService = {
    getCourses,
    getCourseById,

    // Section API methods
    createSection: async (courseId: number, data: CreateSectionData) => {
        const response = await apiClient.post(`/courses/${courseId}/sections`, data);
        return response.data;
    },

    getSections: async (courseId: number) => {
        const response = await apiClient.get(`/courses/${courseId}/sections`);
        return response.data;
    },

    updateSection: async (sectionId: number, data: Partial<CreateSectionData>) => {
        const response = await apiClient.patch(`/courses/sections/${sectionId}`, data);
        return response.data;
    },

    deleteSection: async (sectionId: number) => {
        const response = await apiClient.delete(`/courses/sections/${sectionId}`);
        return response.data;
    },

    reorderSections: async (courseId: number, sections: { id: number; order: number }[]) => {
        const response = await apiClient.patch(`/courses/${courseId}/sections/reorder`, { sections });
        return response.data;
    },

    // Lesson API methods
    createLesson: async (sectionId: number, data: CreateLessonData) => {
        const response = await apiClient.post(`/courses/sections/${sectionId}/lessons`, data);
        return response.data;
    },

    getLessons: async (sectionId: number) => {
        const response = await apiClient.get(`/courses/sections/${sectionId}/lessons`);
        return response.data;
    },

    getLessonById: async (lessonId: number) => {
        const response = await apiClient.get(`/courses/lessons/${lessonId}`);
        return response.data;
    },

    updateLesson: async (lessonId: number, data: Partial<CreateLessonData>) => {
        const response = await apiClient.patch(`/courses/lessons/${lessonId}`, data);
        return response.data;
    },

    deleteLesson: async (lessonId: number) => {
        const response = await apiClient.delete(`/courses/lessons/${lessonId}`);
        return response.data;
    },

    reorderLessons: async (sectionId: number, lessons: { id: number; order: number }[]) => {
        const response = await apiClient.patch(`/courses/sections/${sectionId}/lessons/reorder`, { lessons });
        return response.data;
    },

    uploadLessonVideo: async (lessonId: number, file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('video', file);
        const response = await apiClient.patch(`/courses/lessons/${lessonId}/video`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });
        return response.data;
    },

    uploadLessonResource: async (lessonId: number, file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('resource', file);
        const response = await apiClient.post(`/courses/lessons/${lessonId}/resources`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });
        return response.data;
    },

    deleteLessonResource: async (resourceId: number) => {
        const response = await apiClient.delete(`/courses/lessons/resources/${resourceId}`);
        return response.data;
    },

    getLiveClassSignature: async (meetingId: string) => {
        const response = await apiClient.get(`/live-classes/${meetingId}/join-token`);
        return response.data;
    },
};
