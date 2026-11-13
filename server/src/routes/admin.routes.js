import { Router } from 'express';
import {
  getPlatformStats,
  listAllUsers,
  updateUserRole
} from '../controllers/admin.controller.js';
import { listAdvisories } from '../controllers/advisory.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/dashboard', getPlatformStats);
router.get('/users', listAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/advisories', listAdvisories);

export default router;
