import { NextRequest, NextResponse } from "next/server";
import { getFAQEntries, createFAQEntry, updateFAQEntry, deleteFAQEntry } from "@/lib/db/faq";

const CLINIC_ID = process.env.CLINIC_ID ?? "clinic-1";

export async function GET() {
  const entries = await getFAQEntries(CLINIC_ID);
  return NextResponse.json({ faqEntries: entries });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.question || !body.answer) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
  }
  const entry = await createFAQEntry({ clinicId: CLINIC_ID, question: body.question, answer: body.answer });
  return NextResponse.json({ faqEntry: entry });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const entry = await updateFAQEntry(body.id, body);
  if (!entry) {
    return NextResponse.json({ error: "FAQ entry not found" }, { status: 404 });
  }
  return NextResponse.json({ faqEntry: entry });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const success = await deleteFAQEntry(id);
  if (!success) {
    return NextResponse.json({ error: "FAQ entry not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
