// Shared TypeScript types for all portals

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'teacher' | 'student';
    phone?: string;
    avatar?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    short_description?: string;
    thumbnail?: string;
    category?: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    status: 'draft' | 'published' | 'archived';
    price: number;
    is_free: boolean;
    duration_hours?: number;
    enrollment_limit?: number;
    total_enrollments: number;
    rating?: number;
    total_reviews: number;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ApiResponse<T> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
}
