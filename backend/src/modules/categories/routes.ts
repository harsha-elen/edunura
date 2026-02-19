import { Router } from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats,
} from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public route - anyone can view categories
router.get('/', getAllCategories);

// All other routes require authentication
router.use(authenticate);

// GET /api/categories/stats - Get category statistics
router.get('/stats', getCategoryStats);

// GET /api/categories/:id - Get single category
router.get('/:id', getCategoryById);

// POST /api/categories - Create new category
router.post('/', createCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', deleteCategory);

export default router;
