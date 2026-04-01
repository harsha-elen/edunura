import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
    checkStudentQuizAnswer,
    createQuestion,
    deleteQuestion,
    getQuestionsForTeacher,
    getStudentQuiz,
    submitStudentQuiz,
    updateQuestion,
} from './controller';

const router = Router();

router.use(authenticate);

// Teacher/Admin question management
router.post('/courses/:courseId/lessons/:lessonId/questions', authorize('admin', 'teacher'), createQuestion);
router.get('/courses/:courseId/lessons/:lessonId/questions', authorize('admin', 'teacher', 'moderator'), getQuestionsForTeacher);
router.patch('/courses/:courseId/lessons/:lessonId/questions/:questionId', authorize('admin', 'teacher'), updateQuestion);
router.delete('/courses/:courseId/lessons/:lessonId/questions/:questionId', authorize('admin', 'teacher'), deleteQuestion);

// Student quiz consumption
router.get('/lessons/:lessonId/quiz', getStudentQuiz);
router.post('/lessons/:lessonId/quiz/submit', submitStudentQuiz);
router.post('/lessons/:lessonId/quiz/check-answer', checkStudentQuizAnswer);

export default router;
