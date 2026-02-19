import apiClient from './apiClient';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    avatar?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateUserPayload {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: 'admin' | 'moderator';
}

export interface UpdateUserPayload {
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: 'admin' | 'moderator';
    is_active?: boolean;
}

export interface UsersResponse {
    status: string;
    data: {
        users: User[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export interface UserResponse {
    status: string;
    data: User;
    message?: string;
}

const usersService = {
    getAllUsers: async (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
        const response = await apiClient.get<UsersResponse>('/users', { params });
        return response.data;
    },

    getUserById: async (id: number) => {
        const response = await apiClient.get<UserResponse>(`/users/${id}`);
        return response.data;
    },

    createUser: async (payload: CreateUserPayload) => {
        const response = await apiClient.post<UserResponse>('/users', payload);
        return response.data;
    },

    updateUser: async (id: number, payload: UpdateUserPayload) => {
        const response = await apiClient.put<UserResponse>(`/users/${id}`, payload);
        return response.data;
    },

    deleteUser: async (id: number) => {
        const response = await apiClient.delete<{ status: string; message: string }>(`/users/${id}`);
        return response.data;
    },
};

export default usersService;
