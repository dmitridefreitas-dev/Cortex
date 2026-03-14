import { supabase } from "@/lib/supabase";
import type { IntakeForm, IntakeResponse, IntakeFormField } from "@/types";
import { v4 as uuidv4 } from "uuid";

function rowToForm(row: Record<string, unknown>): IntakeForm {
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    isActive: row.is_active as boolean,
    fields: row.fields as IntakeFormField[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToResponse(row: Record<string, unknown>): IntakeResponse {
  return {
    id: row.id as string,
    formId: row.form_id as string,
    patientId: row.patient_id as string,
    appointmentId: row.appointment_id as string | undefined,
    responses: row.responses as Record<string, string | string[] | boolean>,
    submittedAt: row.submitted_at as string,
  };
}

export async function getForms(clinicId: string): Promise<IntakeForm[]> {
  const { data } = await supabase.from("intake_forms").select("*").eq("clinic_id", clinicId);
  return (data || []).map(rowToForm);
}

export async function getForm(id: string): Promise<IntakeForm | undefined> {
  const { data } = await supabase.from("intake_forms").select("*").eq("id", id).single();
  return data ? rowToForm(data) : undefined;
}

export async function createForm(
  data: Omit<IntakeForm, "id" | "createdAt" | "updatedAt">
): Promise<IntakeForm> {
  const now = new Date().toISOString();
  const id = `form-${uuidv4()}`;
  const row = {
    id,
    clinic_id: data.clinicId,
    name: data.name,
    description: data.description || null,
    is_active: data.isActive,
    fields: data.fields,
    created_at: now,
    updated_at: now,
  };
  const { data: inserted } = await supabase.from("intake_forms").insert(row).select().single();
  return rowToForm(inserted!);
}

export async function updateForm(
  id: string,
  updates: Partial<IntakeForm>
): Promise<IntakeForm | undefined> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.isActive !== undefined) row.is_active = updates.isActive;
  if (updates.fields !== undefined) row.fields = updates.fields;

  const { data } = await supabase.from("intake_forms").update(row).eq("id", id).select().single();
  return data ? rowToForm(data) : undefined;
}

export async function deleteForm(id: string): Promise<boolean> {
  const { error } = await supabase.from("intake_forms").delete().eq("id", id);
  return !error;
}

export async function getFormResponses(formId: string): Promise<IntakeResponse[]> {
  const { data } = await supabase.from("intake_responses").select("*").eq("form_id", formId);
  return (data || []).map(rowToResponse);
}

export async function createFormResponse(
  data: Omit<IntakeResponse, "id" | "submittedAt">
): Promise<IntakeResponse> {
  const id = `resp-${uuidv4()}`;
  const row = {
    id,
    form_id: data.formId,
    patient_id: data.patientId,
    appointment_id: data.appointmentId || null,
    responses: data.responses,
    submitted_at: new Date().toISOString(),
  };
  const { data: inserted } = await supabase.from("intake_responses").insert(row).select().single();
  return rowToResponse(inserted!);
}
