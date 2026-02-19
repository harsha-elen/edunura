import apiClient from './apiClient';

export interface ProfileData {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar: string | null;
    role: string;
    bio?: string | null;
    location?: string | null;
    billing_address?: string | null;
    billing_city?: string | null;
    billing_state?: string | null;
    billing_zip?: string | null;
    billing_country?: string | null;
    created_at: string;
    last_login: string | null;
}

export interface UpdateProfileData {
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_zip?: string;
    billing_country?: string;
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}

export interface ProfileResponse {
    status: string;
    message?: string;
    data?: ProfileData;
}

export const profileService = {
    getProfile: async (): Promise<ProfileResponse> => {
        const response = await apiClient.get<ProfileResponse>('/profile');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileData): Promise<ProfileResponse> => {
        const response = await apiClient.put<ProfileResponse>('/profile', data);
        return response.data;
    },

    uploadAvatar: async (file: File): Promise<ProfileResponse> => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await apiClient.post<ProfileResponse>('/profile/upload-avatar', formData);
        return response.data;
    },

    changePassword: async (data: ChangePasswordData): Promise<ProfileResponse> => {
        const response = await apiClient.put<ProfileResponse>('/profile/change-password', data);
        return response.data;
    },
};

export default profileService;
