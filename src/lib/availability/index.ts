import { getSchedules, getScheduleOverrides } from "@/lib/db/schedules";
import { getAppointmentsByProviderAndDate } from "@/lib/db/appointments";
import { getService } from "@/lib/db/services";
import { getProvider } from "@/lib/db/providers";
import { getDefaultClinic } from "@/lib/db/clinics";
import type { TimeSlot } from "@/types";
import {
  addMinutes,
  addHours,
  addDays,
  endOfDay,
  format,
  isBefore,
  isAfter,
  parseISO,
  startOfDay,
} from "date-fns";

/**
 * Strip timezone offset from ISO string so parseISO treats it as local time.
 * This ensures consistent comparisons between schedule times (local, no TZ)
 * and appointment times (TIMESTAMPTZ from Supabase, with TZ offset).
 */
function stripTZ(isoString: string): string {
  return isoString.replace(/([+-]\d{2}(:\d{2})?|Z)$/, "");
}

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
  const { earliestBookableAt, latestBookableAt } = getBookingWindow(clinic);

  const requestedDayStart = startOfDay(parseISO(date));
  if (
    isAfter(requestedDayStart, latestBookableAt) ||
    isBefore(endOfDay(requestedDayStart), earliestBookableAt)
  ) {
    return [];
  }

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
  while (isBefore(current, dayEnd)) {
    const slotEnd = addMinutes(current, duration);

    // Slot must end before day ends
    if (isAfter(slotEnd, dayEnd)) break;

    // Skip if slot is in the past
    if (isBefore(current, earliestBookableAt) || isAfter(current, latestBookableAt)) {
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
    // stripTZ ensures appointment times (TIMESTAMPTZ/UTC) are compared
    // in the same frame as schedule-derived slot times (local, no TZ)
    const hasConflict = appointments.some((apt) => {
      const aptStart = parseISO(stripTZ(apt.startTime));
      const aptEnd = parseISO(stripTZ(apt.endTime));
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
  const start = startOfDay(parseISO(dateFrom));
  const end = startOfDay(parseISO(dateTo));
  let current = isAfter(start, end) ? end : start;
  const rangeEnd = isAfter(start, end) ? start : end;

  while (!isAfter(current, rangeEnd)) {
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
  const clinic = await getDefaultClinic();
  const buffer = clinic.settings.bufferMinutes;
  const slotStart = parseISO(stripTZ(startTime));
  const slotEnd = addMinutes(slotStart, durationMinutes);
  const { earliestBookableAt, latestBookableAt } = getBookingWindow(clinic);

  if (isBefore(slotStart, earliestBookableAt) || isAfter(slotStart, latestBookableAt)) {
    return false;
  }

  const overrides = await getScheduleOverrides(providerId, date, date);
  const override = overrides[0];
  if (override && !override.available) {
    return false;
  }

  const schedules = await getSchedules(providerId);
  const schedule = schedules.find((item) => item.dayOfWeek === slotStart.getDay());
  if (!schedule && !override?.available) {
    return false;
  }

  const startLimit = parseISO(
    `${date}T${override?.startTime ?? schedule?.startTime ?? "09:00"}:00`
  );
  const endLimit = parseISO(
    `${date}T${override?.endTime ?? schedule?.endTime ?? "17:00"}:00`
  );

  if (isBefore(slotStart, startLimit) || isAfter(slotEnd, endLimit)) {
    return false;
  }

  if (schedule?.breakStart && schedule.breakEnd) {
    const breakStart = parseISO(`${date}T${schedule.breakStart}:00`);
    const breakEnd = parseISO(`${date}T${schedule.breakEnd}:00`);
    if (isBefore(slotStart, breakEnd) && isAfter(slotEnd, breakStart)) {
      return false;
    }
  }

  const appointments = await getAppointmentsByProviderAndDate(providerId, date);

  return !appointments.some((apt) => {
    const aptStart = parseISO(stripTZ(apt.startTime));
    const aptEnd = parseISO(stripTZ(apt.endTime));
    const aptStartBuf = addMinutes(aptStart, -buffer);
    const aptEndBuf = addMinutes(aptEnd, buffer);
    return isBefore(slotStart, aptEndBuf) && isAfter(slotEnd, aptStartBuf);
  });
}

function getBookingWindow(clinic: Awaited<ReturnType<typeof getDefaultClinic>>) {
  const now = new Date();
  return {
    earliestBookableAt: addHours(now, clinic.settings.minBookingNoticeHours),
    latestBookableAt: endOfDay(
      addDays(startOfDay(now), clinic.settings.maxBookingDaysAhead)
    ),
  };
}
