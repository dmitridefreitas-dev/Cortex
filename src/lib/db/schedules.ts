import { supabase } from "@/lib/supabase";
import type { Schedule, ScheduleOverride } from "@/types";
import { v4 as uuidv4 } from "uuid";

function rowToSchedule(row: Record<string, unknown>): Schedule {
  return {
    id: row.id as string,
    providerId: row.provider_id as string,
    dayOfWeek: row.day_of_week as number,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    breakStart: row.break_start as string | undefined,
    breakEnd: row.break_end as string | undefined,
  };
}

function rowToOverride(row: Record<string, unknown>): ScheduleOverride {
  return {
    id: row.id as string,
    providerId: row.provider_id as string,
    date: row.date as string,
    available: row.available as boolean,
    startTime: row.start_time as string | undefined,
    endTime: row.end_time as string | undefined,
    reason: row.reason as string | undefined,
  };
}

export async function getSchedules(providerId: string): Promise<Schedule[]> {
  const { data } = await supabase
    .from("schedules")
    .select("*")
    .eq("provider_id", providerId);
  return (data || []).map(rowToSchedule);
}

export async function setSchedule(data: Omit<Schedule, "id">): Promise<Schedule> {
  // Check if schedule exists for this provider + day
  const { data: existing } = await supabase
    .from("schedules")
    .select("id")
    .eq("provider_id", data.providerId)
    .eq("day_of_week", data.dayOfWeek)
    .single();

  const id = existing?.id || `sch-${uuidv4().slice(0, 8)}`;
  const row = {
    id,
    provider_id: data.providerId,
    day_of_week: data.dayOfWeek,
    start_time: data.startTime,
    end_time: data.endTime,
    break_start: data.breakStart || null,
    break_end: data.breakEnd || null,
  };

  const { data: upserted } = await supabase
    .from("schedules")
    .upsert(row, { onConflict: "provider_id,day_of_week" })
    .select()
    .single();
  return rowToSchedule(upserted!);
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  return !error;
}

export async function getScheduleOverrides(
  providerId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<ScheduleOverride[]> {
  let query = supabase
    .from("schedule_overrides")
    .select("*")
    .eq("provider_id", providerId);
  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);
  const { data } = await query;
  return (data || []).map(rowToOverride);
}

export async function setScheduleOverride(
  data: Omit<ScheduleOverride, "id">
): Promise<ScheduleOverride> {
  const { data: existing } = await supabase
    .from("schedule_overrides")
    .select("id")
    .eq("provider_id", data.providerId)
    .eq("date", data.date)
    .single();

  const id = existing?.id || `ovr-${uuidv4().slice(0, 8)}`;
  const row = {
    id,
    provider_id: data.providerId,
    date: data.date,
    available: data.available,
    start_time: data.startTime || null,
    end_time: data.endTime || null,
    reason: data.reason || null,
  };

  const { data: upserted } = await supabase
    .from("schedule_overrides")
    .upsert(row, { onConflict: "provider_id,date" })
    .select()
    .single();
  return rowToOverride(upserted!);
}

export async function deleteScheduleOverride(id: string): Promise<boolean> {
  const { error } = await supabase.from("schedule_overrides").delete().eq("id", id);
  return !error;
}
