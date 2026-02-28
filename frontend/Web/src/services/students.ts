import apiClient from './apiClient';

export interface Student {
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

export interface CreateStudentPayload {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    is_active?: boolean;
}

export interface UpdateStudentPayload {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_active?: boolean;
}

export const getAllStudents = async (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await apiClient.get(`/students?${params.toString()}`);
    return response.data;
};

export const getStudentById = async (id: number) => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
};

export const createStudent = async (payload: CreateStudentPayload) => {
    const response = await apiClient.post('/students', payload);
    return response.data;
};

export const updateStudent = async (id: number, payload: UpdateStudentPayload) => {
    const response = await apiClient.put(`/students/${id}`, payload);
    return response.data;
};

export const deleteStudent = async (id: number, deleteType?: string) => {
    const params = deleteType ? `?type=${deleteType}` : '';
    const response = await apiClient.delete(`/students/${id}${params}`);
    return response.data;
};
