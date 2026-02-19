import { Router } from 'express';
import {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacherStats,
} from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All routes require authentication + admin/moderator role
router.use(authenticate);
router.use(authorize('admin', 'moderator'));

// GET /api/teachers - Get all teachers
router.get('/', getAllTeachers);

// GET /api/teachers/stats - Get teacher statistics
router.get('/stats', getTeacherStats);

// GET /api/teachers/:id - Get single teacher
router.get('/:id', getTeacherById);

// POST /api/teachers - Create new teacher
router.post('/', createTeacher);

// PUT /api/teachers/:id - Update teacher
router.put('/:id', updateTeacher);

// DELETE /api/teachers/:id - Delete teacher
router.delete('/:id', deleteTeacher);

export default router;
