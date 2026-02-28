import apiClient from './apiClient';

export interface ProfileData {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar: string | null;
    role: string;
    created_at: string;
    last_login: string | null;
}

export interface UpdateProfileData {
    first_name?: string;
    last_name?: string;
    phone?: string;
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}

export const getProfile = async () => {
    const response = await apiClient.get('/profile');
    return response.data;
};

export const updateProfile = async (data: UpdateProfileData) => {
    const response = await apiClient.put('/profile', data);
    return response.data;
};

export const changePassword = async (data: ChangePasswordData) => {
    const response = await apiClient.put('/profile/change-password', data);
    return response.data;
};

export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/profile/upload-avatar', formData);
    return response.data;
};
