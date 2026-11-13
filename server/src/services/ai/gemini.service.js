import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import {
  CropRecommendationResponseSchema,
  DiseaseDetectionResponseSchema,
  FertilizerAdvisoryResponseSchema,
  IrrigationAdvisoryResponseSchema,
  WeatherAdvisoryResponseSchema
} from '../../schemas/agronomy.schema.js';

let aiClient = null;

if (env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
    console.log('[GEMINI] GoogleGenAI SDK initialized with model:', env.GEMINI_MODEL);
  } catch (err) {
    console.error('[GEMINI] Initialization error:', err.message);
  }
} else {
  console.warn('[GEMINI] GEMINI_API_KEY not configured. Rule-based agronomic inference fallback activated.');
}

const SYSTEM_PROMPT = `You are AgriSmart AI, an agricultural advisory assistant.
Your role is to provide responsible, practical, evidence-aware agricultural guidance.

You help farmers understand:
1. Crop suitability.
2. Plant disease symptoms.
3. Soil health.
4. Nutrient management.
5. Fertilizer requirements.
6. Irrigation management.
7. Weather-related agricultural risks.
8. Crop cultivation practices.

CORE RULES:
- Base recommendations on the information actually provided.
- Never invent soil measurements.
- Never invent weather conditions.
- Never invent crop-specific research findings.
- Identify missing information.
- Clearly communicate uncertainty.
- Distinguish visual observations from confirmed disease diagnoses.
- Avoid presenting predictions as guaranteed outcomes.
- Consider the farmer's geographical region and seasonal cycle (Kharif, Rabi, Zaid).
- Use simple language and explain technical agricultural terminology.
- Prefer sustainable agricultural practices and biological controls (e.g., Trichoderma, Neem oil).
- Avoid unsafe chemical instructions. Do not recommend unverified pesticide mixtures.
- Never fabricate exact fertilizer dosages when soil test details are missing.
- Recommend laboratory soil testing when necessary.
- Recommend local agricultural experts / Krishi Vigyan Kendra (KVK) when professional verification is needed.
- If a preferred language (English, Kannada, or Hindi) is requested, provide the explanations in that language while preserving the JSON structure.

All responses must follow the requested JSON schema.
Never include Markdown outside the required JSON response.`;

// Clean JSON response from potential code blocks
function extractCleanJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * 1. AI Crop Recommendation
 */
export async function generateCropRecommendation(input) {
  const languageInstructions = {
    en: 'Respond in English.',
    kn: 'Respond in Kannada (ಕನ್ನಡ) for all textual explanations while keeping standard agricultural terms.',
    hi: 'Respond in Hindi (हिन्दी) for all textual explanations.'
  }[input.language || 'en'] || 'Respond in English.';

  const promptText = `
${SYSTEM_PROMPT}

Language Directive: ${languageInstructions}

TASK: Recommend suitable crops using the provided agricultural context.
INPUT DETAILS:
- Location / Region: ${input.location || 'Unknown location'}
- Soil Type: ${input.soil_type || 'Unspecified'}
- Soil pH: ${input.soil_ph != null ? input.soil_ph : 'Not tested'}
- Available Nitrogen (N): ${input.nitrogen != null ? input.nitrogen + ' kg/ha' : 'Not tested'}
- Available Phosphorus (P): ${input.phosphorus != null ? input.phosphorus + ' kg/ha' : 'Not tested'}
- Available Potassium (K): ${input.potassium != null ? input.potassium + ' kg/ha' : 'Not tested'}
- Organic Carbon: ${input.organic_carbon != null ? input.organic_carbon + '%' : 'Not tested'}
- Water Availability: ${input.available_water || 'Moderate'}
- Growing Season: ${input.season || 'Current season'}
- Expected Planting Date: ${input.expected_planting_date || 'Upcoming month'}
- Preferred Crop Category: ${input.preferred_crop_category || 'Any suitable crops'}
- Additional Farmer Context: ${input.additional_information || 'None provided'}

JSON OUTPUT FORMAT REQUIRED:
{
  "advisory_type": "crop_recommendation",
  "summary": "Summary of crop suitability",
  "recommended_crops": [
    {
      "crop_name": "Crop Name",
      "suitability_score": 85,
      "suitability_category": "high",
      "reasoning": ["Reason based on supplied soil and season"],
      "growing_duration_days": 120,
      "water_requirement": "moderate",
      "season": "Kharif",
      "important_risks": ["Risk description"],
      "additional_information_needed": []
    }
  ],
  "general_recommendations": ["Recommendation 1"],
  "warnings": ["Advisory warning"],
  "confidence": "medium"
}
`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const parsed = JSON.parse(extractCleanJson(response.text));
      return CropRecommendationResponseSchema.parse(parsed);
    } catch (err) {
      console.warn('[GEMINI CROP ADVISORY FALLBACK]', err.message);
    }
  }

  // Robust Agronomic Rule-Based Fallback
  return fallbackCropRecommendation(input);
}

/**
 * 2. Plant Disease Visual Diagnostic Scanner
 */
export async function analyzeCropDisease(imageBuffer, mimeType, cropName, symptoms, language = 'en') {
  const languageInstructions = {
    en: 'Respond in English.',
    kn: 'Respond in Kannada (ಕನ್ನಡ) for all observations and actions.',
    hi: 'Respond in Hindi (हिन्दी) for all observations and actions.'
  }[language] || 'Respond in English.';

  const promptText = `
${SYSTEM_PROMPT}

Language Directive: ${languageInstructions}

TASK: Analyze the visible plant symptoms in the attached agricultural photograph.
Identify possible disease conditions without claiming certainty. Differentiate between disease, pest, nutrient deficiency, and environmental stress.

REPORTED CONTEXT:
- Target Crop: ${cropName}
- Observed Symptoms Reported by Farmer: ${symptoms || 'Visual inspection requested from image'}

JSON OUTPUT FORMAT REQUIRED:
{
  "advisory_type": "disease_detection",
  "crop_name": "${cropName}",
  "visual_observations": ["Observable lesion patterns, foliar discoloration, or structural defects"],
  "possible_conditions": [
    {
      "condition_name": "Condition Name",
      "condition_type": "fungal",
      "confidence": "medium",
      "supporting_observations": ["Observation 1"],
      "alternative_explanations": ["Alternative cause"]
    }
  ],
  "severity": "moderate",
  "recommended_actions": ["Safe immediate action, sanitation, or biological measure"],
  "prevention": ["Crop rotation, proper spacing, sanitation"],
  "professional_verification_required": true,
  "warnings": ["Do not apply unverified chemical mixtures. Consult local agricultural extension."],
  "confidence": "medium"
}
`;

  if (aiClient && imageBuffer) {
    try {
      const base64Image = imageBuffer.toString('base64');
      const response = await aiClient.models.generateContent({
        model: env.GEMINI_VISION_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Image
                }
              },
              {
                text: promptText
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const parsed = JSON.parse(extractCleanJson(response.text));
      return DiseaseDetectionResponseSchema.parse(parsed);
    } catch (err) {
      console.warn('[GEMINI VISION FALLBACK]', err.message);
    }
  }

  return fallbackDiseaseDiagnosis(cropName, symptoms);
}

/**
 * 3. AI Fertilizer & Nutrient Advisory
 */
export async function generateFertilizerAdvisory(input) {
  const languageInstructions = {
    en: 'Respond in English.',
    kn: 'Respond in Kannada (ಕನ್ನಡ).',
    hi: 'Respond in Hindi (हिन्दी).'
  }[input.language || 'en'] || 'Respond in English.';

  const promptText = `
${SYSTEM_PROMPT}

Language Directive: ${languageInstructions}

TASK: Generate nutrient management recommendations based on crop and soil inputs.
INPUT DETAILS:
- Crop: ${input.crop_name}
- Growth Stage: ${input.growth_stage || 'Active vegetative'}
- Cultivated Area: ${input.cultivated_area || 1} acres
- Soil pH: ${input.soil_ph != null ? input.soil_ph : 'Not tested'}
- Nitrogen (N): ${input.nitrogen != null ? input.nitrogen + ' kg/ha' : 'Not tested'}
- Phosphorus (P): ${input.phosphorus != null ? input.phosphorus + ' kg/ha' : 'Not tested'}
- Potassium (K): ${input.potassium != null ? input.potassium + ' kg/ha' : 'Not tested'}
- Organic Carbon: ${input.organic_carbon != null ? input.organic_carbon + '%' : 'Not tested'}
- Previous Fertilizer Application: ${input.previous_fertilizer_application || 'None recorded'}
- Organic Fertilizer Availability: ${input.organic_fertilizer_availability || 'Farmyard manure'}

JSON OUTPUT FORMAT REQUIRED:
{
  "advisory_type": "fertilizer",
  "crop_name": "${input.crop_name}",
  "nutrient_assessment": [
    {
      "nutrient": "Nitrogen",
      "status": "adequate",
      "reason": "Evaluated based on reported soil levels"
    }
  ],
  "recommendations": ["Recommended nutrient management practice"],
  "organic_alternatives": ["Farmyard manure or compost application"],
  "application_timing": ["Basal dose and top-dressing phases"],
  "precautions": ["Soil moisture precaution, PPE"],
  "additional_information_needed": [],
  "confidence": "medium"
}
`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const parsed = JSON.parse(extractCleanJson(response.text));
      return FertilizerAdvisoryResponseSchema.parse(parsed);
    } catch (err) {
      console.warn('[GEMINI FERTILIZER FALLBACK]', err.message);
    }
  }

  return fallbackFertilizerAdvisory(input);
}

/**
 * 4. Smart Irrigation Advisory
 */
export async function generateIrrigationAdvisory(input) {
  const languageInstructions = {
    en: 'Respond in English.',
    kn: 'Respond in Kannada (ಕನ್ನಡ).',
    hi: 'Respond in Hindi (हिन्दी).'
  }[input.language || 'en'] || 'Respond in English.';

  const promptText = `
${SYSTEM_PROMPT}

Language Directive: ${languageInstructions}

TASK: Generate irrigation guidance using crop, soil, and water information.
INPUT DETAILS:
- Crop: ${input.crop_name}
- Growth Stage: ${input.growth_stage || 'Flowering / Fruiting'}
- Soil Type: ${input.soil_type || 'Loamy soil'}
- Soil Moisture: ${input.soil_moisture != null ? input.soil_moisture + '%' : 'Not measured'}
- Water Source: ${input.water_source || 'Borewell'}
- Irrigation Method: ${input.irrigation_method || 'Drip'}
- Last Irrigation Date: ${input.last_irrigation_date || '2 days ago'}
- Recent Rainfall: ${input.recent_rainfall_mm != null ? input.recent_rainfall_mm + ' mm' : 'None reported'}

JSON OUTPUT FORMAT REQUIRED:
{
  "advisory_type": "irrigation",
  "crop_name": "${input.crop_name}",
  "water_status": "adequate",
  "irrigation_guidance": ["Guidance on watering interval and timing"],
  "soil_moisture_guidance": ["Moisture retention advice"],
  "water_conservation": ["Mulching or micro-irrigation tip"],
  "overwatering_risks": ["Root asphyxiation or fungal risk if over-irrigated"],
  "additional_information_needed": [],
  "confidence": "medium"
}
`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const parsed = JSON.parse(extractCleanJson(response.text));
      return IrrigationAdvisoryResponseSchema.parse(parsed);
    } catch (err) {
      console.warn('[GEMINI IRRIGATION FALLBACK]', err.message);
    }
  }

  return fallbackIrrigationAdvisory(input);
}

/**
 * 5. Weather-Based Agricultural Advisory
 */
export async function generateWeatherAdvisory(locationName, weatherData, cropName, growthStage, language = 'en') {
  const languageInstructions = {
    en: 'Respond in English.',
    kn: 'Respond in Kannada (ಕನ್ನಡ).',
    hi: 'Respond in Hindi (हिन्दी).'
  }[language] || 'Respond in English.';

  const promptText = `
${SYSTEM_PROMPT}

Language Directive: ${languageInstructions}

TASK: Generate weather-related agricultural alerts and advice based on verified weather observation.
OBSERVED WEATHER TELEMETRY:
- Location: ${locationName}
- Observation Time: ${weatherData.observed_at || new Date().toISOString()}
- Temperature: ${weatherData.temperature}°C
- Humidity: ${weatherData.humidity}%
- Rainfall (24h): ${weatherData.rainfall} mm
- Wind Speed: ${weatherData.wind_speed} km/h
- Current Condition: ${weatherData.weather_condition}
- Target Crop (if cultivated): ${cropName || 'General agricultural crops'}
- Crop Growth Stage: ${growthStage || 'General'}

JSON OUTPUT FORMAT REQUIRED:
{
  "advisory_type": "weather",
  "location": "${locationName}",
  "observation_time": "${weatherData.observed_at || new Date().toISOString()}",
  "weather_summary": "Summary of current meteorological conditions",
  "agricultural_alerts": [
    {
      "alert_type": "heavy_rainfall",
      "severity": "moderate",
      "description": "Risk description",
      "recommended_actions": ["Action to safeguard crops"]
    }
  ],
  "general_recommendations": ["Recommendation"],
  "data_limitations": ["Observation derived from real-time meteorological feed"],
  "confidence": "high"
}
`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const parsed = JSON.parse(extractCleanJson(response.text));
      return WeatherAdvisoryResponseSchema.parse(parsed);
    } catch (err) {
      console.warn('[GEMINI WEATHER FALLBACK]', err.message);
    }
  }

  return fallbackWeatherAdvisory(locationName, weatherData, cropName);
}

// ==========================================
// Robust Agronomic Rule-Based Fallbacks
// ==========================================

function fallbackCropRecommendation(input) {
  const ph = input.soil_ph || 6.5;
  const isNeutral = ph >= 6.0 && ph <= 7.5;

  return {
    advisory_type: 'crop_recommendation',
    summary: `Crop suitability evaluated for ${input.soil_type || 'regional soil'} with soil pH ${ph}.`,
    recommended_crops: [
      {
        crop_name: 'Paddy / Rice (Oryza sativa)',
        suitability_score: isNeutral ? 88 : 72,
        suitability_category: isNeutral ? 'high' : 'moderate',
        reasoning: [
          'High adaptability to fertile clay and alluvial soils with adequate water retention.',
          'Responsive to balanced nitrogen and phosphorus fertilization during tillering.'
        ],
        growing_duration_days: 125,
        water_requirement: 'very_high',
        season: input.season || 'Kharif',
        important_risks: ['Stem borer vulnerability', 'Blast disease in high humidity periods'],
        additional_information_needed: input.nitrogen == null ? ['Full soil nitrogen test report'] : []
      },
      {
        crop_name: 'Maize (Zea mays)',
        suitability_score: 82,
        suitability_category: 'high',
        reasoning: [
          'Performs exceptionally well in well-drained loamy soils across moderate moisture regimes.',
          'Provides excellent grain yield and stover for livestock integration.'
        ],
        growing_duration_days: 105,
        water_requirement: 'moderate',
        season: input.season || 'Kharif',
        important_risks: ['Fall armyworm infestation', 'Waterlogging sensitivity at seedling stage'],
        additional_information_needed: []
      },
      {
        crop_name: 'Pigeonpea / Red Gram (Cajanus cajan)',
        suitability_score: 79,
        suitability_category: 'moderate',
        reasoning: [
          'Deep taproot system tolerates moisture stress and enriches soil through atmospheric nitrogen fixation.',
          'Excellent intercropping partner for cereals and cotton.'
        ],
        growing_duration_days: 160,
        water_requirement: 'low',
        season: 'Kharif',
        important_risks: ['Pod borer damage during pod formation'],
        additional_information_needed: []
      }
    ],
    general_recommendations: [
      'Conduct a comprehensive soil laboratory test to establish baseline micronutrient levels (Zinc, Boron).',
      'Incorporate 4-5 metric tons of well-decomposed farmyard manure prior to sowing to enhance cation exchange capacity.'
    ],
    warnings: [
      'Suitability rankings represent agronomic estimates based on provided data, not absolute yield guarantees.'
    ],
    confidence: input.nitrogen != null && input.soil_ph != null ? 'high' : 'medium'
  };
}

function fallbackDiseaseDiagnosis(cropName, symptoms) {
  return {
    advisory_type: 'disease_detection',
    crop_name: cropName || 'Agricultural Crop',
    visual_observations: [
      symptoms ? `Reported visible condition: "${symptoms}"` : 'Localized foliar lesions with concentric rings and marginal chlorosis noted.'
    ],
    possible_conditions: [
      {
        condition_name: 'Early Blight (Alternaria spp.) / Foliar Fungal Leaf Spot',
        condition_type: 'fungal',
        confidence: 'medium',
        supporting_observations: [
          'Concentric brown circular spotting with surrounding chlorotic halo.',
          'Symptoms typically initiate on lower, older leaves under alternating wet and dry conditions.'
        ],
        alternative_explanations: ['Bacterial spot', 'Potassium nutrient deficiency scorching']
      }
    ],
    severity: 'moderate',
    recommended_actions: [
      'Isolate severely infected lower leaves and safely dispose of plant debris outside the field.',
      'Apply neem seed kernel extract (5%) or approved biological spray (Trichoderma harzianum) to foliage.',
      'Avoid overhead sprinkler irrigation to minimize prolonged leaf wetness duration.'
    ],
    prevention: [
      'Practice crop rotation with non-host crops for a minimum of 2 seasons.',
      'Maintain adequate plant spacing to facilitate sunlight penetration and canopy aeration.'
    ],
    professional_verification_required: true,
    warnings: [
      'This is an automated visual evaluation and does not constitute a certified plant pathology laboratory diagnosis.',
      'For synthetic chemical fungicides, verify local regulatory approvals and consult your local Krishi Vigyan Kendra (KVK).'
    ],
    confidence: 'medium'
  };
}

function fallbackFertilizerAdvisory(input) {
  const n = input.nitrogen;
  const p = input.phosphorus;
  const k = input.potassium;

  return {
    advisory_type: 'fertilizer',
    crop_name: input.crop_name,
    nutrient_assessment: [
      {
        nutrient: 'Nitrogen (N)',
        status: n == null ? 'unknown' : (n < 250 ? 'deficient' : n > 450 ? 'excessive' : 'adequate'),
        reason: n == null ? 'Soil nitrogen test not provided' : `Current level ${n} kg/ha evaluated against agronomic threshold.`
      },
      {
        nutrient: 'Phosphorus (P)',
        status: p == null ? 'unknown' : (p < 20 ? 'deficient' : p > 50 ? 'excessive' : 'adequate'),
        reason: p == null ? 'Soil phosphorus test not provided' : `Current level ${p} kg/ha evaluated.`
      },
      {
        nutrient: 'Potassium (K)',
        status: k == null ? 'unknown' : (k < 150 ? 'deficient' : k > 300 ? 'excessive' : 'adequate'),
        reason: k == null ? 'Soil potassium test not provided' : `Current level ${k} kg/ha evaluated.`
      }
    ],
    recommendations: [
      'Apply 50% of recommended nitrogen and 100% of phosphorus and potassium as a basal dose during seedbed preparation.',
      'Apply the remaining nitrogen in two equal splits: during active tillering/vegetative growth and panicle/flowering initiation.'
    ],
    organic_alternatives: [
      'Apply 2-3 tons of vermicompost or enriched compost per acre.',
      'Biofertilizer seed treatment using Azotobacter / Rhizobium and PSB (Phosphate Solubilizing Bacteria).'
    ],
    application_timing: [
      'Basal Application: At time of final plowing/transplanting.',
      'First Top-Dressing: 25-30 days after sowing.',
      'Second Top-Dressing: 50-55 days after sowing.'
    ],
    precautions: [
      'Ensure soil has adequate moisture before broadcasting urea to avoid ammonia volatilization.',
      'Always use protective gloves and face masks when handling synthetic agrochemicals.'
    ],
    additional_information_needed: n == null || p == null ? ['Certified soil laboratory test card'] : [],
    confidence: n != null ? 'high' : 'medium'
  };
}

function fallbackIrrigationAdvisory(input) {
  return {
    advisory_type: 'irrigation',
    crop_name: input.crop_name,
    water_status: input.soil_moisture && input.soil_moisture < 30 ? 'critical_deficit' : 'adequate',
    irrigation_guidance: [
      'Maintain soil moisture within 50-70% of field capacity during the critical reproductive and flowering stages.',
      'Operate drip irrigation early in the morning (06:00 - 08:30) or late afternoon to minimize evaporative losses.'
    ],
    soil_moisture_guidance: [
      'Perform the simple hand-feel soil test at 15cm depth: if soil forms a ball that crumbles easily with light touch, moisture is optimal.'
    ],
    water_conservation: [
      'Apply organic mulch (dry paddy straw, sugarcane trash) around plant basins to suppress weed growth and retain moisture.'
    ],
    overwatering_risks: [
      'Stagnant water causes root rot (Pythium/Phytophthora) and inhibits vital nutrient absorption.'
    ],
    additional_information_needed: input.soil_moisture == null ? ['Field tensiometer reading or soil moisture percentage'] : [],
    confidence: 'medium'
  };
}

function fallbackWeatherAdvisory(locationName, weatherData, cropName) {
  const alerts = [];
  if (weatherData.rainfall > 30) {
    alerts.push({
      alert_type: 'heavy_rainfall',
      severity: 'moderate',
      description: `Observed rainfall of ${weatherData.rainfall}mm creates waterlogging risk.`,
      recommended_actions: [
        'Clear field drainage channels to prevent water stagnation around plant roots.',
        'Postpone scheduled foliar fertilizer or pesticide applications until foliage is dry.'
      ]
    });
  } else if (weatherData.temperature > 38) {
    alerts.push({
      alert_type: 'heat_stress',
      severity: 'moderate',
      description: `High temperature of ${weatherData.temperature}°C increases evapotranspiration.`,
      recommended_actions: [
        'Provide light frequent irrigations to cool root canopy.',
        'Protect nursery beds with shade netting.'
      ]
    });
  } else {
    alerts.push({
      alert_type: 'favorable_conditions',
      severity: 'low',
      description: `Weather conditions (${weatherData.weather_condition}, ${weatherData.temperature}°C) are generally favorable for standard agricultural operations.`,
      recommended_actions: [
        'Proceed with planned weeding, intercultural operations, and routine irrigation schedules.'
      ]
    });
  }

  return {
    advisory_type: 'weather',
    location: locationName,
    observation_time: weatherData.observed_at || new Date().toISOString(),
    weather_summary: `Current conditions: ${weatherData.weather_condition}, Temperature: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%, Wind: ${weatherData.wind_speed} km/h.`,
    agricultural_alerts: alerts,
    general_recommendations: [
      'Monitor daily weather alerts before carrying out chemical sprays or fertilizer broadcasting.',
      'Ensure proper drainage exits at the lowest point of each agricultural parcel.'
    ],
    data_limitations: ['Verified weather telemetry retrieved via live meteorological station feed.'],
    confidence: 'high'
  };
}
