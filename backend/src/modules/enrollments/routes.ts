import { Router } from 'express';
import {
    getCourseEnrollments,
    enrollStudent,
    importEnrollmentRow,
    importEnrollmentRowsBulk,
    unenrollStudent,
    updateEnrollmentStatus,
    searchAvailableStudents,
    getMyEnrolledCourses,
    getCourseProgress,
    markLessonComplete,
    markLessonIncomplete,
    getLessonProgress,
    enrollSelf,
    checkEnrollmentStatus,
} from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ========================================
// Student-specific routes
// ========================================

// Get my enrolled courses (for students)
router.get('/enrollments/my-courses', authorize('student'), getMyEnrolledCourses);

// Self-enrollment (for free courses)
router.post('/courses/:courseId/enroll', authorize('student'), enrollSelf);

// Check enrollment status
router.get('/courses/:courseId/enrollment-status', authorize('student'), checkEnrollmentStatus);

// Get course progress (for students)
router.get('/courses/:courseId/progress', authorize('student'), getCourseProgress);

// Mark lesson as complete (for students)
router.post('/courses/:courseId/lessons/:lessonId/complete', authorize('student'), markLessonComplete);

// Mark lesson as incomplete (for students)
router.delete('/courses/:courseId/lessons/:lessonId/complete', authorize('student'), markLessonIncomplete);

// Get lesson progress (for students)
router.get('/courses/:courseId/lessons/:lessonId/progress', authorize('student'), getLessonProgress);

// ========================================
// Admin/Moderator only routes
// ========================================

// Get all enrollments for a course
router.get('/courses/:courseId/enrollments', authorize('admin', 'moderator'), getCourseEnrollments);

// Enroll a student in a course
router.post('/courses/:courseId/enrollments', authorize('admin', 'moderator'), enrollStudent);

// Import one student row (used by bulk enroll UI)
router.post('/courses/:courseId/enrollments/import-row', authorize('admin', 'moderator'), importEnrollmentRow);

// Import many rows server-side and return final summary
router.post('/courses/:courseId/enrollments/import-bulk', authorize('admin', 'moderator'), importEnrollmentRowsBulk);

// Unenroll a student from a course
router.delete('/courses/:courseId/enrollments/:studentId', authorize('admin', 'moderator'), unenrollStudent);

// Update enrollment status
router.patch('/courses/:courseId/enrollments/:studentId', authorize('admin', 'moderator'), updateEnrollmentStatus);

// Search for available students to enroll
router.get('/courses/:courseId/available-students', authorize('admin', 'moderator'), searchAvailableStudents);

export default router;
