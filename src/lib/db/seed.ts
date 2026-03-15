import type { DatabaseSchema } from "@/types";

export const defaultData: DatabaseSchema = {
  clinics: [
    {
      id: "clinic-1",
      name: "Sunrise Family Clinic",
      address: "123 Health Ave, Suite 100, San Francisco, CA 94102",
      phone: "(415) 555-0100",
      email: "info@sunriseclinic.com",
      timezone: "America/Los_Angeles",
      businessHours: {
        "0": null, // Sunday - closed
        "1": { start: "08:00", end: "18:00" },
        "2": { start: "08:00", end: "18:00" },
        "3": { start: "08:00", end: "18:00" },
        "4": { start: "08:00", end: "18:00" },
        "5": { start: "08:00", end: "17:00" },
        "6": { start: "09:00", end: "13:00" },
      },
      settings: {
        aiName: "Cortex",
        aiGreeting:
          "Hello! I'm Cortex, the virtual receptionist for Sunrise Family Clinic. How can I help you today?",
        aiTone: "friendly",
        cancellationPolicy:
          "Please cancel at least 24 hours before your appointment to avoid a cancellation fee.",
        minBookingNoticeHours: 2,
        maxBookingDaysAhead: 365,
        bufferMinutes: 10,
      },
    },
  ],

  providers: [
    {
      id: "prov-1",
      clinicId: "clinic-1",
      name: "Dr. Sarah Chen",
      specialty: "Family Medicine",
      email: "s.chen@sunriseclinic.com",
      phone: "(415) 555-0101",
      bio: "Board-certified family medicine physician with 12 years of experience.",
    },
    {
      id: "prov-2",
      clinicId: "clinic-1",
      name: "Dr. James Wilson",
      specialty: "Internal Medicine",
      email: "j.wilson@sunriseclinic.com",
      phone: "(415) 555-0102",
      bio: "Specializes in preventive care and chronic disease management.",
    },
    {
      id: "prov-3",
      clinicId: "clinic-1",
      name: "Dr. Maria Rodriguez",
      specialty: "Pediatrics",
      email: "m.rodriguez@sunriseclinic.com",
      phone: "(415) 555-0103",
      bio: "Pediatrician with a focus on child development and wellness.",
    },
  ],

  services: [
    {
      id: "svc-1",
      clinicId: "clinic-1",
      name: "General Consultation",
      description: "Standard office visit for general health concerns.",
      durationMinutes: 30,
      price: 150,
      category: "General",
    },
    {
      id: "svc-2",
      clinicId: "clinic-1",
      name: "Annual Physical Exam",
      description: "Comprehensive yearly health examination.",
      durationMinutes: 60,
      price: 250,
      category: "Preventive",
    },
    {
      id: "svc-3",
      clinicId: "clinic-1",
      name: "Follow-Up Visit",
      description: "Follow-up appointment for ongoing treatment.",
      durationMinutes: 15,
      price: 75,
      category: "General",
    },
    {
      id: "svc-4",
      clinicId: "clinic-1",
      name: "Pediatric Wellness Check",
      description: "Routine wellness visit for children.",
      durationMinutes: 30,
      price: 125,
      category: "Pediatrics",
    },
    {
      id: "svc-5",
      clinicId: "clinic-1",
      name: "Vaccination",
      description: "Administration of vaccines including flu shots.",
      durationMinutes: 15,
      price: 50,
      category: "Preventive",
    },
    {
      id: "svc-6",
      clinicId: "clinic-1",
      name: "Urgent Care Visit",
      description: "Same-day visit for urgent but non-emergency health issues.",
      durationMinutes: 30,
      price: 200,
      category: "Urgent",
    },
  ],

  providerServices: [
    // Dr. Chen - Family Medicine (does most things)
    { providerId: "prov-1", serviceId: "svc-1" },
    { providerId: "prov-1", serviceId: "svc-2" },
    { providerId: "prov-1", serviceId: "svc-3" },
    { providerId: "prov-1", serviceId: "svc-5" },
    { providerId: "prov-1", serviceId: "svc-6" },
    // Dr. Wilson - Internal Medicine
    { providerId: "prov-2", serviceId: "svc-1" },
    { providerId: "prov-2", serviceId: "svc-2" },
    { providerId: "prov-2", serviceId: "svc-3" },
    { providerId: "prov-2", serviceId: "svc-5" },
    // Dr. Rodriguez - Pediatrics
    { providerId: "prov-3", serviceId: "svc-4" },
    { providerId: "prov-3", serviceId: "svc-5" },
    { providerId: "prov-3", serviceId: "svc-3" },
  ],

  schedules: [
    // Dr. Chen - Mon-Fri 9-5
    { id: "sch-1", providerId: "prov-1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
    { id: "sch-2", providerId: "prov-1", dayOfWeek: 2, startTime: "09:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
    { id: "sch-3", providerId: "prov-1", dayOfWeek: 3, startTime: "09:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
    { id: "sch-4", providerId: "prov-1", dayOfWeek: 4, startTime: "09:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
    { id: "sch-5", providerId: "prov-1", dayOfWeek: 5, startTime: "09:00", endTime: "16:00", breakStart: "12:00", breakEnd: "13:00" },
    // Dr. Wilson - Mon-Thu 8-4
    { id: "sch-6", providerId: "prov-2", dayOfWeek: 1, startTime: "08:00", endTime: "16:00", breakStart: "12:00", breakEnd: "12:30" },
    { id: "sch-7", providerId: "prov-2", dayOfWeek: 2, startTime: "08:00", endTime: "16:00", breakStart: "12:00", breakEnd: "12:30" },
    { id: "sch-8", providerId: "prov-2", dayOfWeek: 3, startTime: "08:00", endTime: "16:00", breakStart: "12:00", breakEnd: "12:30" },
    { id: "sch-9", providerId: "prov-2", dayOfWeek: 4, startTime: "08:00", endTime: "16:00", breakStart: "12:00", breakEnd: "12:30" },
    // Dr. Rodriguez - Mon, Wed, Fri 9-3, Sat 9-12
    { id: "sch-10", providerId: "prov-3", dayOfWeek: 1, startTime: "09:00", endTime: "15:00", breakStart: "12:00", breakEnd: "12:30" },
    { id: "sch-11", providerId: "prov-3", dayOfWeek: 3, startTime: "09:00", endTime: "15:00", breakStart: "12:00", breakEnd: "12:30" },
    { id: "sch-12", providerId: "prov-3", dayOfWeek: 5, startTime: "09:00", endTime: "15:00", breakStart: "12:00", breakEnd: "12:30" },
    { id: "sch-13", providerId: "prov-3", dayOfWeek: 6, startTime: "09:00", endTime: "12:00" },
  ],

  scheduleOverrides: [],
  appointments: [],
  patients: [],
  faqEntries: [
    {
      id: "faq-1",
      clinicId: "clinic-1",
      question: "What insurance do you accept?",
      answer: "We accept most major insurance plans including Blue Cross Blue Shield, Aetna, Cigna, United Healthcare, and Medicare. Please contact us to verify your specific plan.",
    },
    {
      id: "faq-2",
      clinicId: "clinic-1",
      question: "Where are you located and is there parking?",
      answer: "We are located at 123 Health Ave, Suite 100, San Francisco, CA 94102. Free parking is available in the building garage. Street parking is also available.",
    },
    {
      id: "faq-3",
      clinicId: "clinic-1",
      question: "What should I bring to my first visit?",
      answer: "Please bring a valid photo ID, your insurance card, a list of current medications, and any relevant medical records or referral letters.",
    },
    {
      id: "faq-4",
      clinicId: "clinic-1",
      question: "Do you offer telehealth appointments?",
      answer: "Yes, we offer telehealth appointments for follow-up visits and general consultations. Please let us know when booking if you'd prefer a virtual visit.",
    },
  ],
  conversations: [],
};
