import { getDb } from ".";
import type { Clinic } from "@/types";

export async function getClinic(id: string): Promise<Clinic | undefined> {
  const db = await getDb();
  return db.data.clinics.find((c) => c.id === id);
}

export async function getDefaultClinic(): Promise<Clinic> {
  const db = await getDb();
  return db.data.clinics[0];
}

export async function updateClinic(
  id: string,
  updates: Partial<Clinic>
): Promise<Clinic | undefined> {
  const db = await getDb();
  const idx = db.data.clinics.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  db.data.clinics[idx] = { ...db.data.clinics[idx], ...updates };
  await db.write();
  return db.data.clinics[idx];
}
