import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseClient = null;

if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)) {
  supabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  console.log('[SUPABASE] Client successfully connected to:', env.SUPABASE_URL);
} else {
  console.warn('[SUPABASE] Credentials not provided in environment. Running in in-memory simulation mode for local testing.');
}

// In-memory data store for local development/testing without live Supabase
export const memoryStore = {
  users: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'farmer@agrismart.io',
      full_name: 'Ramesh Patel',
      phone: '+919876543210',
      state: 'Karnataka',
      district: 'Mandya',
      village: 'Somanahalli',
      preferred_language: 'en',
      farming_experience: 12,
      role: 'farmer',
      created_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'expert@agrismart.io',
      full_name: 'Dr. Anita Rao',
      phone: '+919876543211',
      state: 'Karnataka',
      district: 'Bengaluru',
      village: 'GKVK',
      preferred_language: 'en',
      farming_experience: 18,
      role: 'expert',
      created_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'admin@agrismart.io',
      full_name: 'Super Admin',
      phone: '+919876543212',
      state: 'National',
      district: 'HQ',
      village: 'Central',
      preferred_language: 'en',
      farming_experience: 20,
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ],
  farms: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      user_id: '00000000-0000-0000-0000-000000000001',
      farm_name: 'Green Valley Mandya Farm',
      address: 'Near KRS Canal, Somanahalli',
      state: 'Karnataka',
      district: 'Mandya',
      village: 'Somanahalli',
      latitude: 12.5234,
      longitude: 76.8967,
      area: 4.5,
      area_unit: 'acre',
      soil_type: 'red_soil',
      water_source: 'Canal & Borewell',
      irrigation_method: 'Drip Irrigation',
      created_at: new Date().toISOString()
    }
  ],
  soil_tests: [
    {
      id: '22222222-2222-2222-2222-222222222222',
      farm_id: '11111111-1111-1111-1111-111111111111',
      user_id: '00000000-0000-0000-0000-000000000001',
      soil_type: 'red_soil',
      soil_ph: 6.5,
      nitrogen: 210.0,
      phosphorus: 24.5,
      potassium: 165.0,
      organic_carbon: 0.65,
      electrical_conductivity: 0.72,
      soil_moisture: 35.0,
      measurement_units: { nitrogen: 'kg/ha', phosphorus: 'kg/ha', potassium: 'kg/ha' },
      test_date: '2026-10-15',
      created_at: new Date().toISOString()
    }
  ],
  crops: [
    {
      id: '33333333-3333-3333-3333-333333333333',
      user_id: '00000000-0000-0000-0000-000000000001',
      farm_id: '11111111-1111-1111-1111-111111111111',
      crop_name: 'Paddy (Rice)',
      variety: 'JGL 1798',
      season: 'Kharif',
      growth_stage: 'Tillering',
      planting_date: '2026-08-10',
      expected_harvest_date: '2026-12-15',
      cultivated_area: 2.5,
      status: 'active',
      created_at: new Date().toISOString()
    }
  ],
  advisory_reports: [],
  disease_analyses: [],
  weather_records: [],
  advisory_feedback: [],
  expert_reviews: []
};

export const supabase = supabaseClient;
