import { getDb } from ".";
import type { Appointment, AppointmentStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

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
  const db = await getDb();
  return db.data.appointments.filter((a) => {
    if (a.clinicId !== clinicId) return false;
    if (filters?.providerId && a.providerId !== filters.providerId) return false;
    if (filters?.patientId && a.patientId !== filters.patientId) return false;
    if (filters?.dateFrom && a.startTime < filters.dateFrom) return false;
    if (filters?.dateTo && a.startTime > filters.dateTo) return false;
    if (filters?.status && a.status !== filters.status) return false;
    return true;
  });
}

export async function getAppointment(
  id: string
): Promise<Appointment | undefined> {
  const db = await getDb();
  return db.data.appointments.find((a) => a.id === id);
}

export async function getAppointmentsByProviderAndDate(
  providerId: string,
  date: string
): Promise<Appointment[]> {
  const db = await getDb();
  return db.data.appointments.filter(
    (a) =>
      a.providerId === providerId &&
      a.startTime.startsWith(date) &&
      a.status !== "cancelled"
  );
}

export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<Appointment> {
  const db = await getDb();
  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: `apt-${uuidv4().slice(0, 8)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  db.data.appointments.push(appointment);
  await db.write();
  return appointment;
}

export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>
): Promise<Appointment | undefined> {
  const db = await getDb();
  const idx = db.data.appointments.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  db.data.appointments[idx] = {
    ...db.data.appointments[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.write();
  return db.data.appointments[idx];
}

export async function cancelAppointment(
  id: string
): Promise<Appointment | undefined> {
  return updateAppointment(id, { status: "cancelled" });
}
