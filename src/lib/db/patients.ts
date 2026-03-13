import { getDb } from ".";
import type { Patient } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function getPatients(clinicId: string): Promise<Patient[]> {
  const db = await getDb();
  return db.data.patients.filter((p) => p.clinicId === clinicId);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  const db = await getDb();
  return db.data.patients.find((p) => p.id === id);
}

export async function findPatientByPhone(
  clinicId: string,
  phone: string
): Promise<Patient | undefined> {
  const db = await getDb();
  const normalized = phone.replace(/\D/g, "");
  return db.data.patients.find(
    (p) => p.clinicId === clinicId && p.phone.replace(/\D/g, "") === normalized
  );
}

export async function findPatientByEmail(
  clinicId: string,
  email: string
): Promise<Patient | undefined> {
  const db = await getDb();
  return db.data.patients.find(
    (p) =>
      p.clinicId === clinicId &&
      p.email.toLowerCase() === email.toLowerCase()
  );
}

export async function createPatient(
  data: Omit<Patient, "id" | "createdAt">
): Promise<Patient> {
  const db = await getDb();
  const patient: Patient = {
    id: `pat-${uuidv4().slice(0, 8)}`,
    ...data,
    createdAt: new Date().toISOString(),
  };
  db.data.patients.push(patient);
  await db.write();
  return patient;
}

export async function updatePatient(
  id: string,
  updates: Partial<Patient>
): Promise<Patient | undefined> {
  const db = await getDb();
  const idx = db.data.patients.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  db.data.patients[idx] = { ...db.data.patients[idx], ...updates };
  await db.write();
  return db.data.patients[idx];
}

export async function searchPatients(
  clinicId: string,
  query: string
): Promise<Patient[]> {
  const db = await getDb();
  const q = query.toLowerCase();
  return db.data.patients.filter(
    (p) =>
      p.clinicId === clinicId &&
      (p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q))
  );
}
