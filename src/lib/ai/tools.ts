import { Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "list_providers",
    description:
      "List all available healthcare providers/doctors at the clinic. Optionally filter by a specific service they offer.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        serviceId: {
          type: Type.STRING,
          description:
            "Optional service ID to filter providers who offer this service.",
        },
      },
    },
  },
  {
    name: "list_services",
    description:
      "List all services offered by the clinic. Returns service name, description, duration, and price.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        providerId: {
          type: Type.STRING,
          description:
            "Optional provider ID to filter services offered by this provider.",
        },
      },
    },
  },
  {
    name: "check_availability",
    description:
      "Check available appointment time slots for a specific provider and service on a given date. Returns a list of available start times.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        providerId: {
          type: Type.STRING,
          description: "The ID of the provider to check availability for.",
        },
        serviceId: {
          type: Type.STRING,
          description:
            "The ID of the service (needed to determine appointment duration).",
        },
        date: {
          type: Type.STRING,
          description: "The date to check in YYYY-MM-DD format.",
        },
      },
      required: ["providerId", "serviceId", "date"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Book an appointment for a patient. Requires provider, service, time, and patient information. The patient must be registered first or provide registration details.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        providerId: {
          type: Type.STRING,
          description: "The provider ID for the appointment.",
        },
        serviceId: {
          type: Type.STRING,
          description: "The service ID for the appointment.",
        },
        startTime: {
          type: Type.STRING,
          description:
            "The appointment start time in ISO 8601 format (e.g., 2024-03-15T09:00:00).",
        },
        patientId: {
          type: Type.STRING,
          description:
            "The patient ID if they are already registered. Leave empty for new patients.",
        },
        patientFirstName: {
          type: Type.STRING,
          description: "Patient first name (required for new patients).",
        },
        patientLastName: {
          type: Type.STRING,
          description: "Patient last name (required for new patients).",
        },
        patientEmail: {
          type: Type.STRING,
          description: "Patient email (required for new patients).",
        },
        patientPhone: {
          type: Type.STRING,
          description: "Patient phone number (required for new patients).",
        },
      },
      required: ["providerId", "serviceId", "startTime"],
    },
  },
  {
    name: "cancel_appointment",
    description:
      "Cancel an existing appointment by its ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appointmentId: {
          type: Type.STRING,
          description: "The appointment ID to cancel.",
        },
      },
      required: ["appointmentId"],
    },
  },
  {
    name: "reschedule_appointment",
    description:
      "Reschedule an existing appointment to a new date/time.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appointmentId: {
          type: Type.STRING,
          description: "The appointment ID to reschedule.",
        },
        newStartTime: {
          type: Type.STRING,
          description:
            "The new start time in ISO 8601 format.",
        },
      },
      required: ["appointmentId", "newStartTime"],
    },
  },
  {
    name: "get_appointment_details",
    description:
      "Look up appointment details. Can search by appointment ID, or by patient phone/email to find their upcoming appointments.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appointmentId: {
          type: Type.STRING,
          description: "The appointment ID to look up.",
        },
        patientPhone: {
          type: Type.STRING,
          description:
            "Patient phone number to find their appointments.",
        },
        patientEmail: {
          type: Type.STRING,
          description:
            "Patient email to find their appointments.",
        },
      },
    },
  },
  {
    name: "register_patient",
    description:
      "Register a new patient at the clinic.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        firstName: {
          type: Type.STRING,
          description: "Patient's first name.",
        },
        lastName: {
          type: Type.STRING,
          description: "Patient's last name.",
        },
        email: {
          type: Type.STRING,
          description: "Patient's email address.",
        },
        phone: {
          type: Type.STRING,
          description: "Patient's phone number.",
        },
        dateOfBirth: {
          type: Type.STRING,
          description: "Patient's date of birth in YYYY-MM-DD format.",
        },
      },
      required: ["firstName", "lastName", "email", "phone"],
    },
  },
  {
    name: "get_clinic_info",
    description:
      "Get general clinic information including hours, location, contact details, and policies.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description:
            "Optional specific topic: 'hours', 'location', 'contact', 'policies', 'insurance'.",
        },
      },
    },
  },
  {
    name: "get_faq_answer",
    description:
      "Search the clinic's FAQ/knowledge base for answers to common questions about parking, insurance, what to bring, telehealth, etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: "The question or topic to search for.",
        },
      },
      required: ["question"],
    },
  },
];
