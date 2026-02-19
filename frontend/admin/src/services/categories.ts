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

export interface CategoryStats {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    totalCourses: number;
}

// Get all categories
export const getCategories = async (params?: {
    search?: string;
    status?: 'active' | 'inactive';
    featured?: boolean;
}): Promise<{ status: string; data: CourseCategory[] }> => {
    const response = await apiClient.get('/categories', { params });
    return response.data;
};

// Get single category
export const getCategoryById = async (id: number): Promise<{ status: string; data: CourseCategory }> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
};

// Create category
export const createCategory = async (
    data: CategoryFormData
): Promise<{ status: string; message: string; data: CourseCategory }> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
};

// Update category
export const updateCategory = async (
    id: number,
    data: Partial<CategoryFormData>
): Promise<{ status: string; message: string; data: CourseCategory }> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
};

// Delete category
export const deleteCategory = async (
    id: number,
    permanent?: boolean
): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/categories/${id}`, {
        params: { permanent },
    });
    return response.data;
};

// Get category statistics
export const getCategoryStats = async (): Promise<{ status: string; data: CategoryStats }> => {
    const response = await apiClient.get('/categories/stats');
    return response.data;
};
