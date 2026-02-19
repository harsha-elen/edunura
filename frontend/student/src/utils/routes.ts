// Student Portal - Page placeholders
// This file lists all pages to be created

export const STUDENT_PAGES = {
    // Auth
    LOGIN: '/login',
    REGISTER: '/register',

    // Dashboard
    DASHBOARD: '/dashboard',

    // Catalog
    CATALOG: '/catalog',
    COURSE_DETAILS: '/courses/:id',

    // My Courses
    MY_COURSES: '/my-courses',
    COURSE_LEARN: '/courses/:id/learn',

    // Assessment
    QUIZ: '/courses/:courseId/quiz/:quizId',
    QUIZ_RESULTS: '/courses/:courseId/quiz/:quizId/results',
    PERFORMANCE: '/performance',

    // Discussion
    DISCUSSION: '/courses/:id/discussion',

    // Live Sessions
    LIVE_SESSIONS: '/live-sessions',

    // Checkout
    CHECKOUT: '/checkout/:courseId',

    // Settings
    SETTINGS: '/settings',
};
