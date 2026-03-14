-- Cortex AI Receptionist - Supabase Schema
-- Run this in your Supabase SQL editor

-- ============================================
-- 1. CLINICS
-- ============================================
CREATE TABLE clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  business_hours JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}'
);

-- ============================================
-- 2. PROVIDERS
-- ============================================
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar TEXT
);
CREATE INDEX idx_providers_clinic ON providers(clinic_id);

-- ============================================
-- 3. SERVICES
-- ============================================
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT
);
CREATE INDEX idx_services_clinic ON services(clinic_id);

-- ============================================
-- 4. PROVIDER_SERVICES (junction)
-- ============================================
CREATE TABLE provider_services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(provider_id, service_id)
);

-- ============================================
-- 5. SCHEDULES
-- ============================================
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  break_start TEXT,
  break_end TEXT,
  UNIQUE(provider_id, day_of_week)
);

-- ============================================
-- 6. SCHEDULE_OVERRIDES
-- ============================================
CREATE TABLE schedule_overrides (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN NOT NULL DEFAULT true,
  start_time TEXT,
  end_time TEXT,
  reason TEXT,
  UNIQUE(provider_id, date)
);

-- ============================================
-- 7. PATIENTS
-- ============================================
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  date_of_birth TEXT,
  insurance JSONB,
  medical_history JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);

-- ============================================
-- 8. APPOINTMENTS
-- ============================================
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','cancelled','no_show')),
  notes TEXT,
  booked_via TEXT NOT NULL DEFAULT 'chat' CHECK (booked_via IN ('chat','manual','online')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_start ON appointments(start_time);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);

-- ============================================
-- 9. CONVERSATIONS
-- ============================================
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conversations_clinic ON conversations(clinic_id);

-- ============================================
-- 10. FAQ_ENTRIES
-- ============================================
CREATE TABLE faq_entries (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);
CREATE INDEX idx_faq_clinic ON faq_entries(clinic_id);

-- ============================================
-- 11. INTAKE_FORMS
-- ============================================
CREATE TABLE intake_forms (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 12. INTAKE_RESPONSES
-- ============================================
CREATE TABLE intake_responses (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT,
  responses JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Enable Row Level Security (for future auth)
-- ============================================
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our API uses service role key)
CREATE POLICY "Service role full access" ON clinics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON providers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON provider_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON schedule_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON faq_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intake_forms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON intake_responses FOR ALL USING (true) WITH CHECK (true);
