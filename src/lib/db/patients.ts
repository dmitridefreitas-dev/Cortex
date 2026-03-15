import { supabase } from "@/lib/supabase";
import type { Patient } from "@/types";
import { v4 as uuidv4 } from "uuid";

function rowToPatient(row: Record<string, unknown>): Patient {
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    phone: row.phone as string,
    dateOfBirth: row.date_of_birth as string | undefined,
    insurance: row.insurance as Patient["insurance"],
    medicalHistory: row.medical_history as Patient["medicalHistory"],
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  };
}

export async function getPatients(clinicId: string): Promise<Patient[]> {
  const { data } = await supabase.from("patients").select("*").eq("clinic_id", clinicId);
  return (data || []).map(rowToPatient);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  const { data } = await supabase.from("patients").select("*").eq("id", id).single();
  return data ? rowToPatient(data) : undefined;
}

export async function findPatientByPhone(
  clinicId: string,
  phone: string
): Promise<Patient | undefined> {
  // Normalize: strip non-digits for comparison
  const normalized = phone.replace(/\D/g, "");
  // Fetch all patients for this clinic and filter client-side for phone normalization
  const { data } = await supabase.from("patients").select("*").eq("clinic_id", clinicId);
  const match = (data || []).find(
    (p) => (p.phone as string).replace(/\D/g, "") === normalized
  );
  return match ? rowToPatient(match) : undefined;
}

export async function findPatientByEmail(
  clinicId: string,
  email: string
): Promise<Patient | undefined> {
  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .ilike("email", email)
    .limit(1)
    .single();
  return data ? rowToPatient(data) : undefined;
}

export async function createPatient(
  data: Omit<Patient, "id" | "createdAt">
): Promise<Patient> {
  const id = `pat-${uuidv4().slice(0, 8)}`;
  const now = new Date().toISOString();
  const row = {
    id,
    clinic_id: data.clinicId,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    date_of_birth: data.dateOfBirth || null,
    insurance: data.insurance || null,
    medical_history: data.medicalHistory || null,
    notes: data.notes || null,
    created_at: now,
  };
  const { data: inserted } = await supabase.from("patients").insert(row).select().single();
  return rowToPatient(inserted!);
}

export async function updatePatient(
  id: string,
  updates: Partial<Patient>
): Promise<Patient | undefined> {
  const row: Record<string, unknown> = {};
  if (updates.firstName !== undefined) row.first_name = updates.firstName;
  if (updates.lastName !== undefined) row.last_name = updates.lastName;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.dateOfBirth !== undefined) row.date_of_birth = updates.dateOfBirth;
  if (updates.insurance !== undefined) row.insurance = updates.insurance;
  if (updates.medicalHistory !== undefined) row.medical_history = updates.medicalHistory;
  if (updates.notes !== undefined) row.notes = updates.notes;

  const { data } = await supabase.from("patients").update(row).eq("id", id).select().single();
  return data ? rowToPatient(data) : undefined;
}

export async function deletePatient(id: string): Promise<boolean> {
  // FK cascade handles appointments and intake_responses cleanup
  const { error } = await supabase.from("patients").delete().eq("id", id);
  return !error;
}

export async function searchPatients(
  clinicId: string,
  query: string
): Promise<Patient[]> {
  const q = `%${query}%`;
  const { data } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`);
  return (data || []).map(rowToPatient);
}
