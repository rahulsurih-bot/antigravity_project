-- ============================================================================
-- AGRISMART AI: PRODUCTION DATABASE MIGRATION SCRIPT
-- Supabase PostgreSQL 15+ Schema with Strict RLS, Enums, Triggers, & Indexes
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    state TEXT,
    district TEXT,
    village TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'kn', 'hi')),
    farming_experience INTEGER CHECK (farming_experience >= 0),
    role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'expert', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    address TEXT,
    state TEXT,
    district TEXT,
    village TEXT,
    latitude NUMERIC(10,7) CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(10,7) CHECK (longitude BETWEEN -180 AND 180),
    area NUMERIC(12,3) CHECK (area > 0),
    area_unit TEXT NOT NULL DEFAULT 'acre' CHECK (area_unit IN ('acre', 'hectare', 'guntha', 'bigha')),
    soil_type TEXT,
    water_source TEXT,
    irrigation_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Soil Tests Table
CREATE TABLE IF NOT EXISTS public.soil_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    soil_type TEXT,
    soil_ph NUMERIC(4,2) CHECK (soil_ph BETWEEN 3.0 AND 11.0),
    nitrogen NUMERIC(12,4) CHECK (nitrogen >= 0),
    phosphorus NUMERIC(12,4) CHECK (phosphorus >= 0),
    potassium NUMERIC(12,4) CHECK (potassium >= 0),
    organic_carbon NUMERIC(8,4) CHECK (organic_carbon >= 0),
    electrical_conductivity NUMERIC(10,4) CHECK (electrical_conductivity >= 0),
    soil_moisture NUMERIC(6,2) CHECK (soil_moisture BETWEEN 0 AND 100),
    measurement_units JSONB NOT NULL DEFAULT '{"nitrogen":"kg/ha","phosphorus":"kg/ha","potassium":"kg/ha"}',
    test_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Crops Table
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety TEXT,
    season TEXT CHECK (season IN ('Kharif', 'Rabi', 'Zaid', 'Year-round')),
    growth_stage TEXT,
    planting_date DATE,
    expected_harvest_date DATE,
    cultivated_area NUMERIC(12,3) CHECK (cultivated_area > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Advisory Reports Table
CREATE TABLE IF NOT EXISTS public.advisory_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
    advisory_type TEXT NOT NULL CHECK (
        advisory_type IN (
            'crop_recommendation',
            'disease_detection',
            'fertilizer',
            'irrigation',
            'weather'
        )
    ),
    input_data JSONB NOT NULL DEFAULT '{}',
    result_data JSONB NOT NULL,
    confidence_level TEXT,
    model_version TEXT DEFAULT 'gemini-2.5-flash',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Disease Analyses Table
CREATE TABLE IF NOT EXISTS public.disease_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    crop_name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    observed_symptoms TEXT,
    ai_result JSONB NOT NULL,
    confidence_level TEXT,
    expert_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Weather Records Table
CREATE TABLE IF NOT EXISTS public.weather_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    temperature NUMERIC(6,2),
    humidity NUMERIC(6,2),
    rainfall NUMERIC(8,2),
    wind_speed NUMERIC(8,2),
    weather_condition TEXT,
    provider TEXT DEFAULT 'Open-Meteo',
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Advisory Feedback Table
CREATE TABLE IF NOT EXISTS public.advisory_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    advisory_id UUID NOT NULL REFERENCES public.advisory_reports(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Expert Reviews Table
CREATE TABLE IF NOT EXISTS public.expert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisory_id UUID NOT NULL REFERENCES public.advisory_reports(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_review', 'verified', 'rejected')),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Indexes for Query Performance & Isolation
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_farm_id ON public.soil_tests(farm_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_user_id ON public.soil_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_user_id ON public.crops(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON public.crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_advisory_reports_user_created ON public.advisory_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advisory_reports_farm_id ON public.advisory_reports(farm_id);
CREATE INDEX IF NOT EXISTS idx_disease_analyses_user_id ON public.disease_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_records_farm_observed ON public.weather_records(farm_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_expert_reviews_expert_id ON public.expert_reviews(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_reviews_advisory_id ON public.expert_reviews(advisory_id);

-- 12. Automated Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_farms_updated_at ON public.farms;
CREATE TRIGGER trigger_farms_updated_at
    BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 13. Automatic Profile Creation Trigger from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        phone, 
        role, 
        preferred_language
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'AgriSmart Farmer'),
        NEW.phone,
        'farmer', -- Always default to farmer; never trust client metadata for roles
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Row Level Security (RLS) Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

-- 15. Helper Function for Role Checking
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 16. RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id OR current_user_role() IN ('admin', 'expert'));

DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
CREATE POLICY "Users can update own profile except role" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Farms
DROP POLICY IF EXISTS "Users manage own farms" ON public.farms;
CREATE POLICY "Users manage own farms" 
    ON public.farms FOR ALL 
    USING (auth.uid() = user_id OR current_user_role() = 'admin')
    WITH CHECK (auth.uid() = user_id);

-- Soil Tests
DROP POLICY IF EXISTS "Users manage own soil tests" ON public.soil_tests;
CREATE POLICY "Users manage own soil tests" 
    ON public.soil_tests FOR ALL 
    USING (auth.uid() = user_id OR current_user_role() = 'admin')
    WITH CHECK (auth.uid() = user_id);

-- Crops
DROP POLICY IF EXISTS "Users manage own crops" ON public.crops;
CREATE POLICY "Users manage own crops" 
    ON public.crops FOR ALL 
    USING (auth.uid() = user_id OR current_user_role() = 'admin')
    WITH CHECK (auth.uid() = user_id);

-- Advisory Reports
DROP POLICY IF EXISTS "Users view and manage own advisory reports" ON public.advisory_reports;
CREATE POLICY "Users view and manage own advisory reports" 
    ON public.advisory_reports FOR ALL 
    USING (auth.uid() = user_id OR current_user_role() IN ('admin', 'expert'))
    WITH CHECK (auth.uid() = user_id);

-- Disease Analyses
DROP POLICY IF EXISTS "Users manage own disease analyses" ON public.disease_analyses;
CREATE POLICY "Users manage own disease analyses" 
    ON public.disease_analyses FOR ALL 
    USING (auth.uid() = user_id OR current_user_role() IN ('admin', 'expert'))
    WITH CHECK (auth.uid() = user_id);

-- Weather Records
DROP POLICY IF EXISTS "Users view own weather records" ON public.weather_records;
CREATE POLICY "Users view own weather records" 
    ON public.weather_records FOR ALL 
    USING (auth.uid() = user_id OR current_user_role() = 'admin')
    WITH CHECK (auth.uid() = user_id);

-- Feedback
DROP POLICY IF EXISTS "Users manage own feedback" ON public.advisory_feedback;
CREATE POLICY "Users manage own feedback" 
    ON public.advisory_feedback FOR ALL 
    USING (auth.uid() = user_id OR current_user_role() = 'admin')
    WITH CHECK (auth.uid() = user_id);

-- Expert Reviews
DROP POLICY IF EXISTS "Experts manage assigned reviews" ON public.expert_reviews;
CREATE POLICY "Experts manage assigned reviews" 
    ON public.expert_reviews FOR ALL 
    USING (expert_id = auth.uid() OR current_user_role() = 'admin')
    WITH CHECK (expert_id = auth.uid() OR current_user_role() = 'admin');

-- 17. Storage Bucket Creation for Crop Disease Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crop-images', 'crop-images', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users upload crop images" ON storage.objects;
CREATE POLICY "Authenticated users upload crop images" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'crop-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users access own uploaded crop images" ON storage.objects;
CREATE POLICY "Users access own uploaded crop images" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'crop-images' AND auth.role() = 'authenticated');
