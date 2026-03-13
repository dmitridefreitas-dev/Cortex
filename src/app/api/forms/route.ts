import { NextRequest, NextResponse } from "next/server";
import { getForms, createForm, updateForm, deleteForm } from "@/lib/db/forms";

const CLINIC_ID = "clinic-1";

export async function GET() {
  const forms = await getForms(CLINIC_ID);
  return NextResponse.json({ forms });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const form = await createForm({
    clinicId: CLINIC_ID,
    name: body.name,
    description: body.description,
    isActive: body.isActive ?? true,
    fields: body.fields || [],
  });
  return NextResponse.json({ form });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const form = await updateForm(body.id, body);
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }
  return NextResponse.json({ form });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const success = await deleteForm(id);
  if (!success) {
    return NextResponse.json({ error: "FAQ entry not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
