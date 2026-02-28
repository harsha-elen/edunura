import apiClient from './apiClient';

export interface Teacher {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTeacherPayload {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    is_active?: boolean;
}

export interface UpdateTeacherPayload {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_active?: boolean;
}

export const getAllTeachers = async (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await apiClient.get(`/teachers?${params.toString()}`);
    return response.data;
};

export const getTeacherById = async (id: number) => {
    const response = await apiClient.get(`/teachers/${id}`);
    return response.data;
};

export const createTeacher = async (payload: CreateTeacherPayload) => {
    const response = await apiClient.post('/teachers', payload);
    return response.data;
};

export const updateTeacher = async (id: number, payload: UpdateTeacherPayload) => {
    const response = await apiClient.put(`/teachers/${id}`, payload);
    return response.data;
};

export const deleteTeacher = async (id: number, deleteType?: string) => {
    const params = deleteType ? `?type=${deleteType}` : '';
    const response = await apiClient.delete(`/teachers/${id}${params}`);
    return response.data;
};
