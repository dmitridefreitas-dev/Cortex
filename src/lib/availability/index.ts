import { getSchedules, getScheduleOverrides } from "@/lib/db/schedules";
import { getAppointmentsByProviderAndDate } from "@/lib/db/appointments";
import { getService } from "@/lib/db/services";
import { getProvider } from "@/lib/db/providers";
import { getDefaultClinic } from "@/lib/db/clinics";
import type { TimeSlot } from "@/types";
import {
  parseISO,
  format,
  addMinutes,
  isBefore,
  isAfter,
  startOfDay,
  addDays,
} from "date-fns";

export async function getAvailableSlots(
  providerId: string,
  serviceId: string,
  date: string // "YYYY-MM-DD"
): Promise<TimeSlot[]> {
  const provider = await getProvider(providerId);
  if (!provider) return [];

  const service = await getService(serviceId);
  if (!service) return [];

  const clinic = await getDefaultClinic();
  const duration = service.durationMinutes;
  const buffer = clinic.settings.bufferMinutes;

  // Check schedule overrides first
  const overrides = await getScheduleOverrides(providerId, date, date);
  const override = overrides[0];

  if (override && !override.available) {
    return []; // Provider is off this day
  }

  // Get the schedule for this day of week
  const dayOfWeek = parseISO(date).getDay();
  const schedules = await getSchedules(providerId);
  const schedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);

  if (!schedule && !override?.available) {
    return []; // No schedule for this day
  }

  const startTime = override?.startTime ?? schedule?.startTime ?? "09:00";
  const endTime = override?.endTime ?? schedule?.endTime ?? "17:00";
  const breakStart = schedule?.breakStart;
  const breakEnd = schedule?.breakEnd;

  // Get existing appointments for this day
  const appointments = await getAppointmentsByProviderAndDate(
    providerId,
    date
  );

  // Generate all possible slots
  const slots: TimeSlot[] = [];
  let current = parseISO(`${date}T${startTime}:00`);
  const dayEnd = parseISO(`${date}T${endTime}:00`);

  // Don't show slots in the past
  const now = new Date();

  while (isBefore(current, dayEnd)) {
    const slotEnd = addMinutes(current, duration);

    // Slot must end before day ends
    if (isAfter(slotEnd, dayEnd)) break;

    // Skip if slot is in the past
    if (isBefore(current, now)) {
      current = addMinutes(current, 15); // Move in 15-min increments
      continue;
    }

    // Skip if slot overlaps with break
    if (breakStart && breakEnd) {
      const bStart = parseISO(`${date}T${breakStart}:00`);
      const bEnd = parseISO(`${date}T${breakEnd}:00`);
      if (isBefore(current, bEnd) && isAfter(slotEnd, bStart)) {
        current = bEnd; // Jump to after break
        continue;
      }
    }

    // Skip if slot overlaps with existing appointment
    const hasConflict = appointments.some((apt) => {
      const aptStart = parseISO(apt.startTime);
      const aptEnd = addMinutes(parseISO(apt.startTime), duration);
      // Add buffer
      const aptStartWithBuffer = addMinutes(aptStart, -buffer);
      const aptEndWithBuffer = addMinutes(aptEnd, buffer);
      return (
        isBefore(current, aptEndWithBuffer) &&
        isAfter(slotEnd, aptStartWithBuffer)
      );
    });

    if (!hasConflict) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        providerId,
        providerName: provider.name,
      });
    }

    current = addMinutes(current, 15); // 15-min slot increments
  }

  return slots;
}

export async function getAvailableSlotsMultiDay(
  providerId: string,
  serviceId: string,
  dateFrom: string,
  dateTo: string
): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = [];
  let current = startOfDay(parseISO(dateFrom));
  const end = startOfDay(parseISO(dateTo));

  while (!isAfter(current, end)) {
    const dateStr = format(current, "yyyy-MM-dd");
    const daySlots = await getAvailableSlots(providerId, serviceId, dateStr);
    slots.push(...daySlots);
    current = addDays(current, 1);
  }

  return slots;
}

export async function isSlotAvailable(
  providerId: string,
  startTime: string,
  durationMinutes: number
): Promise<boolean> {
  const date = startTime.split("T")[0];
  const appointments = await getAppointmentsByProviderAndDate(
    providerId,
    date
  );
  const clinic = await getDefaultClinic();
  const buffer = clinic.settings.bufferMinutes;
  const slotStart = parseISO(startTime);
  const slotEnd = addMinutes(slotStart, durationMinutes);

  return !appointments.some((apt) => {
    const aptStart = parseISO(apt.startTime);
    const aptEnd = parseISO(apt.endTime);
    const aptStartBuf = addMinutes(aptStart, -buffer);
    const aptEndBuf = addMinutes(aptEnd, buffer);
    return isBefore(slotStart, aptEndBuf) && isAfter(slotEnd, aptStartBuf);
  });
}
