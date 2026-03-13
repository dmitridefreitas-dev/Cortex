import { getDb } from ".";
import type { FAQEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function getFAQEntries(clinicId: string): Promise<FAQEntry[]> {
  const db = await getDb();
  return db.data.faqEntries.filter((f) => f.clinicId === clinicId);
}

export async function searchFAQ(
  clinicId: string,
  query: string
): Promise<FAQEntry[]> {
  const db = await getDb();
  const q = query.toLowerCase();
  return db.data.faqEntries.filter(
    (f) =>
      f.clinicId === clinicId &&
      (f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q))
  );
}

export async function createFAQEntry(
  data: Omit<FAQEntry, "id">
): Promise<FAQEntry> {
  const db = await getDb();
  const entry: FAQEntry = { id: `faq-${uuidv4().slice(0, 8)}`, ...data };
  db.data.faqEntries.push(entry);
  await db.write();
  return entry;
}

export async function updateFAQEntry(
  id: string,
  updates: Partial<FAQEntry>
): Promise<FAQEntry | undefined> {
  const db = await getDb();
  const idx = db.data.faqEntries.findIndex((f) => f.id === id);
  if (idx === -1) return undefined;
  db.data.faqEntries[idx] = { ...db.data.faqEntries[idx], ...updates };
  await db.write();
  return db.data.faqEntries[idx];
}

export async function deleteFAQEntry(id: string): Promise<boolean> {
  const db = await getDb();
  const idx = db.data.faqEntries.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  db.data.faqEntries.splice(idx, 1);
  await db.write();
  return true;
}
