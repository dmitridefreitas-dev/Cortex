import { NextRequest, NextResponse } from "next/server";
import { getPatients, createPatient, updatePatient, deletePatient } from "@/lib/db/patients";

const CLINIC_ID = process.env.CLINIC_ID ?? "clinic-1";

export async function GET() {
  try {
    const patients = await getPatients(CLINIC_ID);
    return NextResponse.json({ patients });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, dateOfBirth, notes } = body;

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: firstName, lastName, email, phone",
        },
        { status: 400 }
      );
    }

    const patient = await createPatient({
      clinicId: CLINIC_ID,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth ?? undefined,
      notes: notes ?? undefined,
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const patient = await updatePatient(id, updates);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch {
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }
  const success = await deletePatient(id);
  if (!success) {
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
