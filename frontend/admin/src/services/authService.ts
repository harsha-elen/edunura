import apiClient from './apiClient';

export interface LoginCredentials {
    email: string;
    password: string;
    portal?: 'admin' | 'teacher' | 'student';
}

export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: 'admin' | 'teacher' | 'student';
    phone?: string;
}

export interface AuthResponse {
    status: string;
    message: string;
    data: {
        token: string;
        refreshToken: string;
        user: {
            id: number;
            email: string;
            first_name: string;
            last_name: string;
            role: string;
            is_active: boolean;
        };
    };
}

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    getMe: async (): Promise<any> => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};
