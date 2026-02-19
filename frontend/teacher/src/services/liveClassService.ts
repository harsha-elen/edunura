import apiClient from './apiClient';

export interface LiveClassSession {
    id: number;
    course_id: number;
    title: string;
    description?: string;
    start_time: string;
    duration: number;
    meeting_id?: string;
    start_url?: string;
    join_url?: string;
    password?: string;
    is_active?: boolean;
    course?: {
        title: string;
    };
}

export const getLiveClassesByCourse = async (courseId: number) => {
    try {
        const response = await apiClient.get(`/live-classes/course/${courseId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching live classes:', error);
        throw error;
    }
};

export const getAllLiveClasses = async () => {
    try {
        console.log('[SERVICE] Calling GET /live-classes/all');
        const response = await apiClient.get('/live-classes/all');
        console.log('[SERVICE] Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('[SERVICE] Error fetching all live classes:', error);
        throw error;
    }
};
export const createLiveClass = async (data: {
    course_id: number;
    section_id: number | null;
    title: string;
    description: string;
    start_time: string;
    duration: number;
    agenda?: string;
}) => {
    try {
        const response = await apiClient.post('/live-classes', data);
        return response.data;
    } catch (error) {
        console.error('Error creating live class:', error);
        throw error;
    }
};

export const updateLiveClass = async (id: number, data: {
    title?: string;
    description?: string;
    start_time?: string;
    duration?: number;
    agenda?: string;
}) => {
    try {
        const response = await apiClient.put(`/live-classes/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating live class:', error);
        throw error;
    }
};
