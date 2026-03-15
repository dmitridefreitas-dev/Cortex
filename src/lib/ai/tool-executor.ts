import {
  getProvider,
  getProviders,
  getProvidersByService,
} from "@/lib/db/providers";
import { getServices, getServicesByProvider, getService } from "@/lib/db/services";
import { getAvailableSlots, getAvailableSlotsMultiDay } from "@/lib/availability";
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
import { addDays, addMinutes, format, isValid, parseISO } from "date-fns";

const CLINIC_ID = "clinic-1";

function normalizeDate(input: string): string | null {
  // Already YYYY-MM-DD (with optional zero-padding)
  const isoMatch = input.match(/^\d{4}-\d{1,2}-\d{1,2}$/);
  if (isoMatch) {
    const d = parseISO(input);
    return isValid(d) ? format(d, "yyyy-MM-dd") : null;
  }
  // Try JS Date constructor for natural language / other formats
  const parsed = new Date(input);
  return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : null;
}

function buildFormattedCalendar(
  slots: { start: string; providerName: string }[]
): { formattedCalendar: string; slotList: { startTime: string; date: string; displayTime: string }[] } {
  const limited = slots.slice(0, 24);
  const slotsByDate: Record<string, { displayTime: string; startTime: string }[]> = {};
  for (const s of limited) {
    const dateKey = format(new Date(s.start), "EEEE, MMMM d");
    if (!slotsByDate[dateKey]) slotsByDate[dateKey] = [];
    slotsByDate[dateKey].push({
      displayTime: format(new Date(s.start), "h:mm a"),
      startTime: s.start,
    });
  }

  const calendarLines: string[] = [];
  for (const [dateLabel, times] of Object.entries(slotsByDate)) {
    calendarLines.push(`📅 ${dateLabel}:`);
    for (let i = 0; i < times.length; i += 4) {
      const row = times.slice(i, i + 4).map((t) => t.displayTime).join("  |  ");
      calendarLines.push(`  ${row}`);
    }
    calendarLines.push("");
  }

  return {
    formattedCalendar: calendarLines.join("\n"),
    slotList: limited.map((s) => ({
      startTime: s.start,
      date: format(new Date(s.start), "yyyy-MM-dd"),
      displayTime: format(new Date(s.start), "h:mm a"),
    })),
  };
}

export async function executeTool(
  name: string,
  args: Record<string, string | undefined>
): Promise<unknown> {
  switch (name) {
    case "lookup_patient_memory": {
      const { patientPhone, patientEmail } = args;
      if (!patientPhone && !patientEmail) {
        return { error: "patientPhone or patientEmail is required" };
      }

      let patient = patientPhone
        ? await findPatientByPhone(CLINIC_ID, patientPhone)
        : undefined;

      if (!patient && patientEmail) {
        patient = await findPatientByEmail(CLINIC_ID, patientEmail);
      }

      if (!patient) {
        return {
          found: false,
          message:
            "No existing patient was found with that phone number or email.",
        };
      }

      const appointments = await getAppointments(CLINIC_ID, {
        patientId: patient.id,
      });
      const sortedAppointments = [...appointments].sort((a, b) =>
        b.startTime.localeCompare(a.startTime)
      );
      const latestAppointment =
        sortedAppointments.find((apt) => apt.status !== "cancelled") ??
        sortedAppointments[0];

      const upcomingAppointment = [...appointments]
        .filter(
          (apt) =>
            apt.status === "confirmed" && new Date(apt.startTime) >= new Date()
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

      const lastProvider = latestAppointment
        ? await getProvider(latestAppointment.providerId)
        : undefined;
      const lastService = latestAppointment
        ? await getService(latestAppointment.serviceId)
        : undefined;
      const upcomingProvider = upcomingAppointment
        ? await getProvider(upcomingAppointment.providerId)
        : undefined;
      const upcomingService = upcomingAppointment
        ? await getService(upcomingAppointment.serviceId)
        : undefined;

      return {
        found: true,
        patientId: patient.id,
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
        },
        hasVisitedBefore: appointments.length > 0,
        suggestedProvider: lastProvider
          ? {
              providerId: lastProvider.id,
              providerName: lastProvider.name,
              specialty: lastProvider.specialty,
            }
          : null,
        lastAppointment: latestAppointment
          ? {
              appointmentId: latestAppointment.id,
              startTime: latestAppointment.startTime,
              status: latestAppointment.status,
              providerId: latestAppointment.providerId,
              providerName: lastProvider?.name,
              serviceId: latestAppointment.serviceId,
              serviceName: lastService?.name,
            }
          : null,
        upcomingAppointment: upcomingAppointment
          ? {
              appointmentId: upcomingAppointment.id,
              startTime: upcomingAppointment.startTime,
              providerName: upcomingProvider?.name,
              serviceName: upcomingService?.name,
            }
          : null,
      };
    }

    case "list_providers": {
      if (args.serviceId) {
        const providers = await getProvidersByService(args.serviceId);
        return providers.map((p) => ({
          id: p.id,
          name: p.name,
          specialty: p.specialty,
          expertise: p.expertise,
          bio: p.bio,
        }));
      }
      const providers = await getProviders(CLINIC_ID);
      return providers.map((p) => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        expertise: p.expertise,
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
      const { providerId, serviceId, dateTo: rawDateTo } = args;
      let { date: rawDate } = args;
      if (!providerId || !serviceId || !rawDate) {
        return { error: "Missing required parameters: providerId, serviceId, date" };
      }

      // Normalize dates to YYYY-MM-DD
      const normalizedDate = normalizeDate(rawDate);
      if (!normalizedDate) {
        return {
          error: `Could not parse date "${rawDate}". Please use YYYY-MM-DD format (e.g., 2026-03-17).`,
        };
      }
      rawDate = normalizedDate;
      const normalizedDateTo = rawDateTo ? normalizeDate(rawDateTo) : undefined;

      const provider = await getProvider(providerId);
      if (!provider) {
        return { error: `Provider "${providerId}" not found.` };
      }

      const slots = normalizedDateTo
        ? await getAvailableSlotsMultiDay(providerId, serviceId, rawDate, normalizedDateTo)
        : await getAvailableSlots(providerId, serviceId, rawDate);

      if (slots.length === 0) {
        // Auto-expand: check the next 5 days if single-date query returned nothing
        if (!normalizedDateTo) {
          const expandEnd = format(addDays(parseISO(rawDate), 5), "yyyy-MM-dd");
          const nextSlots = await getAvailableSlotsMultiDay(providerId, serviceId, rawDate, expandEnd);
          if (nextSlots.length > 0) {
            const { formattedCalendar, slotList } = buildFormattedCalendar(nextSlots);
            return {
              message: `No slots on ${format(parseISO(rawDate), "EEEE, MMMM d")} for ${provider.name}. Here are the next available times:`,
              dateFrom: rawDate,
              dateTo: expandEnd,
              providerName: provider.name,
              totalMatchingSlots: nextSlots.length,
              formattedCalendar,
              displayInstruction: "Present the formattedCalendar text to the patient exactly as-is. Explain that the originally requested date had no openings but these nearby dates do.",
              availableSlots: slotList,
            };
          }
        }

        return {
          message: `No available slots found for ${provider.name}.`,
          checkedDate: rawDate,
          checkedDateTo: normalizedDateTo ?? null,
          dayOfWeek: format(parseISO(rawDate), "EEEE"),
          providerName: provider.name,
          suggestion: "Try a different date range or ask if the patient would like to see a different provider.",
        };
      }

      const { formattedCalendar, slotList } = buildFormattedCalendar(slots);

      return {
        dateFrom: rawDate,
        dateTo: normalizedDateTo ?? rawDate,
        providerName: provider.name,
        totalMatchingSlots: slots.length,
        truncated: slots.length > 24,
        formattedCalendar,
        displayInstruction: "Present the formattedCalendar text to the patient exactly as-is for readability. Ask them to pick a date and time.",
        availableSlots: slotList,
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
        let patient = args.patientEmail
          ? await findPatientByEmail(CLINIC_ID, args.patientEmail)
          : undefined;
        if (!patient && args.patientPhone) {
          patient = await findPatientByPhone(CLINIC_ID, args.patientPhone);
        }

        if (!patient) {
          const missingFields = [
            !args.patientFirstName && "patientFirstName",
            !args.patientLastName && "patientLastName",
            !args.patientEmail && "patientEmail",
            !args.patientPhone && "patientPhone",
            !args.patientDateOfBirth && "patientDateOfBirth",
          ].filter(Boolean);

          if (missingFields.length > 0) {
            return {
              error: `Missing required new patient fields: ${missingFields.join(", ")}`,
            };
          }

          patient = await createPatient({
            clinicId: CLINIC_ID,
            firstName: args.patientFirstName!,
            lastName: args.patientLastName!,
            email: args.patientEmail!,
            phone: args.patientPhone!,
            dateOfBirth: args.patientDateOfBirth,
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
        notes: args.reason,
      });

      // Send notifications (non-blocking — don't crash booking if they fail)
      try {
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
      } catch (e) {
        console.error("Notification send failed (non-fatal):", e);
      }

      return {
        success: true,
        appointmentId: appointment.id,
        patientId,
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

      try {
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
      } catch (e) {
        console.error("Cancel notification failed (non-fatal):", e);
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

    case "recommend_provider": {
      const { reason, patientAge } = args;
      if (!reason) return { error: "reason is required" };

      const providers = await getProviders(CLINIC_ID);
      return {
        patientNeed: reason,
        patientAge: patientAge || "not specified",
        providers: providers.map((p) => ({
          id: p.id,
          name: p.name,
          specialty: p.specialty,
          expertise: p.expertise,
          bio: p.bio,
        })),
        instruction:
          "Based on the patient's described need and the provider expertise above, recommend the best-matching provider. If the patient is a child (under 18), strongly prefer the pediatrician. Explain your recommendation briefly to the patient.",
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
