import { getDb } from ".";
import type { Service } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function getServices(clinicId: string): Promise<Service[]> {
  const db = await getDb();
  return db.data.services.filter((s) => s.clinicId === clinicId);
}

export async function getService(id: string): Promise<Service | undefined> {
  const db = await getDb();
  return db.data.services.find((s) => s.id === id);
}

export async function getServicesByProvider(
  providerId: string
): Promise<Service[]> {
  const db = await getDb();
  const serviceIds = db.data.providerServices
    .filter((ps) => ps.providerId === providerId)
    .map((ps) => ps.serviceId);
  return db.data.services.filter((s) => serviceIds.includes(s.id));
}

export async function createService(
  data: Omit<Service, "id">
): Promise<Service> {
  const db = await getDb();
  const service: Service = { id: `svc-${uuidv4().slice(0, 8)}`, ...data };
  db.data.services.push(service);
  await db.write();
  return service;
}

export async function updateService(
  id: string,
  updates: Partial<Service>
): Promise<Service | undefined> {
  const db = await getDb();
  const idx = db.data.services.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  db.data.services[idx] = { ...db.data.services[idx], ...updates };
  await db.write();
  return db.data.services[idx];
}

export async function deleteService(id: string): Promise<boolean> {
  const db = await getDb();
  const idx = db.data.services.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  db.data.services.splice(idx, 1);
  db.data.providerServices = db.data.providerServices.filter(
    (ps) => ps.serviceId !== id
  );
  await db.write();
  return true;
}

export async function assignServiceToProvider(
  serviceId: string,
  providerId: string
): Promise<void> {
  const db = await getDb();
  const exists = db.data.providerServices.some(
    (ps) => ps.serviceId === serviceId && ps.providerId === providerId
  );
  if (!exists) {
    db.data.providerServices.push({ serviceId, providerId });
    await db.write();
  }
}

export async function removeServiceFromProvider(
  serviceId: string,
  providerId: string
): Promise<void> {
  const db = await getDb();
  db.data.providerServices = db.data.providerServices.filter(
    (ps) => !(ps.serviceId === serviceId && ps.providerId === providerId)
  );
  await db.write();
}
