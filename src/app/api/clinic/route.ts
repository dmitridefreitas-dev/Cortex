import { NextRequest, NextResponse } from "next/server";
import { getDefaultClinic, updateClinic } from "@/lib/db/clinics";

export async function GET() {
  const clinic = await getDefaultClinic();
  return NextResponse.json({ clinic });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const clinic = await updateClinic("clinic-1", body);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }
    return NextResponse.json({ clinic });
  } catch {
    return NextResponse.json(
      { error: "Failed to update clinic" },
      { status: 500 }
    );
  }
}
