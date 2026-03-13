import { getProviders, getProvidersByService } from "@/lib/db/providers";
import { getServices, getServicesByProvider, getService } from "@/lib/db/services";
import { getAvailableSlots } from "@/lib/availability";
import {
  createAppointment,
  getAppointment,
  cancelAppointment,
  updateAppointment,
  getAppointments,
} from "@/lib/db/appointments";
import {
  createPatient,
  findPatientByPhone,
  findPatientByEmail,
} from "@/lib/db/patients";
import { getDefaultClinic } from "@/lib/db/clinics";
import { searchFAQ, getFAQEntries } from "@/lib/db/faq";
import { isSlotAvailable } from "@/lib/availability";
import { sendNotification } from "@/lib/notifications";
import { addMinutes, format } from "date-fns";

const CLINIC_ID = "clinic-1";

export async function executeTool(
  name: string,
  args: Record<string, string | undefined>
): Promise<unknown> {
  switch (name) {
    case "list_providers": {
      if (args.serviceId) {
        const providers = await getProvidersByService(args.serviceId);
        return providers.map((p) => ({
          id: p.id,
          name: p.name,
          specialty: p.specialty,
          bio: p.bio,
        }));
      }
      const providers = await getProviders(CLINIC_ID);
      return providers.map((p) => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        bio: p.bio,
      }));
    }

    case "list_services": {
      if (args.providerId) {
        const services = await getServicesByProvider(args.providerId);
        return services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          price: s.price,
        }));
      }
      const services = await getServices(CLINIC_ID);
      return services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMinutes: s.durationMinutes,
        price: s.price,
      }));
    }

    case "check_availability": {
      const { providerId, serviceId, date } = args;
      if (!providerId || !serviceId || !date) {
        return { error: "Missing required parameters: providerId, serviceId, date" };
      }
      const slots = await getAvailableSlots(providerId, serviceId, date);
      if (slots.length === 0) {
        return { message: "No available slots on this date.", availableSlots: [] };
      }
      return {
        date,
        providerName: slots[0].providerName,
        availableSlots: slots.map((s) => ({
          startTime: s.start,
          displayTime: format(new Date(s.start), "h:mm a"),
        })),
      };
    }

    case "book_appointment": {
      const { providerId, serviceId, startTime } = args;
      if (!providerId || !serviceId || !startTime) {
        return { error: "Missing required parameters" };
      }

      const service = await getService(serviceId);
      if (!service) return { error: "Service not found" };

      // Check availability
      const available = await isSlotAvailable(providerId, startTime, service.durationMinutes);
      if (!available) {
        return { error: "This time slot is no longer available. Please choose another time." };
      }

      // Find or create patient
      let patientId = args.patientId;
      if (!patientId) {
        if (!args.patientFirstName || !args.patientLastName || !args.patientEmail || !args.patientPhone) {
          return { error: "Patient information is required. Please provide first name, last name, email, and phone." };
        }
        // Check if patient exists
        let patient = await findPatientByEmail(CLINIC_ID, args.patientEmail);
        if (!patient) {
          patient = await findPatientByPhone(CLINIC_ID, args.patientPhone);
        }
        if (!patient) {
          patient = await createPatient({
            clinicId: CLINIC_ID,
            firstName: args.patientFirstName,
            lastName: args.patientLastName,
            email: args.patientEmail,
            phone: args.patientPhone,
          });
        }
        patientId = patient.id;
      }

      const endTime = addMinutes(new Date(startTime), service.durationMinutes).toISOString();

      const appointment = await createAppointment({
        clinicId: CLINIC_ID,
        providerId,
        patientId,
        serviceId,
        startTime,
        endTime,
        status: "confirmed",
        bookedVia: "chat",
      });

      // Send notifications
      const { getPatient } = await import("@/lib/db/patients");
      const patient = await getPatient(patientId);

      const basePayload = {
        to: patient?.email || patient?.phone || "",
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Patient",
        metadata: {
          service: service.name,
          date: format(new Date(startTime), "EEEE, MMMM d, yyyy"),
          time: format(new Date(startTime), "h:mm a"),
          provider: providerId
        }
      };

      await sendNotification({ ...basePayload, type: "booking_confirmation" });
      await sendNotification({ 
        ...basePayload, 
        type: "intake_form_link",
        metadata: { ...basePayload.metadata, formId: "form-default", appointmentId: appointment.id }
      });

      return {
        success: true,
        appointmentId: appointment.id,
        message: `Appointment booked successfully!`,
        details: {
          date: format(new Date(startTime), "EEEE, MMMM d, yyyy"),
          time: format(new Date(startTime), "h:mm a"),
          service: service.name,
          duration: `${service.durationMinutes} minutes`,
        },
      };
    }

    case "cancel_appointment": {
      const { appointmentId } = args;
      if (!appointmentId) return { error: "Appointment ID is required" };

      const apt = await getAppointment(appointmentId);
      if (!apt) return { error: "Appointment not found" };
      if (apt.status === "cancelled") return { error: "Appointment is already cancelled" };

      await cancelAppointment(appointmentId);

      const { getPatient } = await import("@/lib/db/patients");
      const service = await getService(apt.serviceId);
      const patient = await getPatient(apt.patientId);
      
      if (patient) {
        await sendNotification({
          to: patient.email || patient.phone || "",
          patientName: `${patient.firstName} ${patient.lastName}`,
          type: "booking_cancellation",
          metadata: {
            service: service?.name || "Service",
            date: format(new Date(apt.startTime), "EEEE, MMMM d, yyyy"),
            time: format(new Date(apt.startTime), "h:mm a")
          }
        });
      }

      return {
        success: true,
        message: "Appointment has been cancelled successfully.",
      };
    }

    case "reschedule_appointment": {
      const { appointmentId, newStartTime } = args;
      if (!appointmentId || !newStartTime) {
        return { error: "Missing appointmentId or newStartTime" };
      }

      const apt = await getAppointment(appointmentId);
      if (!apt) return { error: "Appointment not found" };

      const service = await getService(apt.serviceId);
      if (!service) return { error: "Service not found" };

      const available = await isSlotAvailable(apt.providerId, newStartTime, service.durationMinutes);
      if (!available) {
        return { error: "The new time slot is not available." };
      }

      const newEndTime = addMinutes(new Date(newStartTime), service.durationMinutes).toISOString();
      await updateAppointment(appointmentId, {
        startTime: newStartTime,
        endTime: newEndTime,
      });

      return {
        success: true,
        message: "Appointment rescheduled successfully.",
        newTime: format(new Date(newStartTime), "EEEE, MMMM d 'at' h:mm a"),
      };
    }

    case "get_appointment_details": {
      if (args.appointmentId) {
        const apt = await getAppointment(args.appointmentId);
        if (!apt) return { error: "Appointment not found" };
        const service = await getService(apt.serviceId);
        return {
          id: apt.id,
          date: format(new Date(apt.startTime), "EEEE, MMMM d, yyyy"),
          time: format(new Date(apt.startTime), "h:mm a"),
          status: apt.status,
          service: service?.name,
        };
      }

      // Find by phone or email
      let patient;
      if (args.patientPhone) {
        patient = await findPatientByPhone(CLINIC_ID, args.patientPhone);
      } else if (args.patientEmail) {
        patient = await findPatientByEmail(CLINIC_ID, args.patientEmail);
      }

      if (!patient) {
        return { error: "No patient found with that information." };
      }

      const appointments = await getAppointments(CLINIC_ID, {
        patientId: patient.id,
      });
      const upcoming = appointments
        .filter((a) => a.status === "confirmed" && new Date(a.startTime) >= new Date())
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (upcoming.length === 0) {
        return { message: "No upcoming appointments found." };
      }

      const results = [];
      for (const apt of upcoming) {
        const service = await getService(apt.serviceId);
        results.push({
          id: apt.id,
          date: format(new Date(apt.startTime), "EEEE, MMMM d, yyyy"),
          time: format(new Date(apt.startTime), "h:mm a"),
          service: service?.name,
          status: apt.status,
        });
      }
      return { patientName: `${patient.firstName} ${patient.lastName}`, appointments: results };
    }

    case "register_patient": {
      const { firstName, lastName, email, phone, dateOfBirth } = args;
      if (!firstName || !lastName || !email || !phone) {
        return { error: "Missing required fields: firstName, lastName, email, phone" };
      }

      // Check if already exists
      let existing = await findPatientByEmail(CLINIC_ID, email);
      if (!existing) existing = await findPatientByPhone(CLINIC_ID, phone);
      if (existing) {
        return {
          message: "Patient already registered.",
          patientId: existing.id,
          name: `${existing.firstName} ${existing.lastName}`,
        };
      }

      const patient = await createPatient({
        clinicId: CLINIC_ID,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
      });

      return {
        success: true,
        patientId: patient.id,
        message: `Patient ${firstName} ${lastName} registered successfully.`,
      };
    }

    case "get_clinic_info": {
      const clinic = await getDefaultClinic();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      if (args.topic === "hours") {
        return {
          businessHours: Object.entries(clinic.businessHours).map(
            ([day, hours]) => ({
              day: days[parseInt(day)],
              hours: hours ? `${hours.start} - ${hours.end}` : "Closed",
            })
          ),
        };
      }

      return {
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email,
        businessHours: Object.entries(clinic.businessHours).map(
          ([day, hours]) => ({
            day: days[parseInt(day)],
            hours: hours ? `${hours.start} - ${hours.end}` : "Closed",
          })
        ),
        cancellationPolicy: clinic.settings.cancellationPolicy,
      };
    }

    case "get_faq_answer": {
      const { question } = args;
      if (!question) return { error: "Question is required" };

      let results = await searchFAQ(CLINIC_ID, question);
      if (results.length === 0) {
        // Return all FAQs if no match, let the AI pick the best one
        results = await getFAQEntries(CLINIC_ID);
      }
      return {
        faqResults: results.map((f) => ({
          question: f.question,
          answer: f.answer,
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
