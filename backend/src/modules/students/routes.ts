import { Router } from 'express';
import {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentStats,
} from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All routes require authentication + admin/moderator role
router.use(authenticate);
router.use(authorize('admin', 'moderator'));

// GET /api/students - Get all students
router.get('/', getAllStudents);

// GET /api/students/stats - Get student statistics
router.get('/stats', getStudentStats);

// GET /api/students/:id - Get single student
router.get('/:id', getStudentById);

// POST /api/students - Create new student
router.post('/', createStudent);

// PUT /api/students/:id - Update student
router.put('/:id', updateStudent);

// DELETE /api/students/:id - Delete student
router.delete('/:id', deleteStudent);

export default router;
