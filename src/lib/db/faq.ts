import { supabase } from "@/lib/supabase";
import type { FAQEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";

function rowToFAQ(row: Record<string, unknown>): FAQEntry {
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    question: row.question as string,
    answer: row.answer as string,
  };
}

export async function getFAQEntries(clinicId: string): Promise<FAQEntry[]> {
  const { data } = await supabase.from("faq_entries").select("*").eq("clinic_id", clinicId);
  return (data || []).map(rowToFAQ);
}

export async function searchFAQ(clinicId: string, query: string): Promise<FAQEntry[]> {
  const q = `%${query}%`;
  const { data } = await supabase
    .from("faq_entries")
    .select("*")
    .eq("clinic_id", clinicId)
    .or(`question.ilike.${q},answer.ilike.${q}`);
  return (data || []).map(rowToFAQ);
}

export async function createFAQEntry(data: Omit<FAQEntry, "id">): Promise<FAQEntry> {
  const id = `faq-${uuidv4().slice(0, 8)}`;
  const row = {
    id,
    clinic_id: data.clinicId,
    question: data.question,
    answer: data.answer,
  };
  const { data: inserted } = await supabase.from("faq_entries").insert(row).select().single();
  return rowToFAQ(inserted!);
}

export async function updateFAQEntry(
  id: string,
  updates: Partial<FAQEntry>
): Promise<FAQEntry | undefined> {
  const row: Record<string, unknown> = {};
  if (updates.question !== undefined) row.question = updates.question;
  if (updates.answer !== undefined) row.answer = updates.answer;

  const { data } = await supabase.from("faq_entries").update(row).eq("id", id).select().single();
  return data ? rowToFAQ(data) : undefined;
}

export async function deleteFAQEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from("faq_entries").delete().eq("id", id);
  return !error;
}
