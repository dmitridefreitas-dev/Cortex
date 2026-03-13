import { getDb } from ".";
import type { Conversation, ChatMessage } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function getConversations(clinicId: string): Promise<Conversation[]> {
  const db = await getDb();
  return db.data.conversations
    .filter((c) => c.clinicId === clinicId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await getDb();
  return db.data.conversations.find((c) => c.id === id);
}

export async function createConversation(data: Omit<Conversation, "createdAt" | "updatedAt">): Promise<Conversation> {
  const db = await getDb();
  const now = new Date().toISOString();
  const conv: Conversation = {
    ...data,
    id: data.id || `conv-${uuidv4()}`,
    createdAt: now,
    updatedAt: now,
  };
  db.data.conversations.push(conv);
  await db.write();
  return conv;
}

export async function addMessageToConversation(
  id: string,
  message: ChatMessage
): Promise<Conversation | undefined> {
  const db = await getDb();
  const idx = db.data.conversations.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;

  db.data.conversations[idx].messages.push(message);
  db.data.conversations[idx].updatedAt = new Date().toISOString();
  await db.write();
  return db.data.conversations[idx];
}

export async function summarizeConversation(id: string, summary: string): Promise<Conversation | undefined> {
  const db = await getDb();
  const idx = db.data.conversations.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;

  db.data.conversations[idx].summary = summary;
  db.data.conversations[idx].updatedAt = new Date().toISOString();
  await db.write();
  return db.data.conversations[idx];
}
