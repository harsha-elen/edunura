// API Base URL Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',

    // Users
    USERS: '/users',
    TEACHERS: '/users/teachers',
    STUDENTS: '/users/students',

    // Courses
    COURSES: '/courses',
    COURSE_PUBLISH: (id: number) => `/courses/${id}/publish`,

    // Enrollments
    ENROLLMENTS: '/enrollments',
    MY_COURSES: '/enrollments/my-courses',

    // Payments
    CREATE_ORDER: '/payments/create-order',
    VERIFY_PAYMENT: '/payments/verify',
    PAYMENT_HISTORY: '/payments/history',

    // Live Sessions
    LIVE_SESSIONS: '/live-sessions',
    MARK_ATTENDANCE: (id: number) => `/live-sessions/${id}/attendance`,

    // Quizzes
    QUIZZES: '/quizzes',
    QUIZ_ATTEMPT: (id: number) => `/quizzes/${id}/attempt`,
    QUIZ_RESULTS: (id: number) => `/quizzes/${id}/results`,

    // Discussions
    DISCUSSIONS: '/discussions',
    DISCUSSION_REPLY: (id: number) => `/discussions/${id}/reply`,

    // Settings
    SYSTEM_SETTINGS: '/settings',
};
