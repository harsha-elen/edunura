import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from './controller';

const router = Router();

// All routes require authentication + admin/moderator role
router.use(authenticate);
router.use(authorize('admin', 'moderator'));

// User routes
router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
