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
    otp?: string;
}

export interface ResetPasswordData {
    email: string;
    otp: string;
    newPassword: string;
}

export interface AuthResponse {
    status: string;
    message?: string;
    data: {
        user?: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            role: 'admin' | 'moderator' | 'teacher' | 'student';
            avatar?: string;
        };
        token?: string;
        refreshToken?: string;
        requires2FA?: boolean;
        tempToken?: string;
        status?: string;
        email?: string;
    };
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('[Auth Service] Login attempt with email:', credentials.email);
    try {
        const response = await apiClient.post('/auth/login', credentials);
        console.log('[Auth Service] Login successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Auth Service] Login failed:', error);
        throw error;
    }
};

export const sendRegistrationOtpApi = async (email: string): Promise<{ status: string; message: string }> => {
    const response = await apiClient.post('/auth/register/send-otp', { email });
    return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
    console.log('[Auth Service] Register attempt with email:', data.email);
    try {
        const response = await apiClient.post('/auth/register', data);
        console.log('[Auth Service] Register successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Auth Service] Register failed:', error);
        throw error;
    }
};

export const forgotPasswordApi = async (email: string): Promise<{ status: string; message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPasswordApi = async (data: ResetPasswordData): Promise<{ status: string; message: string }> => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
};

export const refreshToken = async (): Promise<AuthResponse> => {
    console.log('[Auth Service] Refreshing token...');
    try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        console.log('[Auth Service] Refresh token found:', !!storedRefreshToken);
        const response = await apiClient.post('/auth/refresh', { refreshToken: storedRefreshToken });
        console.log('[Auth Service] Token refresh successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Auth Service] Token refresh failed:', error);
        throw error;
    }
};

export const getMe = async () => {
    console.log('[Auth Service] Fetching current user...');
    try {
        const response = await apiClient.get('/auth/me');
        console.log('[Auth Service] Current user fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Auth Service] Failed to fetch current user:', error);
        throw error;
    }
};

export const logout = () => {
    console.log('[Auth Service] Logging out...');
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        console.log('[Auth Service] All auth data cleared');
    }
};

export const verify2FA = async (code: string, tempToken?: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/2fa/verify', { code, tempToken });
    return response.data;
};

export const generate2FA = async () => {
    const response = await apiClient.post('/auth/2fa/generate');
    return response.data;
};

export const verify2FASetup = async (code: string) => {
    const response = await apiClient.post('/auth/2fa/verify-setup', { code });
    return response.data;
};

export const disable2FA = async (code: string): Promise<{ status: string; message: string }> => {
    const response = await apiClient.post('/auth/2fa/disable', { code });
    return response.data;
};
