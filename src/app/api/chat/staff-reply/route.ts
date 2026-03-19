import { NextRequest, NextResponse } from "next/server";
import { addMessageToConversation, updateConversationStatus } from "@/lib/db/conversations";
import type { ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, staffName } = await req.json();
    if (!sessionId || !message) {
      return NextResponse.json({ error: "sessionId and message are required" }, { status: 400 });
    }

    const staffMessage: ChatMessage = {
      role: "assistant",
      content: `[Staff${staffName ? ` - ${staffName}` : ""}] ${message}`,
      timestamp: new Date().toISOString(),
    };

    await addMessageToConversation(sessionId, staffMessage);
    await updateConversationStatus(sessionId, "handed_off");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send staff reply" }, { status: 500 });
  }
}
