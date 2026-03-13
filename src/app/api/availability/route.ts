import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!providerId || !serviceId || !date) {
    return NextResponse.json(
      { error: "providerId, serviceId, and date are required" },
      { status: 400 }
    );
  }

  const slots = await getAvailableSlots(providerId, serviceId, date);
  return NextResponse.json({ slots });
}
