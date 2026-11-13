import { Router } from 'express';
import {
  handleCropRecommendation,
  handleDiseaseDetection,
  handleFertilizerAdvisory,
  handleIrrigationAdvisory,
  handleWeatherAdvisory
} from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';
import {
  CropRecommendationRequestSchema,
  FertilizerAdvisoryRequestSchema,
  IrrigationAdvisoryRequestSchema,
  WeatherAdvisoryRequestSchema
} from '../schemas/agronomy.schema.js';

const router = Router();

router.use(requireAuth);
router.use(aiRateLimiter);

router.post('/crop-recommendation', validate(CropRecommendationRequestSchema), handleCropRecommendation);
router.post('/disease-detection', uploadImage.single('image'), handleDiseaseDetection);
router.post('/fertilizer-advisory', validate(FertilizerAdvisoryRequestSchema), handleFertilizerAdvisory);
router.post('/irrigation-advisory', validate(IrrigationAdvisoryRequestSchema), handleIrrigationAdvisory);
router.post('/weather-advisory', validate(WeatherAdvisoryRequestSchema), handleWeatherAdvisory);

export default router;
