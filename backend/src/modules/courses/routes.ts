import { Router } from 'express';
import {
    createCourse,
    getAllCourses,
    updateCourse,
    getCourseById,
    deleteCourse,
    uploadThumbnail,
    uploadIntroVideo,
    // Section Controllers
    createSection,
    getAllSections,
    getSectionById,
    updateSection,
    deleteSection,
    reorderSections,
    // Lesson Controllers
    createLesson,
    getLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
    reorderLessons,
    // Lesson Media & Resources
    uploadLessonVideo,
    uploadLessonResource,
    deleteLessonResource,
} from './controller';
import { authenticate, authorize } from '../../middleware/auth';
import { uploadCourseAsset } from '../../middleware/upload';
import { Request, Response, NextFunction } from 'express';
import Lesson from '../../models/Lesson';
import CourseSection from '../../models/CourseSection';

const router = Router();

// Middleware to set courseId from lessonId before upload
const setCourseIdFromLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { lessonId } = req.params;
        console.log('setCourseIdFromLesson - LessonId:', lessonId);
        
        const lesson = await Lesson.findByPk(lessonId, {
            include: [{
                model: CourseSection,
                as: 'section',
                attributes: ['course_id']
            }]
        });
        
        if (!lesson) {
            console.log('setCourseIdFromLesson - Lesson not found');
            res.status(404).json({ status: 'error', message: 'Lesson not found' });
            return;
        }

        const section = lesson.get('section') as any;
        if (section && section.course_id) {
            req.params.courseId = section.course_id.toString();
            console.log('setCourseIdFromLesson - CourseId set to:', req.params.courseId);
        } else {
            console.log('setCourseIdFromLesson - No section or course_id found');
        }
        
        next();
    } catch (error) {
        console.error('setCourseIdFromLesson - Error:', error);
        next(error);
    }
};

// ========================================
// COURSE ROUTES
// ========================================
router.post('/', authenticate, authorize('admin', 'teacher'), createCourse);
router.get('/', authenticate, getAllCourses);
router.get('/:id', authenticate, getCourseById);
router.patch('/:id', authenticate, authorize('admin', 'teacher'), updateCourse);
router.delete('/:id', authenticate, authorize('admin', 'teacher'), deleteCourse);

// Media uploads
router.patch('/:id/thumbnail', authenticate, authorize('admin', 'teacher'), uploadCourseAsset.single('thumbnail'), uploadThumbnail);
router.patch('/:id/intro-video', authenticate, authorize('admin', 'teacher'), uploadCourseAsset.single('intro_video'), uploadIntroVideo);

// ========================================
// COURSE SECTIONS (MODULES) ROUTES
// ========================================
router.post('/:courseId/sections', authenticate, authorize('admin', 'teacher'), createSection);
router.get('/:courseId/sections', authenticate, getAllSections);
router.patch('/:courseId/sections/reorder', authenticate, authorize('admin', 'teacher'), reorderSections);

router.get('/sections/:sectionId', authenticate, getSectionById);
router.patch('/sections/:sectionId', authenticate, authorize('admin', 'teacher'), updateSection);
router.delete('/sections/:sectionId', authenticate, authorize('admin', 'teacher'), deleteSection);

// ========================================
// LESSONS ROUTES
// ========================================
router.post('/sections/:sectionId/lessons', authenticate, authorize('admin', 'teacher'), createLesson);
router.get('/sections/:sectionId/lessons', authenticate, getLessons);
router.patch('/sections/:sectionId/lessons/reorder', authenticate, authorize('admin', 'teacher'), reorderLessons);

router.get('/lessons/:lessonId', authenticate, getLessonById);
router.patch('/lessons/:lessonId', authenticate, authorize('admin', 'teacher'), updateLesson);
router.delete('/lessons/:lessonId', authenticate, authorize('admin', 'teacher'), deleteLesson);

// Lesson Media & Resources
router.patch(
    '/lessons/:lessonId/video',
    authenticate,
    authorize('admin', 'teacher'),
    setCourseIdFromLesson,
    uploadCourseAsset.single('video'),
    uploadLessonVideo
);

router.post(
    '/lessons/:lessonId/resources',
    authenticate,
    authorize('admin', 'teacher'),
    setCourseIdFromLesson,
    uploadCourseAsset.single('resource'),
    uploadLessonResource
);

router.delete(
    '/lessons/resources/:resourceId',
    authenticate,
    authorize('admin', 'teacher'),
    deleteLessonResource
);

export default router;
