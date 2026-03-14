import { supabase } from "@/lib/supabase";
import type { Service } from "@/types";
import { v4 as uuidv4 } from "uuid";

function rowToService(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    name: row.name as string,
    description: row.description as string,
    durationMinutes: row.duration_minutes as number,
    price: Number(row.price),
    category: row.category as string | undefined,
  };
}

export async function getServices(clinicId: string): Promise<Service[]> {
  const { data } = await supabase.from("services").select("*").eq("clinic_id", clinicId);
  return (data || []).map(rowToService);
}

export async function getService(id: string): Promise<Service | undefined> {
  const { data } = await supabase.from("services").select("*").eq("id", id).single();
  return data ? rowToService(data) : undefined;
}

export async function getServicesByProvider(providerId: string): Promise<Service[]> {
  const { data: links } = await supabase
    .from("provider_services")
    .select("service_id")
    .eq("provider_id", providerId);
  if (!links || links.length === 0) return [];
  const ids = links.map((l) => l.service_id);
  const { data } = await supabase.from("services").select("*").in("id", ids);
  return (data || []).map(rowToService);
}

export async function createService(data: Omit<Service, "id">): Promise<Service> {
  const id = `svc-${uuidv4().slice(0, 8)}`;
  const row = {
    id,
    clinic_id: data.clinicId,
    name: data.name,
    description: data.description,
    duration_minutes: data.durationMinutes,
    price: data.price,
    category: data.category,
  };
  const { data: inserted } = await supabase.from("services").insert(row).select().single();
  return rowToService(inserted!);
}

export async function updateService(
  id: string,
  updates: Partial<Service>
): Promise<Service | undefined> {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.durationMinutes !== undefined) row.duration_minutes = updates.durationMinutes;
  if (updates.price !== undefined) row.price = updates.price;
  if (updates.category !== undefined) row.category = updates.category;

  const { data } = await supabase.from("services").update(row).eq("id", id).select().single();
  return data ? rowToService(data) : undefined;
}

export async function deleteService(id: string): Promise<boolean> {
  const { error } = await supabase.from("services").delete().eq("id", id);
  return !error;
}

export async function assignServiceToProvider(
  serviceId: string,
  providerId: string
): Promise<void> {
  await supabase
    .from("provider_services")
    .upsert({ provider_id: providerId, service_id: serviceId }, { onConflict: "provider_id,service_id" });
}

export async function removeServiceFromProvider(
  serviceId: string,
  providerId: string
): Promise<void> {
  await supabase
    .from("provider_services")
    .delete()
    .eq("provider_id", providerId)
    .eq("service_id", serviceId);
}
