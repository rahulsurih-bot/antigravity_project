import { z } from 'zod';

// ==========================================
// 1. User & Profile Schemas
// ==========================================
export const UpdateProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name must have at least 2 characters').max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format').optional().or(z.literal('')),
  state: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  village: z.string().max(100).optional(),
  preferred_language: z.enum(['en', 'kn', 'hi']).default('en'),
  farming_experience: z.number().int().min(0).max(80).optional(),
});

// ==========================================
// 2. Farm Management Schemas
// ==========================================
export const CreateFarmSchema = z.object({
  farm_name: z.string().min(2, 'Farm name must be at least 2 characters').max(100),
  address: z.string().max(255).optional(),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  village: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  area: z.number().positive('Area must be a positive number'),
  area_unit: z.enum(['acre', 'hectare', 'guntha', 'bigha']).default('acre'),
  soil_type: z.string().optional(),
  water_source: z.string().optional(),
  irrigation_method: z.string().optional(),
});

export const UpdateFarmSchema = CreateFarmSchema.partial();

// ==========================================
// 3. Soil Testing Schemas
// ==========================================
export const CreateSoilTestSchema = z.object({
  farm_id: z.string().uuid('Valid farm ID required'),
  soil_type: z.string().optional(),
  soil_ph: z.number().min(3.0, 'pH cannot be lower than 3.0').max(11.0, 'pH cannot exceed 11.0').optional().nullable(),
  nitrogen: z.number().min(0, 'Nitrogen must be positive').max(2000).optional().nullable(),
  phosphorus: z.number().min(0, 'Phosphorus must be positive').max(1000).optional().nullable(),
  potassium: z.number().min(0, 'Potassium must be positive').max(2000).optional().nullable(),
  organic_carbon: z.number().min(0).max(15.0).optional().nullable(),
  electrical_conductivity: z.number().min(0).max(30.0).optional().nullable(),
  soil_moisture: z.number().min(0).max(100.0).optional().nullable(),
  measurement_units: z.record(z.string()).optional(),
  test_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
});

// ==========================================
// 4. Crop Management Schemas
// ==========================================
export const CreateCropSchema = z.object({
  farm_id: z.string().uuid('Valid farm ID required'),
  crop_name: z.string().min(2, 'Crop name must have at least 2 characters'),
  variety: z.string().optional(),
  season: z.enum(['Kharif', 'Rabi', 'Zaid', 'Year-round']).optional(),
  growth_stage: z.string().optional(),
  planting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expected_harvest_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  cultivated_area: z.number().positive('Cultivated area must be greater than zero'),
  status: z.enum(['active', 'harvested', 'cancelled']).default('active'),
});

export const UpdateCropSchema = CreateCropSchema.partial();

// ==========================================
// 5. AI Request Schemas
// ==========================================
export const CropRecommendationRequestSchema = z.object({
  farm_id: z.string().uuid().optional(),
  location: z.string().optional(),
  soil_type: z.string().optional(),
  soil_ph: z.number().min(3.0).max(11.0).optional().nullable(),
  nitrogen: z.number().min(0).optional().nullable(),
  phosphorus: z.number().min(0).optional().nullable(),
  potassium: z.number().min(0).optional().nullable(),
  organic_carbon: z.number().min(0).optional().nullable(),
  available_water: z.string().optional(),
  season: z.string().optional(),
  expected_planting_date: z.string().optional().nullable(),
  preferred_crop_category: z.string().optional(),
  additional_information: z.string().max(1000).optional(),
  language: z.enum(['en', 'kn', 'hi']).default('en'),
});

export const DiseaseDetectionRequestSchema = z.object({
  farm_id: z.string().uuid().optional(),
  crop_name: z.string().min(2, 'Crop name is required'),
  crop_growth_stage: z.string().optional(),
  plant_part: z.string().optional(),
  observed_symptoms: z.string().max(1000).optional(),
  symptom_duration: z.string().optional(),
  affected_area_percentage: z.string().optional(),
  language: z.enum(['en', 'kn', 'hi']).default('en'),
});

export const FertilizerAdvisoryRequestSchema = z.object({
  farm_id: z.string().uuid().optional(),
  crop_name: z.string().min(2, 'Crop name is required'),
  growth_stage: z.string().optional(),
  cultivated_area: z.number().positive().optional(),
  soil_ph: z.number().min(3.0).max(11.0).optional().nullable(),
  nitrogen: z.number().min(0).optional().nullable(),
  phosphorus: z.number().min(0).optional().nullable(),
  potassium: z.number().min(0).optional().nullable(),
  organic_carbon: z.number().min(0).optional().nullable(),
  previous_fertilizer_application: z.string().max(500).optional(),
  organic_fertilizer_availability: z.string().optional(),
  language: z.enum(['en', 'kn', 'hi']).default('en'),
});

export const IrrigationAdvisoryRequestSchema = z.object({
  farm_id: z.string().uuid().optional(),
  crop_name: z.string().min(2, 'Crop name is required'),
  growth_stage: z.string().optional(),
  soil_type: z.string().optional(),
  soil_moisture: z.number().min(0).max(100).optional().nullable(),
  water_source: z.string().optional(),
  irrigation_method: z.string().optional(),
  last_irrigation_date: z.string().optional().nullable(),
  recent_rainfall_mm: z.number().min(0).optional().nullable(),
  language: z.enum(['en', 'kn', 'hi']).default('en'),
});

export const WeatherAdvisoryRequestSchema = z.object({
  farm_id: z.string().uuid('Farm ID required for localized weather'),
  crop_name: z.string().optional(),
  growth_stage: z.string().optional(),
  language: z.enum(['en', 'kn', 'hi']).default('en'),
});

export const AdvisoryFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
});

export const ExpertReviewSchema = z.object({
  review_status: z.enum(['in_review', 'verified', 'rejected']),
  review_notes: z.string().min(3, 'Review notes must provide context'),
});

// ==========================================
// 6. Strict AI Output Schemas (Matching Section 15)
// ==========================================
export const CropRecommendationResponseSchema = z.object({
  advisory_type: z.literal('crop_recommendation'),
  summary: z.string(),
  recommended_crops: z.array(z.object({
    crop_name: z.string(),
    suitability_score: z.number().min(0).max(100),
    suitability_category: z.enum(['low', 'moderate', 'high', 'very_high']),
    reasoning: z.array(z.string()),
    growing_duration_days: z.number().nullable().optional(),
    water_requirement: z.enum(['low', 'moderate', 'high', 'very_high']),
    season: z.string(),
    important_risks: z.array(z.string()).default([]),
    additional_information_needed: z.array(z.string()).default([])
  })),
  general_recommendations: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  confidence: z.enum(['low', 'medium', 'high'])
});

export const DiseaseDetectionResponseSchema = z.object({
  advisory_type: z.literal('disease_detection'),
  crop_name: z.string(),
  visual_observations: z.array(z.string()),
  possible_conditions: z.array(z.object({
    condition_name: z.string(),
    condition_type: z.string(), // fungal, bacterial, viral, pest, nutrient, environmental, unknown
    confidence: z.enum(['low', 'medium', 'high']),
    supporting_observations: z.array(z.string()),
    alternative_explanations: z.array(z.string()).default([])
  })),
  severity: z.enum(['low', 'moderate', 'critical', 'unknown']),
  recommended_actions: z.array(z.string()),
  prevention: z.array(z.string()),
  professional_verification_required: z.boolean(),
  warnings: z.array(z.string()).default([]),
  confidence: z.enum(['low', 'medium', 'high'])
});

export const FertilizerAdvisoryResponseSchema = z.object({
  advisory_type: z.literal('fertilizer'),
  crop_name: z.string(),
  nutrient_assessment: z.array(z.object({
    nutrient: z.string(),
    status: z.enum(['deficient', 'adequate', 'excessive', 'unknown']),
    reason: z.string()
  })),
  recommendations: z.array(z.string()),
  organic_alternatives: z.array(z.string()),
  application_timing: z.array(z.string()),
  precautions: z.array(z.string()),
  additional_information_needed: z.array(z.string()).default([]),
  confidence: z.enum(['low', 'medium', 'high'])
});

export const IrrigationAdvisoryResponseSchema = z.object({
  advisory_type: z.literal('irrigation'),
  crop_name: z.string(),
  water_status: z.enum(['critical_deficit', 'mild_deficit', 'adequate', 'excessive', 'unknown']),
  irrigation_guidance: z.array(z.string()),
  soil_moisture_guidance: z.array(z.string()),
  water_conservation: z.array(z.string()),
  overwatering_risks: z.array(z.string()),
  additional_information_needed: z.array(z.string()).default([]),
  confidence: z.enum(['low', 'medium', 'high'])
});

export const WeatherAdvisoryResponseSchema = z.object({
  advisory_type: z.literal('weather'),
  location: z.string(),
  observation_time: z.string(),
  weather_summary: z.string(),
  agricultural_alerts: z.array(z.object({
    alert_type: z.string(),
    severity: z.enum(['low', 'moderate', 'critical']),
    description: z.string(),
    recommended_actions: z.array(z.string())
  })),
  general_recommendations: z.array(z.string()),
  data_limitations: z.array(z.string()).default([]),
  confidence: z.enum(['low', 'medium', 'high'])
});
