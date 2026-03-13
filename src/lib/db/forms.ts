import { getDb } from ".";
import type { IntakeForm, IntakeResponse } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function getForms(clinicId: string): Promise<IntakeForm[]> {
  const db = await getDb();
  return db.data.intakeForms?.filter((f) => f.clinicId === clinicId) || [];
}

export async function getForm(id: string): Promise<IntakeForm | undefined> {
  const db = await getDb();
  return db.data.intakeForms?.find((f) => f.id === id);
}

export async function createForm(data: Omit<IntakeForm, "id" | "createdAt" | "updatedAt">): Promise<IntakeForm> {
  const db = await getDb();
  if (!db.data.intakeForms) db.data.intakeForms = [];
  
  const now = new Date().toISOString();
  const form: IntakeForm = {
    ...data,
    id: `form-${uuidv4()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  db.data.intakeForms.push(form);
  await db.write();
  return form;
}

export async function updateForm(id: string, updates: Partial<IntakeForm>): Promise<IntakeForm | undefined> {
  const db = await getDb();
  if (!db.data.intakeForms) return undefined;
  
  const idx = db.data.intakeForms.findIndex((f) => f.id === id);
  if (idx === -1) return undefined;
  
  db.data.intakeForms[idx] = { 
    ...db.data.intakeForms[idx], 
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await db.write();
  return db.data.intakeForms[idx];
}

export async function deleteForm(id: string): Promise<boolean> {
  const db = await getDb();
  if (!db.data.intakeForms) return false;
  
  const idx = db.data.intakeForms.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  
  db.data.intakeForms.splice(idx, 1);
  await db.write();
  return true;
}

export async function getFormResponses(formId: string): Promise<IntakeResponse[]> {
  const db = await getDb();
  return db.data.intakeResponses?.filter((r) => r.formId === formId) || [];
}

export async function createFormResponse(data: Omit<IntakeResponse, "id" | "submittedAt">): Promise<IntakeResponse> {
  const db = await getDb();
  if (!db.data.intakeResponses) db.data.intakeResponses = [];
  
  const response: IntakeResponse = {
    ...data,
    id: `resp-${uuidv4()}`,
    submittedAt: new Date().toISOString(),
  };
  
  db.data.intakeResponses.push(response);
  await db.write();
  return response;
}
