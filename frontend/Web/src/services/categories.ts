import apiClient from './apiClient';

export interface CourseCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    icon?: string;
    color?: string;
    accent_color?: string;
    course_count: number;
    display_order: number;
    is_featured: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CategoryFormData {
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    icon?: string;
    color?: string;
    accent_color?: string;
    display_order?: number;
    is_featured?: boolean;
    is_active?: boolean;
}

export const getCategories = async (params?: {
    search?: string;
    status?: string;
    featured?: boolean;
}): Promise<{ status: string; data: CourseCategory[] }> => {
    const response = await apiClient.get('/categories', { params });
    return response.data;
};

export const getCategoryById = async (id: number | string): Promise<{ status: string; data: CourseCategory }> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
};

export const createCategory = async (data: CategoryFormData): Promise<{ status: string; message: string; data: CourseCategory }> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
};

export const updateCategory = async (id: number | string, data: Partial<CategoryFormData>): Promise<{ status: string; message: string; data: CourseCategory }> => {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id: number | string, permanent: boolean = true): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/categories/${id}`, {
        params: { permanent: permanent ? 'true' : undefined },
    });
    return response.data;
};
