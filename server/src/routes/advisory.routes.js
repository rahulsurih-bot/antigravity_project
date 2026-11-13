import { Router } from 'express';
import {
  listAdvisories,
  getAdvisory,
  deleteAdvisory,
  submitFeedback,
  downloadPdf
} from '../controllers/advisory.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { AdvisoryFeedbackSchema } from '../schemas/agronomy.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', listAdvisories);
router.get('/:id', getAdvisory);
router.delete('/:id', deleteAdvisory);
router.post('/:id/feedback', validate(AdvisoryFeedbackSchema), submitFeedback);
router.get('/:id/pdf', downloadPdf);

export default router;
