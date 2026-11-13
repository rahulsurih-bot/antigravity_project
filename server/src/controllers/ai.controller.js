import {
  generateCropRecommendation,
  analyzeCropDisease,
  generateFertilizerAdvisory,
  generateIrrigationAdvisory,
  generateWeatherAdvisory
} from '../services/ai/gemini.service.js';
import { fetchFarmWeather } from '../services/weather/weather.service.js';
import { uploadCropImage } from '../services/storage/storage.service.js';
import { supabase, memoryStore } from '../config/supabase.js';
import crypto from 'crypto';

// Helper to save advisory to DB or memoryStore
async function saveAdvisoryReport({ userId, farmId, cropId, advisoryType, inputData, resultData, confidence }) {
  const payload = {
    user_id: userId,
    farm_id: farmId || null,
    crop_id: cropId || null,
    advisory_type: advisoryType,
    input_data: inputData,
    result_data: resultData,
    confidence_level: confidence || resultData.confidence || 'medium',
    model_version: 'gemini-2.5-flash',
    status: 'completed'
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('advisory_reports')
      .insert(payload)
      .select()
      .single();

    if (!error && data) return data;
  }

  const newReport = {
    id: crypto.randomUUID(),
    ...payload,
    created_at: new Date().toISOString()
  };
  memoryStore.advisory_reports.unshift(newReport);
  return newReport;
}

export async function handleCropRecommendation(req, res) {
  try {
    const input = req.body;
    let farmContext = null;

    if (input.farm_id) {
      if (supabase) {
        const { data } = await supabase.from('farms').select('*').eq('id', input.farm_id).single();
        farmContext = data;
      } else {
        farmContext = memoryStore.farms.find(f => f.id === input.farm_id);
      }
      if (farmContext) {
        input.location = input.location || `${farmContext.village || farmContext.district}, ${farmContext.state}`;
        input.soil_type = input.soil_type || farmContext.soil_type;
        input.available_water = input.available_water || farmContext.water_source;
      }
    }

    const aiResult = await generateCropRecommendation(input);

    const saved = await saveAdvisoryReport({
      userId: req.user.id,
      farmId: input.farm_id,
      advisoryType: 'crop_recommendation',
      inputData: input,
      resultData: aiResult,
      confidence: aiResult.confidence
    });

    res.status(200).json({
      success: true,
      message: 'Crop recommendation generated successfully',
      data: {
        advisory_id: saved.id,
        ...aiResult
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate crop recommendation',
      data: null,
      error: { code: 'AI_CROP_ADVISORY_ERROR', details: [err.message] }
    });
  }
}

export async function handleDiseaseDetection(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Plant photograph file is required.',
        data: null,
        error: { code: 'MISSING_IMAGE', details: ['Please attach a JPG, PNG, or WEBP plant image.'] }
      });
    }

    const { crop_name, observed_symptoms, farm_id, language } = req.body;

    // 1. Upload and persist file path
    const imagePath = await uploadCropImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user.id
    );

    // 2. Perform Gemini Multimodal Vision Analysis
    const aiResult = await analyzeCropDisease(
      req.file.buffer,
      req.file.mimetype,
      crop_name || 'Crop Sample',
      observed_symptoms,
      language || req.user.preferred_language || 'en'
    );

    // 3. Save to disease_analyses table
    const diseaseRecord = {
      id: crypto.randomUUID(),
      user_id: req.user.id,
      farm_id: farm_id || null,
      crop_name: crop_name || 'Crop Sample',
      image_path: imagePath,
      observed_symptoms: observed_symptoms || null,
      ai_result: aiResult,
      confidence_level: aiResult.confidence,
      expert_verified: false,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      await supabase.from('disease_analyses').insert(diseaseRecord);
    } else {
      memoryStore.disease_analyses.unshift(diseaseRecord);
    }

    // 4. Save to advisory_reports
    const saved = await saveAdvisoryReport({
      userId: req.user.id,
      farmId: farm_id,
      advisoryType: 'disease_detection',
      inputData: { crop_name, observed_symptoms, image_path: imagePath },
      resultData: aiResult,
      confidence: aiResult.confidence
    });

    res.status(200).json({
      success: true,
      message: 'Plant disease analysis completed successfully',
      data: {
        advisory_id: saved.id,
        analysis_id: diseaseRecord.id,
        image_path: imagePath,
        ...aiResult
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to process plant disease analysis',
      data: null,
      error: { code: 'AI_DISEASE_ANALYSIS_ERROR', details: [err.message] }
    });
  }
}

export async function handleFertilizerAdvisory(req, res) {
  try {
    const input = req.body;

    const aiResult = await generateFertilizerAdvisory(input);

    const saved = await saveAdvisoryReport({
      userId: req.user.id,
      farmId: input.farm_id,
      advisoryType: 'fertilizer',
      inputData: input,
      resultData: aiResult,
      confidence: aiResult.confidence
    });

    res.status(200).json({
      success: true,
      message: 'Fertilizer & nutrient advisory generated successfully',
      data: {
        advisory_id: saved.id,
        ...aiResult
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate fertilizer guidance',
      data: null,
      error: { code: 'AI_FERTILIZER_ERROR', details: [err.message] }
    });
  }
}

export async function handleIrrigationAdvisory(req, res) {
  try {
    const input = req.body;

    const aiResult = await generateIrrigationAdvisory(input);

    const saved = await saveAdvisoryReport({
      userId: req.user.id,
      farmId: input.farm_id,
      advisoryType: 'irrigation',
      inputData: input,
      resultData: aiResult,
      confidence: aiResult.confidence
    });

    res.status(200).json({
      success: true,
      message: 'Smart irrigation advisory generated successfully',
      data: {
        advisory_id: saved.id,
        ...aiResult
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate irrigation guidance',
      data: null,
      error: { code: 'AI_IRRIGATION_ERROR', details: [err.message] }
    });
  }
}

export async function handleWeatherAdvisory(req, res) {
  try {
    const { farm_id, crop_name, growth_stage, language } = req.body;
    let farm = null;

    if (supabase) {
      const { data } = await supabase.from('farms').select('*').eq('id', farm_id).single();
      farm = data;
    } else {
      farm = memoryStore.farms.find(f => f.id === farm_id);
    }

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found for localized weather advisory.',
        data: null,
        error: { code: 'FARM_NOT_FOUND', details: ['Invalid farm ID.'] }
      });
    }

    // Fetch verified meteorological data
    const weatherData = await fetchFarmWeather(farm.latitude, farm.longitude);

    // Save weather record
    const weatherRecord = {
      id: crypto.randomUUID(),
      farm_id: farm.id,
      user_id: req.user.id,
      ...weatherData.current
    };

    if (supabase) {
      await supabase.from('weather_records').insert(weatherRecord);
    } else {
      memoryStore.weather_records.unshift(weatherRecord);
    }

    const locationName = `${farm.village || farm.district || 'Mandya'}, ${farm.state || 'Karnataka'}`;

    // AI Weather Risk synthesis
    const aiResult = await generateWeatherAdvisory(
      locationName,
      weatherData.current,
      crop_name,
      growth_stage,
      language || req.user.preferred_language || 'en'
    );

    const saved = await saveAdvisoryReport({
      userId: req.user.id,
      farmId: farm.id,
      advisoryType: 'weather',
      inputData: { farm_id, crop_name, growth_stage, telemetry: weatherData.current },
      resultData: { ...aiResult, weather_telemetry: weatherData.current, forecast: weatherData.forecast },
      confidence: aiResult.confidence
    });

    res.status(200).json({
      success: true,
      message: 'Weather agricultural advisory generated successfully',
      data: {
        advisory_id: saved.id,
        current_weather: weatherData.current,
        forecast: weatherData.forecast,
        ...aiResult
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate weather advisory',
      data: null,
      error: { code: 'AI_WEATHER_ERROR', details: [err.message] }
    });
  }
}
