import { Router } from 'express';
import {
  listCrops,
  createCrop,
  getCrop,
  updateCrop,
  deleteCrop
} from '../controllers/crop.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { CreateCropSchema, UpdateCropSchema } from '../schemas/agronomy.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', listCrops);
router.post('/', validate(CreateCropSchema), createCrop);
router.get('/:id', getCrop);
router.patch('/:id', validate(UpdateCropSchema), updateCrop);
router.delete('/:id', deleteCrop);

export default router;
