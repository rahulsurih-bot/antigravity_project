import { Router } from 'express';
import { getSoilTest, deleteSoilTest } from '../controllers/soil.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/:id', getSoilTest);
router.delete('/:id', deleteSoilTest);

export default router;
