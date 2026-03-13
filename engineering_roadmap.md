# Engineering Roadmap - Cortex AI Clinic Receptionist

> **Strategy**: Build everything locally first. No cloud dependencies until the product works end-to-end on localhost. Then swap the data layer to Supabase and deploy to Vercel.

---

## Stage 1: Project Foundation

### 1.1 - Project Scaffolding
- [ ] Initialize Next.js 15 project with App Router, TypeScript
- [ ] Install and configure Tailwind CSS v4
- [ ] Install and initialize shadcn/ui component library
- [ ] Set up path aliases (`@/components`, `@/lib`, etc.)
- [ ] Configure `.env.local` loading (GEMINI_API_KEY, GEMINI_MODEL)
- [ ] Add `.gitignore` (node_modules, .env*, .next, db.json)
- [ ] Create folder structure per plan.md

### 1.2 - Local Data Layer
- [ ] Install `lowdb` for JSON-file-based local database
- [ ] Create `db.json` with initial seed data (1 demo clinic, 2-3 providers, 5-6 services)
- [ ] Build data access layer (`src/lib/db/`) with repository pattern:
  - `clinics.ts` - CRUD for clinic settings
  - `providers.ts` - CRUD for providers
  - `services.ts` - CRUD for services
  - `schedules.ts` - CRUD for provider schedules
  - `appointments.ts` - CRUD for appointments
  - `patients.ts` - CRUD for patients
- [ ] Define TypeScript types (`src/types/`) for all entities
- [ ] Write seed script to populate demo data

### 1.3 - Gemini AI Client Setup
- [ ] Install `@google/genai` SDK
- [ ] Create Gemini client wrapper (`src/lib/ai/gemini.ts`)
- [ ] Load model from `GEMINI_MODEL` env var
- [ ] Create system prompt template for clinic receptionist persona (`src/lib/ai/prompts.ts`)
- [ ] Define function declarations (tools) for Gemini function calling:
  - `list_providers` - get available doctors
  - `list_services` - get available services
  - `check_availability` - get open time slots
  - `book_appointment` - create a booking
  - `cancel_appointment` - cancel a booking
  - `reschedule_appointment` - move a booking
  - `get_appointment_details` - look up existing appointment
  - `register_patient` - create new patient record
  - `get_clinic_info` - hours, location, policies
  - `get_faq_answer` - answer common questions
- [ ] Build function call executor that maps AI tool calls to data layer operations

---

## Stage 2: AI Chat Interface (Patient-Facing)

### 2.1 - Chat API Endpoint
- [ ] Create `POST /api/chat` route
- [ ] Accept `{ messages: [...], sessionId: string }`
- [ ] Maintain conversation history per session (in-memory Map for local dev)
- [ ] Send conversation + system prompt + tools to Gemini
- [ ] Handle function calling loop (AI calls tool -> execute -> return result -> AI responds)
- [ ] Return streamed or complete AI response
- [ ] Error handling: rate limits, API failures, invalid input

### 2.2 - Chat Widget UI
- [ ] Create chat container component with open/close toggle
- [ ] Message list component (user bubbles vs. AI bubbles)
- [ ] Message input with send button
- [ ] Typing indicator while AI is responding
- [ ] Auto-scroll to latest message
- [ ] Session persistence via `sessionStorage`
- [ ] Welcome message on first open
- [ ] Mobile-responsive layout (full-screen on mobile, floating widget on desktop)

### 2.3 - Booking Flow Through Chat
- [ ] AI can ask "What service do you need?" and present options
- [ ] AI can ask "Which provider do you prefer?" or suggest based on service
- [ ] AI calls `check_availability` and presents slots in natural language
- [ ] AI confirms booking details before calling `book_appointment`
- [ ] AI collects patient info (name, phone, email) if new patient
- [ ] AI provides booking confirmation with details
- [ ] AI handles rescheduling ("I need to move my appointment")
- [ ] AI handles cancellation ("I need to cancel")
- [ ] AI handles lookup ("When is my next appointment?") by phone/email

---

## Stage 3: Admin Dashboard (Clinic-Facing)

### 3.1 - Dashboard Layout
- [ ] Create dashboard shell: sidebar navigation + header + main content area
- [ ] Sidebar links: Appointments, Providers, Services, Schedules, Patients, Settings
- [ ] Responsive sidebar (collapsible on mobile)
- [ ] Breadcrumb navigation

### 3.2 - Appointment Management Page
- [ ] Calendar view (week view as default, day/month toggleable)
- [ ] Appointment cards on calendar showing patient name, service, provider, time
- [ ] Color coding by status: confirmed, completed, cancelled, no-show
- [ ] Click appointment to view details in side panel
- [ ] Manual appointment creation (staff books on behalf of patient)
- [ ] Edit appointment (change time, provider, service)
- [ ] Cancel appointment with reason
- [ ] List view toggle (table format with filters: date range, provider, status)
- [ ] Today's appointments summary at top

### 3.3 - Provider Management Page
- [ ] Provider list with cards (name, specialty, avatar placeholder)
- [ ] Add new provider form (name, specialty, email, phone, bio)
- [ ] Edit provider details
- [ ] Delete provider (with appointment conflict check)
- [ ] Assign services to provider

### 3.4 - Service Catalog Page
- [ ] Service list table (name, duration, price, assigned providers)
- [ ] Add new service form (name, description, duration in minutes, price)
- [ ] Edit service
- [ ] Delete service (with conflict check)
- [ ] Service categories (optional grouping)

### 3.5 - Schedule Management Page
- [ ] Per-provider weekly schedule grid
- [ ] Set available hours per day of week (e.g., Mon 9:00-17:00)
- [ ] Add break times (e.g., 12:00-13:00 lunch)
- [ ] Schedule overrides: mark specific dates as unavailable (vacation, holiday)
- [ ] Schedule overrides: add special hours for a specific date
- [ ] Buffer time setting between appointments (per provider or global)

### 3.6 - Patient Records Page
- [ ] Patient list with search (by name, phone, email)
- [ ] Patient detail view: contact info, appointment history, intake responses
- [ ] Edit patient info
- [ ] Add notes to patient record
- [ ] Appointment history timeline

### 3.7 - Settings Page
- [ ] Clinic info: name, address, phone, email, timezone
- [ ] Business hours (global clinic hours)
- [ ] AI personality settings: receptionist name, greeting message, tone (formal/friendly)
- [ ] Cancellation policy text
- [ ] Booking rules: how far in advance, minimum notice for cancellation

---

## Stage 4: Availability Engine

### 4.1 - Slot Computation
- [ ] Given a provider + service + date range, compute available time slots
- [ ] Logic: start from provider's schedule for that weekday
- [ ] Subtract existing booked appointments
- [ ] Subtract schedule overrides (days off)
- [ ] Apply buffer time between slots
- [ ] Snap slots to service duration (30min service = :00 and :30 starts)
- [ ] Return array of `{ start, end, providerId }` objects

### 4.2 - Conflict Detection
- [ ] Before booking: verify slot is still available (prevent race conditions)
- [ ] Double-booking prevention at data layer
- [ ] Overlap detection for appointments

### 4.3 - API Endpoint
- [ ] `GET /api/availability?providerId=X&serviceId=Y&date=YYYY-MM-DD`
- [ ] Returns available slots for the given date
- [ ] Optional: `GET /api/availability?serviceId=Y&dateFrom=X&dateTo=Y` for range query across all providers

---

## Stage 5: Enhanced AI Features

### 5.1 - FAQ / Knowledge Base
- [x] FAQ data model: question + answer pairs per clinic
- [x] Admin page to add/edit/delete FAQ entries
- [x] AI tool `get_faq_answer` searches FAQ by relevance
- [x] AI falls back to general clinic info if no FAQ match
- [x] Common defaults: parking, insurance accepted, new patient process

### 5.2 - Intelligent Routing
- [x] Symptom-to-service mapping (configurable by clinic)
- [x] AI asks clarifying questions to narrow down service type
- [x] Emergency keyword detection: "chest pain", "can't breathe", "severe bleeding"
- [x] Emergency response: immediately advise calling 911, do not attempt to book

### 5.3 - Human Handoff
- [x] AI detects when it cannot help (complex billing, complaints, medical advice)
- [x] AI responds: "Let me connect you with our staff" + collects callback info
- [x] Pending handoff queue visible in admin dashboard
- [x] Staff can view conversation transcript

### 5.4 - Conversation Intelligence
- [x] Store all conversations in data layer
- [x] Admin view: conversation history list with search
- [x] Auto-generated summary per conversation (via Gemini)
- [x] Flag conversations that resulted in no booking (potential lost leads)

---

## Stage 6: Patient Intake System

### 6.1 - Form Builder (Admin)
- [x] Drag-and-drop form builder (or simplified field list)
- [x] Field types: text, textarea, select, multi-select, date, checkbox, file upload
- [x] Required/optional toggle per field
- [x] Assign forms to specific services (e.g., "New Patient" form for first visits)
- [x] Preview form as patient would see it

### 6.2 - Patient Form Completion
- [x] After booking, patient receives link to fill intake form
- [x] Form rendered from JSONB field definitions
- [x] Validation (required fields, format checks)
- [x] Submit stores response linked to appointment
- [x] Staff can view completed forms in appointment detail

### 6.3 - Medical History Collection
- [x] Structured fields: allergies, current medications, conditions, surgeries
- [x] Stored on patient record, pre-filled on future visits
- [x] AI can reference during conversation ("I see you listed penicillin allergy")

---

## Stage 7: Notifications (Local Simulation)

### 7.1 - Notification System (Console/Log-Based Locally)
- [x] Notification queue in data layer
- [x] Types: booking_confirmation, reminder, cancellation, no_show_followup
- [x] In local dev: log to console / show in admin dashboard notification panel
- [x] Template system: customizable message templates per notification type
- [x] Scheduling: reminders triggered at configurable times before appointment

### 7.2 - Prepare for Email/SMS Integration
- [x] Abstract notification sender interface
- [x] Resend adapter (email) - implemented but inactive until deployment
- [x] Twilio adapter (SMS) - implemented but inactive until deployment
- [x] Env vars: `RESEND_API_KEY`, `TWILIO_*` (optional, gracefully skip if missing)

---

## Stage 8: Analytics Dashboard

### 8.1 - Metrics
- [x] Total appointments (today, this week, this month)
- [x] Booking source breakdown (chat vs. manual)
- [x] No-show rate
- [x] Cancellation rate
- [x] Average appointments per provider
- [x] Peak hours heatmap
- [x] New vs. returning patients
- [x] Most popular services

### 8.2 - UI
- [x] Dashboard home page with metric cards
- [x] Charts using `recharts` or `chart.js`
- [x] Date range picker for filtering
- [x] Export data as CSV (basic)

---

## Stage 9: Deployment Preparation

### 9.1 - Swap Data Layer to Supabase
- [ ] Set up Supabase project
- [ ] Write SQL migrations matching the schema from plan.md
- [ ] Enable Row-Level Security (RLS) policies
- [ ] Create Supabase client (`src/lib/supabase/`)
- [ ] Replace all `lowdb` repository calls with Supabase queries
- [ ] Set up Supabase Auth for admin login
- [ ] Migrate seed data to Supabase
- [ ] Test all features against Supabase

### 9.2 - Auth & Multi-Tenancy
- [ ] Admin login/logout flow (Supabase Auth)
- [ ] Protect dashboard routes (middleware)
- [ ] RLS: clinics can only see their own data
- [ ] Invite system: admin invites staff/providers via email

### 9.3 - Deploy to Vercel
- [ ] Push to GitHub repository
- [ ] Connect Vercel to repo
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure Supabase connection for production
- [ ] Set up custom domain (optional)
- [ ] Test production deployment end-to-end

### 9.4 - Activate External Integrations
- [ ] Enable Resend for real email sending
- [ ] Enable Twilio for real SMS sending
- [ ] Stripe integration for payments (if ready)
- [ ] Google Calendar sync (if ready)

---

## Build Order Summary

| Order | Stage | What You Get |
|-------|-------|-------------|
| 1 | Foundation | Next.js app running, local DB with seed data, Gemini connected |
| 2 | Chat Interface | Patients can talk to AI and book appointments |
| 3 | Admin Dashboard | Clinic staff can manage providers, services, schedules, appointments |
| 4 | Availability Engine | Accurate slot computation powering both chat and dashboard |
| 5 | Enhanced AI | FAQ, triage, emergency detection, human handoff |
| 6 | Patient Intake | Digital forms, medical history |
| 7 | Notifications | Reminders, confirmations (simulated locally) |
| 8 | Analytics | Metrics and charts for clinic insights |
| 9 | Deployment | Supabase + Vercel + real integrations |

---

## Current Status

- [x] Plan created (plan.md)
- [x] Engineering roadmap created (this file)
- [x] .env configured (GEMINI_API_KEY + GEMINI_MODEL)
- [x] **Stages 1-8 Completed (Local Development Finished)**
