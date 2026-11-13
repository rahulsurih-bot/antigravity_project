import { Router } from 'express';
import {
  listFarms,
  createFarm,
  getFarm,
  updateFarm,
  deleteFarm
} from '../controllers/farm.controller.js';
import { listSoilTests, addSoilTest } from '../controllers/soil.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  CreateFarmSchema,
  UpdateFarmSchema,
  CreateSoilTestSchema
} from '../schemas/agronomy.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', listFarms);
router.post('/', validate(CreateFarmSchema), createFarm);
router.get('/:id', getFarm);
router.patch('/:id', validate(UpdateFarmSchema), updateFarm);
router.delete('/:id', deleteFarm);

// Soil test sub-routes
router.get('/:id/soil-tests', listSoilTests);
router.post('/:id/soil-tests', validate(CreateSoilTestSchema), addSoilTest);

export default router;
