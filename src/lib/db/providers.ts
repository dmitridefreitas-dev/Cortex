import { supabase } from "@/lib/supabase";
import type { Provider } from "@/types";
import { v4 as uuidv4 } from "uuid";

function rowToProvider(row: Record<string, unknown>): Provider {
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    name: row.name as string,
    specialty: row.specialty as string,
    email: row.email as string,
    phone: row.phone as string,
    bio: row.bio as string,
    avatar: row.avatar as string | undefined,
  };
}

export async function getProviders(clinicId: string): Promise<Provider[]> {
  const { data } = await supabase.from("providers").select("*").eq("clinic_id", clinicId);
  return (data || []).map(rowToProvider);
}

export async function getProvider(id: string): Promise<Provider | undefined> {
  const { data } = await supabase.from("providers").select("*").eq("id", id).single();
  return data ? rowToProvider(data) : undefined;
}

export async function getProvidersByService(serviceId: string): Promise<Provider[]> {
  const { data: links } = await supabase
    .from("provider_services")
    .select("provider_id")
    .eq("service_id", serviceId);
  if (!links || links.length === 0) return [];
  const ids = links.map((l) => l.provider_id);
  const { data } = await supabase.from("providers").select("*").in("id", ids);
  return (data || []).map(rowToProvider);
}

export async function createProvider(data: Omit<Provider, "id">): Promise<Provider> {
  const id = `prov-${uuidv4().slice(0, 8)}`;
  const row = {
    id,
    clinic_id: data.clinicId,
    name: data.name,
    specialty: data.specialty,
    email: data.email,
    phone: data.phone,
    bio: data.bio,
    avatar: data.avatar,
  };
  const { data: inserted } = await supabase.from("providers").insert(row).select().single();
  return rowToProvider(inserted!);
}

export async function updateProvider(
  id: string,
  updates: Partial<Provider>
): Promise<Provider | undefined> {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.specialty !== undefined) row.specialty = updates.specialty;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.bio !== undefined) row.bio = updates.bio;
  if (updates.avatar !== undefined) row.avatar = updates.avatar;

  const { data } = await supabase.from("providers").update(row).eq("id", id).select().single();
  return data ? rowToProvider(data) : undefined;
}

export async function deleteProvider(id: string): Promise<boolean> {
  // FK cascade handles provider_services cleanup
  const { error } = await supabase.from("providers").delete().eq("id", id);
  return !error;
}
