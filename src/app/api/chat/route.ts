import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai/gemini";
import type { ChatMessage, Conversation } from "@/types";
import { getConversation, createConversation, addMessageToConversation } from "@/lib/db/conversations";

const CLINIC_ID = "clinic-1";

export async function POST(req: NextRequest) {
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
    const { reply, toolCalls } = await chat(history);

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

    return NextResponse.json({
      reply,
      sessionId,
    });
  } catch (error) {
    console.error("Chat API error:", error instanceof Error ? error.message : error);
    console.error("Stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { error: "Failed to process chat message", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
