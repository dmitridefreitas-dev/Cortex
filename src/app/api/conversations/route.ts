import { NextResponse } from "next/server";
import { getConversations } from "@/lib/db/conversations";
import { getPatients } from "@/lib/db/patients";

const CLINIC_ID = "clinic-1";

export async function GET() {
  const [conversations, patients] = await Promise.all([
    getConversations(CLINIC_ID),
    getPatients(CLINIC_ID),
  ]);

  // Build a patientId -> name lookup map
  const patientMap = new Map(
    patients.map((p) => [p.id, `${p.firstName} ${p.lastName}`])
  );

  // Attach patientName to each conversation
  const enriched = conversations.map((c) => ({
    ...c,
    patientName: c.patientId ? patientMap.get(c.patientId) || null : null,
  }));

  return NextResponse.json({ conversations: enriched });
}
