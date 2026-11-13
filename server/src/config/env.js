import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api/v1',
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  
  // Google Gemini AI (@google/genai)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  GEMINI_VISION_MODEL: process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash',
  
  // Weather Provider
  WEATHER_PROVIDER: process.env.WEATHER_PROVIDER || 'open-meteo',
  WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
  WEATHER_API_BASE_URL: process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1',
  
  // Limits
  MAX_IMAGE_SIZE_MB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '8', 10),
  AI_REQUEST_TIMEOUT_MS: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '60000', 10),
  AI_MAX_RETRIES: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
  UPLOAD_BUCKET: process.env.UPLOAD_BUCKET || 'crop-images',
};

export function validateConfig() {
  const missing = [];
  if (!env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_ANON_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    console.warn(`[CONFIG WARNING] Missing configuration for: ${missing.join(', ')}.`);
    console.warn(`[CONFIG WARNING] Operating with safe local fallback boundaries for local onboarding & testing.`);
  } else {
    console.log(`[CONFIG] Environment successfully initialized in ${env.NODE_ENV} mode.`);
  }
}
