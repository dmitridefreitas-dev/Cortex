import { NextResponse } from "next/server";
import { getConversations } from "@/lib/db/conversations";

const CLINIC_ID = "clinic-1";

export async function GET() {
  const conversations = await getConversations(CLINIC_ID);
  return NextResponse.json({ conversations });
}
