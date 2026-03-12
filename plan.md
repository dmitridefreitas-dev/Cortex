# Cortex - AI Clinic Receptionist

## Vision
A fully autonomous AI receptionist that replaces human receptionists in medical/dental/specialist clinics. Built on Gemini 3 Flash, deployed on Vercel, backed by Supabase.

## Development Strategy
**Local-first** - build a fully working local version before any cloud deployment.
- Phase A: Local dev with in-memory/JSON data stores, Gemini API for AI
- Phase B: Swap data layer to Supabase, add auth
- Phase C: Deploy to Vercel + Supabase cloud

## Environment Configuration
```
GEMINI_API_KEY=<your-key>
GEMINI_MODEL=gemini-3-flash-preview
```

---

## Core Function Brainstorm

### 1. Appointment Management
- **Online booking** - patients select provider, service, date/time from available slots
- **Rescheduling & cancellation** - with configurable cancellation policies (e.g., 24hr notice)
- **Waitlist management** - auto-fill cancelled slots from waitlist, notify patients
- **Recurring appointments** - schedule follow-ups, regular check-ups
- **Multi-provider scheduling** - handle multiple doctors/specialists with individual availability
- **Buffer time** - configurable gaps between appointments (cleanup, charting)
- **Appointment type durations** - different lengths for consult vs. follow-up vs. procedure
- **Double-booking prevention** - hard conflicts with soft override for clinic staff
- **Walk-in queue management** - estimate wait times for unscheduled patients

### 2. Patient Communication
- **AI chat widget** - embeddable on clinic website, conversational booking & inquiries
- **SMS reminders** - configurable reminders (48hr, 24hr, 2hr before appointment)
- **Email confirmations** - booking confirmation, rescheduling notices, cancellation receipts
- **No-show follow-up** - automated message after missed appointment
- **Post-visit follow-up** - "how was your visit?" + re-booking prompt
- **Multilingual support** - at minimum English + configurable additional languages
- **Voice call handling** (future) - phone-based AI receptionist via Twilio/Vapi

### 3. Patient Intake & Registration
- **New patient registration** - collect name, DOB, contact, emergency contact, insurance
- **Digital intake forms** - pre-visit questionnaires sent before appointment
- **Insurance verification prompt** - collect insurance details, flag for staff verification
- **Consent forms** - digital signature collection for treatment consents
- **Medical history collection** - allergies, medications, conditions (structured data)
- **Returning patient recognition** - identify existing patients, pre-fill known info
- **Document upload** - patients can upload insurance cards, referral letters, ID photos

### 4. Intelligent Triage & Routing
- **Symptom-based routing** - direct patients to the right specialist/provider
- **Urgency assessment** - flag emergencies ("chest pain" -> "call 911"), route urgent cases
- **Service matching** - match patient needs to available services at the clinic
- **Referral handling** - accept/process referrals from other providers
- **FAQ handling** - answer common questions (hours, location, parking, accepted insurance)

### 5. Clinic Configuration & Admin Dashboard
- **Provider management** - add/edit doctors, their specialties, working hours
- **Service catalog** - define services, durations, prices, which providers offer them
- **Business hours** - set clinic hours, holidays, special closures
- **Customizable AI personality** - clinic can set tone, name, greeting style
- **Custom FAQ/knowledge base** - clinic uploads their own Q&A, policies, procedures
- **Analytics dashboard** - booking volume, no-show rates, peak hours, common inquiries
- **Staff notifications** - alert staff of new bookings, cancellations, urgent messages
- **Multi-location support** - one clinic brand, multiple physical locations

### 6. Calendar & Integration
- **Google Calendar sync** - two-way sync with provider Google Calendars
- **iCal export** - patients can add appointments to their own calendars
- **EHR/EMR integration hooks** - API-ready for future Epic, Cerner, etc. connections
- **Payment integration** - Stripe for copays, deposits, cancellation fees
- **Telehealth links** - auto-generate Zoom/Google Meet links for virtual visits

### 7. Billing & Payments
- **Copay collection** - collect known copay amounts at booking or check-in
- **Cancellation fee enforcement** - charge late-cancel fees per policy
- **Outstanding balance reminders** - notify patients of unpaid balances
- **Insurance info display** - show what's on file, prompt for updates
- **Receipt generation** - email receipts for payments made

### 8. Check-in / Check-out Flow
- **Digital check-in** - patient confirms arrival via link/QR code
- **Pre-visit checklist** - "bring your insurance card", "fast for 12 hours", etc.
- **Wait time estimates** - real-time estimate based on current queue
- **Check-out prompts** - schedule follow-up, collect payment, satisfaction survey

### 9. Security & Compliance
- **HIPAA-aware design** - encrypted data at rest and in transit, audit logs
- **Role-based access** - admin, provider, staff roles with different permissions
- **Data retention policies** - configurable retention, patient data deletion requests
- **Audit trail** - log all AI interactions, edits, access for compliance
- **Consent management** - track what patients consented to and when
- **Rate limiting & abuse prevention** - prevent spam bookings, bot attacks

### 10. AI-Specific Features
- **Context-aware conversations** - remembers prior messages within a session
- **Graceful handoff to human** - detect when AI can't help, escalate to staff
- **Conversation summaries** - staff can review AI-patient chat summaries
- **Smart suggestions** - "You're due for a cleaning" based on last visit data
- **Natural language booking** - "I need to see Dr. Smith next Tuesday afternoon"
- **Typo/fuzzy matching** - handle misspelled provider names, service names

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Gemini 3 Flash (via Google AI API) |
| Frontend | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes / Server Actions |
| Database (local) | JSON file store via `lowdb` (swappable to Supabase) |
| Database (prod) | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Auth (local) | Simple session-based (no login needed for local dev) |
| Auth (prod) | Supabase Auth (clinic staff login) |
| Deployment | Vercel (after local version is complete) |
| SMS | Twilio (future) |
| Email | Resend |
| Payments | Stripe (future) |
| Calendar | Google Calendar API (future) |

---

## Database Schema (High-Level)

```
clinics          - id, name, settings, branding, timezone
providers        - id, clinic_id, name, specialty, bio, avatar
services         - id, clinic_id, name, duration_min, price, description
provider_services - provider_id, service_id (many-to-many)
schedules        - id, provider_id, day_of_week, start_time, end_time
schedule_overrides - id, provider_id, date, available (for holidays/special hours)
appointments     - id, clinic_id, provider_id, patient_id, service_id, start_time, end_time, status
patients         - id, clinic_id, name, email, phone, dob, insurance_info, medical_history
intake_forms     - id, clinic_id, name, fields (JSONB)
intake_responses - id, form_id, patient_id, appointment_id, responses (JSONB)
conversations    - id, patient_id, clinic_id, messages (JSONB), summary, created_at
waitlist         - id, clinic_id, patient_id, provider_id, service_id, preferred_times
notifications    - id, clinic_id, type, recipient, status, scheduled_at, sent_at
faq_entries      - id, clinic_id, question, answer
```

---

## Implementation Phases

### Phase 1 - MVP (Core Booking + Chat)
1. Project setup (Next.js + Supabase + Tailwind + shadcn/ui)
2. Supabase schema: clinics, providers, services, schedules, appointments, patients
3. Admin dashboard: manage providers, services, schedules
4. Availability engine: compute open slots from schedules + existing appointments
5. AI chat widget: Gemini-powered conversational interface
6. Natural language booking flow through chat
7. Appointment CRUD (book, reschedule, cancel)
8. Basic patient registration during booking
9. Clinic-facing appointment calendar view

### Phase 2 - Communication & Intake
10. Email confirmations (Resend)
11. SMS reminders (Twilio)
12. Digital intake forms builder (admin)
13. Patient-facing intake form completion
14. Post-booking pre-visit instructions
15. No-show detection & follow-up

### Phase 3 - Intelligence & Polish
16. Custom FAQ/knowledge base per clinic
17. Symptom-based provider routing
18. Urgency detection & emergency handling
19. Waitlist management
20. Analytics dashboard
21. Multilingual support

### Phase 4 - Integrations & Scale
22. Google Calendar sync
23. Stripe payments (copays, cancellation fees)
24. Multi-location support
25. Check-in/check-out flow
26. Telehealth link generation
27. EHR/EMR integration hooks

---

## Key Design Decisions

- **Gemini 3 Flash** chosen for speed + cost efficiency on high-volume chat
- **Supabase RLS** for multi-tenant data isolation (each clinic sees only their data)
- **Server-side AI calls** - never expose API keys to client
- **Structured tool calling** - Gemini uses function calling to book/cancel/query rather than free-text DB manipulation
- **Embeddable widget** - the chat UI should be an iframe/web component clinics drop into their existing site
- **Mobile-first** - most patients will interact from their phones

---

## File Structure (Planned)

```
cortex/
├── src/
│   ├── app/
│   │   ├── (public)/          # Patient-facing pages
│   │   │   ├── chat/          # AI chat widget
│   │   │   ├── book/          # Direct booking page
│   │   │   └── intake/        # Intake form completion
│   │   ├── (dashboard)/       # Clinic admin dashboard
│   │   │   ├── appointments/  # Calendar & appointment list
│   │   │   ├── providers/     # Provider management
│   │   │   ├── services/      # Service catalog
│   │   │   ├── schedules/     # Schedule management
│   │   │   ├── patients/      # Patient records
│   │   │   ├── forms/         # Intake form builder
│   │   │   ├── faq/           # Knowledge base editor
│   │   │   ├── analytics/     # Dashboard analytics
│   │   │   └── settings/      # Clinic settings & branding
│   │   └── api/
│   │       ├── ai/            # Gemini chat endpoint
│   │       ├── appointments/  # Appointment CRUD
│   │       ├── availability/  # Slot computation
│   │       └── webhooks/      # Twilio, Stripe webhooks
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── chat/              # Chat widget components
│   │   ├── booking/           # Booking flow components
│   │   └── dashboard/         # Admin dashboard components
│   ├── lib/
│   │   ├── ai/               # Gemini client, prompts, tool definitions
│   │   ├── supabase/         # Supabase client, queries
│   │   ├── availability/     # Slot computation logic
│   │   └── notifications/    # Email/SMS sending
│   └── types/                # TypeScript types
├── supabase/
│   └── migrations/           # SQL migration files
├── public/
└── plan.md
```

---

## What Makes This Competitive

1. **Conversational booking** - not just a form, a real AI conversation
2. **Zero training needed** - clinic uploads their info, AI handles the rest
3. **24/7 availability** - books appointments at 2am when no human is there
4. **Cost savings** - fraction of a receptionist's salary
5. **No phone hold times** - instant responses via chat
6. **Smart follow-ups** - proactive patient engagement
7. **Multi-channel** - web chat, SMS, email from one system
8. **Embeddable** - works on any existing clinic website
