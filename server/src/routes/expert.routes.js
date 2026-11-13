import { Router } from 'express';
import { listAssignedReviews, submitReviewFeedback } from '../controllers/expert.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { ExpertReviewSchema } from '../schemas/agronomy.schema.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('expert', 'admin'));

router.get('/reviews', listAssignedReviews);
router.patch('/reviews/:id', validate(ExpertReviewSchema), submitReviewFeedback);

export default router;
