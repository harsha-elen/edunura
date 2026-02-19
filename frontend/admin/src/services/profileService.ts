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
    avatar?: string;
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
    // Get current user profile
    getProfile: async (): Promise<ProfileResponse> => {
        const response = await apiClient.get<ProfileResponse>('/profile');
        return response.data;
    },

    // Update profile information
    updateProfile: async (data: UpdateProfileData): Promise<ProfileResponse> => {
        const response = await apiClient.put<ProfileResponse>('/profile', data);
        return response.data;
    },

    // Upload profile avatar
    uploadAvatar: async (file: File): Promise<ProfileResponse> => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await apiClient.post<ProfileResponse>('/profile/upload-avatar', formData);
        return response.data;
    },

    // Change password
    changePassword: async (data: ChangePasswordData): Promise<ProfileResponse> => {
        const response = await apiClient.put<ProfileResponse>('/profile/change-password', data);
        return response.data;
    },
};

export default profileService;
