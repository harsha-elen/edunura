import apiClient from './apiClient';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
}

export interface AuthResponse {
    status: string;
    data: {
        user: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            role: 'admin' | 'moderator' | 'teacher' | 'student';
            avatar?: string;
        };
        token: string;
        refreshToken: string;
    };
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
};

export const refreshToken = async (): Promise<AuthResponse> => {
    const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    const response = await apiClient.post('/auth/refresh', { refreshToken: storedRefreshToken });
    return response.data;
};

export const getMe = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};

export const logout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
    }
};
