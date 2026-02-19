import { Router } from 'express';
import {
    getCourseEnrollments,
    enrollStudent,
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

router.use(authorize('admin', 'moderator'));

// Get all enrollments for a course
router.get('/courses/:courseId/enrollments', getCourseEnrollments);

// Enroll a student in a course
router.post('/courses/:courseId/enrollments', enrollStudent);

// Unenroll a student from a course
router.delete('/courses/:courseId/enrollments/:studentId', unenrollStudent);

// Update enrollment status
router.patch('/courses/:courseId/enrollments/:studentId', updateEnrollmentStatus);

// Search for available students to enroll
router.get('/courses/:courseId/available-students', searchAvailableStudents);

export default router;
