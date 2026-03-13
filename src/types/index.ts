export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  businessHours: {
    [day: string]: { start: string; end: string } | null; // null = closed
  };
  settings: {
    aiName: string;
    aiGreeting: string;
    aiTone: "formal" | "friendly" | "casual";
    cancellationPolicy: string;
    minBookingNoticeHours: number;
    maxBookingDaysAhead: number;
    bufferMinutes: number;
  };
}

export interface Provider {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  bio: string;
  avatar?: string;
}

export interface Service {
  id: string;
  clinicId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category?: string;
}

export interface ProviderService {
  providerId: string;
  serviceId: string;
}

export interface Schedule {
  id: string;
  providerId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  breakStart?: string; // "12:00"
  breakEnd?: string;   // "13:00"
}

export interface ScheduleOverride {
  id: string;
  providerId: string;
  date: string; // "YYYY-MM-DD"
  available: boolean;
  startTime?: string; // custom hours if available
  endTime?: string;
  reason?: string;
}

export type AppointmentStatus =
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  clinicId: string;
  providerId: string;
  patientId: string;
  serviceId: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  status: AppointmentStatus;
  notes?: string;
  bookedVia: "chat" | "manual" | "online";
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  medicalHistory?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  notes?: string;
  createdAt: string;
}

export interface FAQEntry {
  id: string;
  clinicId: string;
  question: string;
  answer: string;
}

export interface Conversation {
  id: string;
  clinicId: string;
  patientId?: string;
  messages: ChatMessage[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolCalls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface TimeSlot {
  start: string; // ISO datetime
  end: string;
  providerId: string;
  providerName: string;
}

export interface IntakeForm {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  isActive: boolean;
  fields: IntakeFormField[];
  createdAt: string;
  updatedAt: string;
}

export interface IntakeFormField {
  id: string;
  type: "text" | "textarea" | "select" | "checkbox" | "date";
  label: string;
  required: boolean;
  options?: string[]; // For select fields
}

export interface IntakeResponse {
  id: string;
  formId: string;
  patientId: string;
  appointmentId?: string;
  responses: Record<string, string | string[] | boolean>;
  submittedAt: string;
}

export interface DatabaseSchema {
  clinics: Clinic[];
  providers: Provider[];
  services: Service[];
  providerServices: ProviderService[];
  schedules: Schedule[];
  scheduleOverrides: ScheduleOverride[];
  appointments: Appointment[];
  patients: Patient[];
  faqEntries: FAQEntry[];
  conversations: Conversation[];
  intakeForms?: IntakeForm[];
  intakeResponses?: IntakeResponse[];
}
