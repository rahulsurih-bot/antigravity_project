import { Router } from 'express';
import { getCurrentWeather, getForecast } from '../controllers/weather.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/:farmId/current', getCurrentWeather);
router.get('/:farmId/forecast', getForecast);

export default router;
