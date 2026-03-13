import { NextRequest, NextResponse } from "next/server";
import { createFormResponse } from "@/lib/db/forms";

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
