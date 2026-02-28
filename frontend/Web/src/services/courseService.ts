import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────

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
    start_time?: string;
    created_at?: string;
    updated_at?: string;
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

// ─── Course CRUD ──────────────────────────────────────────────

export const getCourses = async (params?: Record<string, unknown>) => {
    const response = await apiClient.get('/courses', { params });
    return response.data;
};

export const getCourse = async (id: string | number) => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
};

export const createCourse = async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/courses', data);
    return response.data;
};

export const updateCourse = async (id: string | number, data: FormData | Record<string, unknown>) => {
    const response = await apiClient.patch(`/courses/${id}`, data);
    return response.data;
};

export const deleteCourse = async (id: string | number) => {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
};

// ─── Course Sections ──────────────────────────────────────────

export const getSections = async (courseId: number) => {
    const response = await apiClient.get(`/courses/${courseId}/sections`);
    return response.data;
};

export const createSection = async (courseId: number, data: CreateSectionData) => {
    const response = await apiClient.post(`/courses/${courseId}/sections`, data);
    return response.data;
};

export const updateSection = async (sectionId: number, data: Partial<CreateSectionData>) => {
    const response = await apiClient.patch(`/courses/sections/${sectionId}`, data);
    return response.data;
};

export const deleteSection = async (sectionId: number) => {
    const response = await apiClient.delete(`/courses/sections/${sectionId}`);
    return response.data;
};

export const reorderSections = async (courseId: number, sections: { id: number; order: number }[]) => {
    const response = await apiClient.patch(`/courses/${courseId}/sections/reorder`, { sections });
    return response.data;
};

// ─── Lessons ──────────────────────────────────────────────────

export const getLessons = async (sectionId: number) => {
    const response = await apiClient.get(`/courses/sections/${sectionId}/lessons`);
    return response.data;
};

export const getLessonById = async (lessonId: number) => {
    const response = await apiClient.get(`/courses/lessons/${lessonId}`);
    return response.data;
};

export const createLesson = async (sectionId: number, data: CreateLessonData) => {
    const response = await apiClient.post(`/courses/sections/${sectionId}/lessons`, data);
    return response.data;
};

export const updateLesson = async (lessonId: number, data: Partial<CreateLessonData>) => {
    const response = await apiClient.patch(`/courses/lessons/${lessonId}`, data);
    return response.data;
};

export const deleteLesson = async (lessonId: number) => {
    const response = await apiClient.delete(`/courses/lessons/${lessonId}`);
    return response.data;
};

export const reorderLessons = async (sectionId: number, lessons: { id: number; order: number }[]) => {
    const response = await apiClient.patch(`/courses/sections/${sectionId}/lessons/reorder`, { lessons });
    return response.data;
};

export const uploadLessonVideo = async (lessonId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('video', file);
    const response = await apiClient.patch(`/courses/lessons/${lessonId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
        },
    });
    return response.data;
};

export const uploadLessonResource = async (lessonId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('resource', file);
    const response = await apiClient.post(`/courses/lessons/${lessonId}/resources`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
        },
    });
    return response.data;
};

export const deleteLessonResource = async (resourceId: number) => {
    const response = await apiClient.delete(`/courses/lessons/resources/${resourceId}`);
    return response.data;
};

export const getLiveClassSignature = async (meetingId: string) => {
    const response = await apiClient.get(`/live-classes/${meetingId}/join-token`);
    return response.data;
};

// ─── Upload ───────────────────────────────────────────────────

export const uploadCourseFile = async (courseId: string | number, formData: FormData) => {
    const response = await apiClient.post(`/upload`, formData, {
        params: { courseId },
    });
    return response.data;
};
