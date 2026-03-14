-- Cortex AI Receptionist - Seed Data
-- Run this AFTER schema.sql

-- ============================================
-- CLINIC
-- ============================================
INSERT INTO clinics (id, name, address, phone, email, timezone, business_hours, settings) VALUES (
  'clinic-1',
  'Sunrise Family Clinic',
  '123 Health Ave, Suite 100, San Francisco, CA 94102',
  '(415) 555-0100',
  'info@sunriseclinic.com',
  'America/Los_Angeles',
  '{"0": null, "1": {"start": "08:00", "end": "18:00"}, "2": {"start": "08:00", "end": "18:00"}, "3": {"start": "08:00", "end": "18:00"}, "4": {"start": "08:00", "end": "18:00"}, "5": {"start": "08:00", "end": "17:00"}, "6": {"start": "09:00", "end": "13:00"}}',
  '{"aiName": "Cortex", "aiGreeting": "Hello! I''m Cortex, the virtual receptionist for Sunrise Family Clinic. How can I help you today?", "aiTone": "friendly", "cancellationPolicy": "Please cancel at least 24 hours before your appointment to avoid a cancellation fee.", "minBookingNoticeHours": 2, "maxBookingDaysAhead": 60, "bufferMinutes": 10}'
);

-- ============================================
-- PROVIDERS
-- ============================================
INSERT INTO providers (id, clinic_id, name, specialty, email, phone, bio) VALUES
  ('prov-1', 'clinic-1', 'Dr. Sarah Chen', 'Family Medicine', 's.chen@sunriseclinic.com', '(415) 555-0101', 'Board-certified family medicine physician with 12 years of experience.'),
  ('prov-2', 'clinic-1', 'Dr. James Wilson', 'Internal Medicine', 'j.wilson@sunriseclinic.com', '(415) 555-0102', 'Specializes in preventive care and chronic disease management.'),
  ('prov-3', 'clinic-1', 'Dr. Maria Rodriguez', 'Pediatrics', 'm.rodriguez@sunriseclinic.com', '(415) 555-0103', 'Pediatrician with a focus on child development and wellness.');

-- ============================================
-- SERVICES
-- ============================================
INSERT INTO services (id, clinic_id, name, description, duration_minutes, price, category) VALUES
  ('svc-1', 'clinic-1', 'General Consultation', 'Standard office visit for general health concerns.', 30, 150, 'General'),
  ('svc-2', 'clinic-1', 'Annual Physical Exam', 'Comprehensive yearly health examination.', 60, 250, 'Preventive'),
  ('svc-3', 'clinic-1', 'Follow-Up Visit', 'Follow-up appointment for ongoing treatment.', 15, 75, 'General'),
  ('svc-4', 'clinic-1', 'Pediatric Wellness Check', 'Routine wellness visit for children.', 30, 125, 'Pediatrics'),
  ('svc-5', 'clinic-1', 'Vaccination', 'Administration of vaccines including flu shots.', 15, 50, 'Preventive'),
  ('svc-6', 'clinic-1', 'Urgent Care Visit', 'Same-day visit for urgent but non-emergency health issues.', 30, 200, 'Urgent');

-- ============================================
-- PROVIDER_SERVICES (junction)
-- ============================================
INSERT INTO provider_services (provider_id, service_id) VALUES
  -- Dr. Chen - Family Medicine
  ('prov-1', 'svc-1'),
  ('prov-1', 'svc-2'),
  ('prov-1', 'svc-3'),
  ('prov-1', 'svc-5'),
  ('prov-1', 'svc-6'),
  -- Dr. Wilson - Internal Medicine
  ('prov-2', 'svc-1'),
  ('prov-2', 'svc-2'),
  ('prov-2', 'svc-3'),
  ('prov-2', 'svc-5'),
  -- Dr. Rodriguez - Pediatrics
  ('prov-3', 'svc-4'),
  ('prov-3', 'svc-5'),
  ('prov-3', 'svc-3');

-- ============================================
-- SCHEDULES
-- ============================================
INSERT INTO schedules (id, provider_id, day_of_week, start_time, end_time, break_start, break_end) VALUES
  -- Dr. Chen - Mon-Fri 9-5
  ('sch-1', 'prov-1', 1, '09:00', '17:00', '12:00', '13:00'),
  ('sch-2', 'prov-1', 2, '09:00', '17:00', '12:00', '13:00'),
  ('sch-3', 'prov-1', 3, '09:00', '17:00', '12:00', '13:00'),
  ('sch-4', 'prov-1', 4, '09:00', '17:00', '12:00', '13:00'),
  ('sch-5', 'prov-1', 5, '09:00', '16:00', '12:00', '13:00'),
  -- Dr. Wilson - Mon-Thu 8-4
  ('sch-6', 'prov-2', 1, '08:00', '16:00', '12:00', '12:30'),
  ('sch-7', 'prov-2', 2, '08:00', '16:00', '12:00', '12:30'),
  ('sch-8', 'prov-2', 3, '08:00', '16:00', '12:00', '12:30'),
  ('sch-9', 'prov-2', 4, '08:00', '16:00', '12:00', '12:30'),
  -- Dr. Rodriguez - Mon, Wed, Fri 9-3, Sat 9-12
  ('sch-10', 'prov-3', 1, '09:00', '15:00', '12:00', '12:30'),
  ('sch-11', 'prov-3', 3, '09:00', '15:00', '12:00', '12:30'),
  ('sch-12', 'prov-3', 5, '09:00', '15:00', '12:00', '12:30'),
  ('sch-13', 'prov-3', 6, '09:00', '12:00', NULL, NULL);

-- ============================================
-- FAQ ENTRIES
-- ============================================
INSERT INTO faq_entries (id, clinic_id, question, answer) VALUES
  ('faq-1', 'clinic-1', 'What insurance do you accept?', 'We accept most major insurance plans including Blue Cross Blue Shield, Aetna, Cigna, United Healthcare, and Medicare. Please contact us to verify your specific plan.'),
  ('faq-2', 'clinic-1', 'Where are you located and is there parking?', 'We are located at 123 Health Ave, Suite 100, San Francisco, CA 94102. Free parking is available in the building garage. Street parking is also available.'),
  ('faq-3', 'clinic-1', 'What should I bring to my first visit?', 'Please bring a valid photo ID, your insurance card, a list of current medications, and any relevant medical records or referral letters.'),
  ('faq-4', 'clinic-1', 'Do you offer telehealth appointments?', 'Yes, we offer telehealth appointments for follow-up visits and general consultations. Please let us know when booking if you''d prefer a virtual visit.');
