import { supabase } from "@/lib/supabase";
import type { Clinic } from "@/types";

function rowToClinic(row: Record<string, unknown>): Clinic {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    phone: row.phone as string,
    email: row.email as string,
    timezone: row.timezone as string,
    businessHours: row.business_hours as Clinic["businessHours"],
    settings: row.settings as Clinic["settings"],
  };
}

function clinicToRow(clinic: Partial<Clinic>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (clinic.id !== undefined) row.id = clinic.id;
  if (clinic.name !== undefined) row.name = clinic.name;
  if (clinic.address !== undefined) row.address = clinic.address;
  if (clinic.phone !== undefined) row.phone = clinic.phone;
  if (clinic.email !== undefined) row.email = clinic.email;
  if (clinic.timezone !== undefined) row.timezone = clinic.timezone;
  if (clinic.businessHours !== undefined) row.business_hours = clinic.businessHours;
  if (clinic.settings !== undefined) row.settings = clinic.settings;
  return row;
}

export async function getClinic(id: string): Promise<Clinic | undefined> {
  const { data } = await supabase.from("clinics").select("*").eq("id", id).single();
  return data ? rowToClinic(data) : undefined;
}

export async function getDefaultClinic(): Promise<Clinic> {
  const { data } = await supabase.from("clinics").select("*").limit(1).single();
  return rowToClinic(data!);
}

export async function updateClinic(
  id: string,
  updates: Partial<Clinic>
): Promise<Clinic | undefined> {
  const { data } = await supabase
    .from("clinics")
    .update(clinicToRow(updates))
    .eq("id", id)
    .select()
    .single();
  return data ? rowToClinic(data) : undefined;
}
