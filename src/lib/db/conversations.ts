import { supabase } from "@/lib/supabase";
import type { Conversation, ChatMessage } from "@/types";
import { v4 as uuidv4 } from "uuid";

function rowToConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    patientId: row.patient_id as string | undefined,
    messages: row.messages as ChatMessage[],
    summary: row.summary as string | undefined,
    status: (row.status as string | undefined) ?? "active",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getConversations(clinicId: string): Promise<Conversation[]> {
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("updated_at", { ascending: false });
  return (data || []).map(rowToConversation);
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const { data } = await supabase.from("conversations").select("*").eq("id", id).single();
  return data ? rowToConversation(data) : undefined;
}

export async function createConversation(
  data: Omit<Conversation, "createdAt" | "updatedAt">
): Promise<Conversation> {
  const now = new Date().toISOString();
  const id = data.id || `conv-${uuidv4()}`;
  const row = {
    id,
    clinic_id: data.clinicId,
    patient_id: data.patientId || null,
    messages: data.messages,
    summary: data.summary || null,
    created_at: now,
    updated_at: now,
  };
  const { data: inserted } = await supabase.from("conversations").insert(row).select().single();
  return rowToConversation(inserted!);
}

export async function addMessageToConversation(
  id: string,
  message: ChatMessage
): Promise<Conversation | undefined> {
  // Fetch current messages, append, then update
  const { data: existing } = await supabase
    .from("conversations")
    .select("messages")
    .eq("id", id)
    .single();
  if (!existing) return undefined;

  const messages = [...(existing.messages as ChatMessage[]), message];
  const { data: updated } = await supabase
    .from("conversations")
    .update({ messages, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return updated ? rowToConversation(updated) : undefined;
}

export async function summarizeConversation(
  id: string,
  summary: string
): Promise<Conversation | undefined> {
  const { data } = await supabase
    .from("conversations")
    .update({ summary, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return data ? rowToConversation(data) : undefined;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  return !error;
}

export async function setConversationPatientId(
  id: string,
  patientId: string
): Promise<Conversation | undefined> {
  const { data } = await supabase
    .from("conversations")
    .update({ patient_id: patientId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return data ? rowToConversation(data) : undefined;
}

export async function updateConversationStatus(id: string, status: string): Promise<void> {
  await supabase.from("conversations").update({ status }).eq("id", id);
}

export async function getActiveConversations(minutesAgo: number = 30): Promise<Conversation[]> {
  const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false });
  return (data || []).map(rowToConversation);
}
