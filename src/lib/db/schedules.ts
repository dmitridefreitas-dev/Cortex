import { getDb } from ".";
import type { Schedule, ScheduleOverride } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function getSchedules(providerId: string): Promise<Schedule[]> {
  const db = await getDb();
  return db.data.schedules.filter((s) => s.providerId === providerId);
}

export async function setSchedule(
  data: Omit<Schedule, "id">
): Promise<Schedule> {
  const db = await getDb();
  // Replace existing schedule for same provider + day
  const idx = db.data.schedules.findIndex(
    (s) => s.providerId === data.providerId && s.dayOfWeek === data.dayOfWeek
  );
  const schedule: Schedule = {
    id: idx >= 0 ? db.data.schedules[idx].id : `sch-${uuidv4().slice(0, 8)}`,
    ...data,
  };
  if (idx >= 0) {
    db.data.schedules[idx] = schedule;
  } else {
    db.data.schedules.push(schedule);
  }
  await db.write();
  return schedule;
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const db = await getDb();
  const idx = db.data.schedules.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  db.data.schedules.splice(idx, 1);
  await db.write();
  return true;
}

export async function getScheduleOverrides(
  providerId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<ScheduleOverride[]> {
  const db = await getDb();
  return db.data.scheduleOverrides.filter((o) => {
    if (o.providerId !== providerId) return false;
    if (dateFrom && o.date < dateFrom) return false;
    if (dateTo && o.date > dateTo) return false;
    return true;
  });
}

export async function setScheduleOverride(
  data: Omit<ScheduleOverride, "id">
): Promise<ScheduleOverride> {
  const db = await getDb();
  const idx = db.data.scheduleOverrides.findIndex(
    (o) => o.providerId === data.providerId && o.date === data.date
  );
  const override: ScheduleOverride = {
    id:
      idx >= 0
        ? db.data.scheduleOverrides[idx].id
        : `ovr-${uuidv4().slice(0, 8)}`,
    ...data,
  };
  if (idx >= 0) {
    db.data.scheduleOverrides[idx] = override;
  } else {
    db.data.scheduleOverrides.push(override);
  }
  await db.write();
  return override;
}

export async function deleteScheduleOverride(id: string): Promise<boolean> {
  const db = await getDb();
  const idx = db.data.scheduleOverrides.findIndex((o) => o.id === id);
  if (idx === -1) return false;
  db.data.scheduleOverrides.splice(idx, 1);
  await db.write();
  return true;
}
