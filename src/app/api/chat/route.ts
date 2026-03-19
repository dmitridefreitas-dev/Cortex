import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai/gemini";
import type { ChatMessage, Conversation } from "@/types";
import {
  getConversation,
  createConversation,
  addMessageToConversation,
  setConversationPatientId,
  updateConversationStatus,
} from "@/lib/db/conversations";

export const maxDuration = 60;

const CLINIC_ID = process.env.CLINIC_ID ?? "clinic-1";

// Simple in-memory rate limiter: 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 20) {
    return false;
  }

  entry.count += 1;
  return true;
}

function checkEnvVars(): string | null {
  if (!process.env.GEMINI_API_KEY) return "GEMINI_API_KEY is not set in environment variables.";
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return "NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.";
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return "SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.";
  return null;
}

export async function POST(req: NextRequest) {
  const missingEnv = checkEnvVars();
  if (missingEnv) {
    console.error("Missing env var:", missingEnv);
    return NextResponse.json({ error: missingEnv }, { status: 503 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { message, sessionId } = body as {
      message: string;
      sessionId: string;
    };

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "message and sessionId are required" },
        { status: 400 }
      );
    }

    // Get or create session in DB
    let conversation = await getConversation(sessionId);
    if (!conversation) {
      conversation = await createConversation({
        id: sessionId,
        clinicId: CLINIC_ID,
        messages: [],
      } as Omit<Conversation, "createdAt" | "updatedAt">);
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    await addMessageToConversation(sessionId, userMessage);
    const history = [...conversation.messages, userMessage];

    // Get AI response
    const { reply, toolCalls } = await chat(history, conversation.patientId);

    // Add assistant message
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: reply,
      timestamp: new Date().toISOString(),
      toolCalls: toolCalls.map((tc) => ({
        name: tc.name,
        args: tc.args,
        result: tc.result,
      })),
    };
    await addMessageToConversation(sessionId, assistantMessage);

    const handoff = toolCalls.find(
      (tc) => tc.result && typeof tc.result === "object" && (tc.result as Record<string, unknown>).handoffRequested
    );
    await updateConversationStatus(sessionId, handoff ? "needs_handoff" : "active");

    const patientId = extractPatientId(toolCalls);
    if (patientId && patientId !== conversation.patientId) {
      await setConversationPatientId(sessionId, patientId);
    }

    return NextResponse.json({
      reply,
      sessionId,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Chat API error:", detail);
    console.error("Stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { error: "Failed to process chat message", detail },
      { status: 500 }
    );
  }
}

function extractPatientId(
  toolCalls: Array<{ name: string; args: Record<string, string>; result: unknown }>
): string | undefined {
  for (let index = toolCalls.length - 1; index >= 0; index -= 1) {
    const result = toolCalls[index]?.result;
    if (!result || typeof result !== "object") continue;
    const resultRecord = result as Record<string, unknown>;

    if (typeof resultRecord.patientId === "string") {
      return resultRecord.patientId;
    }

    const patient = resultRecord.patient;
    if (
      patient &&
      typeof patient === "object" &&
      typeof (patient as Record<string, unknown>).id === "string"
    ) {
      return (patient as Record<string, string>).id;
    }
  }

  return undefined;
}
