-- Migration: Add expertise column to providers table
-- Run this in your Supabase SQL Editor

ALTER TABLE providers ADD COLUMN IF NOT EXISTS expertise TEXT NOT NULL DEFAULT '';

UPDATE providers SET expertise = 'Experienced in managing acute illnesses (cold, flu, infections), minor injuries, women''s health, skin conditions, and same-day urgent care. Strong generalist for adults of all ages.' WHERE id = 'prov-1';

UPDATE providers SET expertise = 'Expert in chronic disease management (diabetes, hypertension, heart disease), preventive health screenings, medication management, and annual physicals for adults. Ideal for patients with ongoing conditions.' WHERE id = 'prov-2';

UPDATE providers SET expertise = 'Specialist in newborn through adolescent care, developmental milestones, childhood vaccinations, behavioral health, asthma management, and routine wellness checks for children ages 0-17.' WHERE id = 'prov-3';
