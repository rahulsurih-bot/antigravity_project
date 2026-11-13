import { Router } from 'express';
import { getMe, updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { UpdateProfileSchema } from '../schemas/agronomy.schema.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, validate(UpdateProfileSchema), updateProfile);

export default router;
