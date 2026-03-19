import { NextRequest, NextResponse } from "next/server";
import { createFormResponse, getFormResponses } from "@/lib/db/forms";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const formId = searchParams.get("formId");
  if (!formId) {
    return NextResponse.json({ error: "formId required" }, { status: 400 });
  }
  const responses = await getFormResponses(formId);
  return NextResponse.json({ responses });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formId, patientId, appointmentId, responses } = body;

    if (!formId || !patientId || !responses) {
      return NextResponse.json(
        { error: "formId, patientId, and responses are required" },
        { status: 400 }
      );
    }

    const response = await createFormResponse({
      formId,
      patientId,
      appointmentId,
      responses,
    });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit form response" },
      { status: 500 }
    );
  }
}
