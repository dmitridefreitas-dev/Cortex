import { supabase } from "@/lib/supabase";
import type { Appointment, AppointmentStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

function rowToAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    providerId: row.provider_id as string,
    patientId: row.patient_id as string,
    serviceId: row.service_id as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    status: row.status as AppointmentStatus,
    notes: row.notes as string | undefined,
    bookedVia: row.booked_via as "chat" | "manual" | "online",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAppointments(
  clinicId: string,
  filters?: {
    providerId?: string;
    patientId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: AppointmentStatus;
  }
): Promise<Appointment[]> {
  let query = supabase.from("appointments").select("*").eq("clinic_id", clinicId);
  if (filters?.providerId) query = query.eq("provider_id", filters.providerId);
  if (filters?.patientId) query = query.eq("patient_id", filters.patientId);
  if (filters?.dateFrom) query = query.gte("start_time", filters.dateFrom);
  if (filters?.dateTo) {
    // Ensure inclusive end date if UI sends YYYY-MM-DD
    const endOfDay = filters.dateTo.includes("T") ? filters.dateTo : `${filters.dateTo}T23:59:59`;
    query = query.lte("start_time", endOfDay);
  }
  if (filters?.status) query = query.eq("status", filters.status);
  const { data } = await query;
  return (data || []).map(rowToAppointment);
}

export async function getAppointment(id: string): Promise<Appointment | undefined> {
  const { data } = await supabase.from("appointments").select("*").eq("id", id).single();
  return data ? rowToAppointment(data) : undefined;
}

export async function getAppointmentsByProviderAndDate(
  providerId: string,
  date: string
): Promise<Appointment[]> {
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("provider_id", providerId)
    .gte("start_time", dayStart)
    .lte("start_time", dayEnd)
    .neq("status", "cancelled");
  return (data || []).map(rowToAppointment);
}

export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<Appointment> {
  const now = new Date().toISOString();
  const id = `apt-${uuidv4().slice(0, 8)}`;
  const row = {
    id,
    clinic_id: data.clinicId,
    provider_id: data.providerId,
    patient_id: data.patientId,
    service_id: data.serviceId,
    start_time: data.startTime,
    end_time: data.endTime,
    status: data.status,
    notes: data.notes || null,
    booked_via: data.bookedVia,
    created_at: now,
    updated_at: now,
  };
  const { data: inserted } = await supabase.from("appointments").insert(row).select().single();
  return rowToAppointment(inserted!);
}

export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>
): Promise<Appointment | undefined> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.providerId !== undefined) row.provider_id = updates.providerId;
  if (updates.patientId !== undefined) row.patient_id = updates.patientId;
  if (updates.serviceId !== undefined) row.service_id = updates.serviceId;
  if (updates.startTime !== undefined) row.start_time = updates.startTime;
  if (updates.endTime !== undefined) row.end_time = updates.endTime;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.bookedVia !== undefined) row.booked_via = updates.bookedVia;

  const { data } = await supabase.from("appointments").update(row).eq("id", id).select().single();
  return data ? rowToAppointment(data) : undefined;
}

export async function cancelAppointment(id: string): Promise<Appointment | undefined> {
  return updateAppointment(id, { status: "cancelled" });
}
