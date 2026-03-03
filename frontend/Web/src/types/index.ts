// Shared TypeScript types for the LMS platform

export type UserRole = 'admin' | 'moderator' | 'teacher' | 'student';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    bio?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Course {
    id: number;
    title: string;
    description?: string;
    short_description?: string;
    thumbnail?: string;
    intro_video?: string;
    category_id?: number;
    category?: CourseCategory;
    created_by: number;
    instructors?: Instructor[];
    is_published?: boolean;
    is_free?: boolean;
    price?: number;
    discounted_price?: number;
    validity_days?: number;
    outcomes?: string[];
    meta_title?: string;
    meta_description?: string;
    status?: string;
    total_lessons?: number;
    total_duration?: number;
    enrolled_count?: number;
    created_at?: string;
    updated_at?: string;
    sections?: CourseSection[];
}

export interface CourseCategory {
    id: number;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    image?: string;
    parent_id?: number;
    is_active?: boolean;
    course_count?: number;
}

export interface CourseSection {
    id: number;
    course_id: number;
    title: string;
    sort_order: number;
    lessons?: Lesson[];
}

export interface Lesson {
    id: number;
    section_id: number;
    course_id: number;
    title: string;
    content_type: 'video' | 'text' | 'live' | 'quiz';
    content?: string;
    video_url?: string;
    file_path?: string;
    duration?: number;
    sort_order: number;
    is_preview?: boolean;
    start_time?: string;
    resources?: LessonResource[];
    content_platform?: 'zoom' | 'jitsi';
    jitsi_room_name?: string;
    jitsi_join_url?: string;
    zoom_meeting_id?: string;
    zoom_join_url?: string;
}

export interface LessonResource {
    id: number;
    lesson_id: number;
    title: string;
    file_path: string;
    file_type: string;
    file_size?: number;
}

export interface Instructor {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
}

export interface Enrollment {
    id: number;
    student_id: number;
    course_id: number;
    status: 'active' | 'completed' | 'expired';
    progress_percentage?: number;
    enrolled_at?: string;
    expires_at?: string;
    course?: Course;
    student?: User;
}

export interface Payment {
    id: number;
    user_id: number;
    course_id: number;
    amount: number;
    currency: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    created_at?: string;
}

export interface LessonProgress {
    id: number;
    student_id: number;
    lesson_id: number;
    course_id: number;
    is_completed: boolean;
    completed_at?: string;
}

export interface LiveSession {
    id: number;
    lesson_id: number;
    course_id: number;
    meeting_id?: string;
    join_url?: string;
    start_url?: string;
    topic?: string;
    start_time?: string;
    duration?: number;
    status?: string;
    meeting_type?: 'zoom' | 'jitsi';
    jitsi_room_name?: string;
    jitsi_config?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
