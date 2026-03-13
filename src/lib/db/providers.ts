import { getDb } from ".";
import type { Provider } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function getProviders(clinicId: string): Promise<Provider[]> {
  const db = await getDb();
  return db.data.providers.filter((p) => p.clinicId === clinicId);
}

export async function getProvider(id: string): Promise<Provider | undefined> {
  const db = await getDb();
  return db.data.providers.find((p) => p.id === id);
}

export async function getProvidersByService(
  serviceId: string
): Promise<Provider[]> {
  const db = await getDb();
  const providerIds = db.data.providerServices
    .filter((ps) => ps.serviceId === serviceId)
    .map((ps) => ps.providerId);
  return db.data.providers.filter((p) => providerIds.includes(p.id));
}

export async function createProvider(
  data: Omit<Provider, "id">
): Promise<Provider> {
  const db = await getDb();
  const provider: Provider = { id: `prov-${uuidv4().slice(0, 8)}`, ...data };
  db.data.providers.push(provider);
  await db.write();
  return provider;
}

export async function updateProvider(
  id: string,
  updates: Partial<Provider>
): Promise<Provider | undefined> {
  const db = await getDb();
  const idx = db.data.providers.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  db.data.providers[idx] = { ...db.data.providers[idx], ...updates };
  await db.write();
  return db.data.providers[idx];
}

export async function deleteProvider(id: string): Promise<boolean> {
  const db = await getDb();
  const idx = db.data.providers.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  db.data.providers.splice(idx, 1);
  db.data.providerServices = db.data.providerServices.filter(
    (ps) => ps.providerId !== id
  );
  await db.write();
  return true;
}
