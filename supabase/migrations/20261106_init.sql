-- ============================================================================
-- AGRISENSE AI: PRODUCTION DATABASE MIGRATION SCRIPT
-- PostgreSQL 15+ compatible (Supabase)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('farmer', 'agronomist', 'enterprise_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE soil_type_enum AS ENUM (
        'alluvial', 'black_regur', 'red_yellow', 'laterite', 
        'sandy_loam', 'clay_loam', 'saline_alkaline'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE irrigation_system_enum AS ENUM (
        'drip', 'sprinkler', 'flood_furrow', 'rainfed_pivot', 'manual_basin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE season_enum AS ENUM ('kharif', 'rabi', 'zaid', 'year_round');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE disease_severity_enum AS ENUM ('low', 'moderate', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'es', 'te', 'mr', 'pa')),
    measurement_unit TEXT DEFAULT 'metric' CHECK (measurement_unit IN ('metric', 'imperial')),
    role user_role_enum DEFAULT 'farmer',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Farm Parcels Table
CREATE TABLE IF NOT EXISTS public.farm_parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    parcel_name TEXT NOT NULL,
    area_acres NUMERIC(8,2) NOT NULL CHECK (area_acres > 0),
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    soil_type soil_type_enum NOT NULL,
    irrigation_system irrigation_system_enum NOT NULL,
    elevation_meters NUMERIC(6,1) DEFAULT 100.0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Soil Test Records
CREATE TABLE IF NOT EXISTS public.soil_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES public.farm_parcels(id) ON DELETE CASCADE NOT NULL,
    test_date DATE DEFAULT CURRENT_DATE NOT NULL,
    nitrogen_kg_ha NUMERIC(6,2) NOT NULL CHECK (nitrogen_kg_ha >= 0),
    phosphorus_kg_ha NUMERIC(6,2) NOT NULL CHECK (phosphorus_kg_ha >= 0),
    potassium_kg_ha NUMERIC(6,2) NOT NULL CHECK (potassium_kg_ha >= 0),
    ph_level NUMERIC(4,2) NOT NULL CHECK (ph_level BETWEEN 3.0 AND 11.0),
    organic_carbon_pct NUMERIC(4,2) DEFAULT 0.5 CHECK (organic_carbon_pct >= 0),
    electrical_conductivity_ds_m NUMERIC(5,2) DEFAULT 0.8 CHECK (electrical_conductivity_ds_m >= 0),
    lab_report_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. AI Crop Recommendations
CREATE TABLE IF NOT EXISTS public.crop_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES public.farm_parcels(id) ON DELETE CASCADE NOT NULL,
    season season_enum NOT NULL,
    budget_level TEXT DEFAULT 'medium' CHECK (budget_level IN ('low', 'medium', 'high')),
    raw_ai_response JSONB NOT NULL,
    primary_crop_name TEXT NOT NULL,
    estimated_yield_per_acre TEXT NOT NULL,
    expected_profit_margin_rating TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Plant Pathology & Pest Scans
CREATE TABLE IF NOT EXISTS public.disease_diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES public.farm_parcels(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    image_storage_path TEXT NOT NULL,
    crop_species TEXT,
    diagnosed_condition TEXT NOT NULL,
    causal_agent_type TEXT NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    severity disease_severity_enum NOT NULL,
    immediate_action_required BOOLEAN DEFAULT true,
    treatment_protocol JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Dynamic Irrigation Schedules
CREATE TABLE IF NOT EXISTS public.irrigation_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES public.farm_parcels(id) ON DELETE CASCADE NOT NULL,
    crop_name TEXT NOT NULL,
    sowing_date DATE NOT NULL,
    current_growth_stage TEXT NOT NULL,
    calculated_daily_et_mm NUMERIC(5,2) NOT NULL,
    schedule_data JSONB NOT NULL,
    valid_until DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Fertilizer Split Calculations
CREATE TABLE IF NOT EXISTS public.fertilizer_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES public.farm_parcels(id) ON DELETE CASCADE NOT NULL,
    crop_name TEXT NOT NULL,
    target_yield_metric_tons NUMERIC(6,2) NOT NULL,
    urea_bags_50kg NUMERIC(6,2) NOT NULL,
    dap_bags_50kg NUMERIC(6,2) NOT NULL,
    mop_bags_50kg NUMERIC(6,2) NOT NULL,
    micronutrient_notes JSONB NOT NULL,
    split_schedule JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Chat Sessions & Messages
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    parcel_id UUID REFERENCES public.farm_parcels(id) ON DELETE SET NULL,
    session_title TEXT DEFAULT 'Agronomic Consultation',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'assistant', 'system')),
    message_text TEXT NOT NULL,
    audio_transcription_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Indexes for Maximum Read Performance
CREATE INDEX IF NOT EXISTS idx_farm_parcels_user ON public.farm_parcels(user_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_parcel ON public.soil_tests(parcel_id);
CREATE INDEX IF NOT EXISTS idx_crop_recommendations_parcel ON public.crop_recommendations(parcel_id);
CREATE INDEX IF NOT EXISTS idx_disease_diagnoses_user ON public.disease_diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_parcel ON public.irrigation_schedules(parcel_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_plans_parcel ON public.fertilizer_plans(parcel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);

-- 12. Automated User Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'AgriSense Farmer'),
        NEW.phone
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fertilizer_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 14. Define RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Farm Parcels
DROP POLICY IF EXISTS "Users can CRUD own farm parcels" ON public.farm_parcels;
CREATE POLICY "Users can CRUD own farm parcels" 
    ON public.farm_parcels FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Soil Tests
DROP POLICY IF EXISTS "Users can CRUD soil tests for their parcels" ON public.soil_tests;
CREATE POLICY "Users can CRUD soil tests for their parcels" 
    ON public.soil_tests FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_parcels 
            WHERE farm_parcels.id = soil_tests.parcel_id 
            AND farm_parcels.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farm_parcels 
            WHERE farm_parcels.id = soil_tests.parcel_id 
            AND farm_parcels.user_id = auth.uid()
        )
    );

-- Crop Recommendations
DROP POLICY IF EXISTS "Users can view recommendations for their parcels" ON public.crop_recommendations;
CREATE POLICY "Users can view recommendations for their parcels" 
    ON public.crop_recommendations FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_parcels 
            WHERE farm_parcels.id = crop_recommendations.parcel_id 
            AND farm_parcels.user_id = auth.uid()
        )
    );

-- Disease Diagnoses
DROP POLICY IF EXISTS "Users can view and create their own diagnoses" ON public.disease_diagnoses;
CREATE POLICY "Users can view and create their own diagnoses" 
    ON public.disease_diagnoses FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Irrigation Schedules
DROP POLICY IF EXISTS "Users can view irrigation plans for their parcels" ON public.irrigation_schedules;
CREATE POLICY "Users can view irrigation plans for their parcels" 
    ON public.irrigation_schedules FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_parcels 
            WHERE farm_parcels.id = irrigation_schedules.parcel_id 
            AND farm_parcels.user_id = auth.uid()
        )
    );

-- Fertilizer Plans
DROP POLICY IF EXISTS "Users can view fertilizer plans for their parcels" ON public.fertilizer_plans;
CREATE POLICY "Users can view fertilizer plans for their parcels" 
    ON public.fertilizer_plans FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_parcels 
            WHERE farm_parcels.id = fertilizer_plans.parcel_id 
            AND farm_parcels.user_id = auth.uid()
        )
    );

-- Chat Sessions & Messages
DROP POLICY IF EXISTS "Users can CRUD own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can CRUD own chat sessions" 
    ON public.chat_sessions FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD messages in own sessions" ON public.chat_messages;
CREATE POLICY "Users can CRUD messages in own sessions" 
    ON public.chat_messages FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id 
            AND chat_sessions.user_id = auth.uid()
        )
    );
