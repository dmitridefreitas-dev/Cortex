import { NextRequest, NextResponse } from "next/server";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointment,
} from "@/lib/db/appointments";
import { getService } from "@/lib/db/services";
import { addMinutes } from "date-fns";
import { isSlotAvailable } from "@/lib/availability";

const CLINIC_ID = "clinic-1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const status = searchParams.get("status") as
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no_show"
    | undefined;

  const appointments = await getAppointments(CLINIC_ID, {
    providerId,
    dateFrom,
    dateTo,
    status,
  });

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { providerId, serviceId, patientId, startTime } = body;

    if (!providerId || !serviceId || !patientId || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const service = await getService(serviceId);
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const available = await isSlotAvailable(
      providerId,
      startTime,
      service.durationMinutes
    );
    if (!available) {
      return NextResponse.json(
        { error: "Time slot is not available" },
        { status: 409 }
      );
    }

    const endTime = addMinutes(
      new Date(startTime),
      service.durationMinutes
    ).toISOString();

    const appointment = await createAppointment({
      clinicId: CLINIC_ID,
      providerId,
      serviceId,
      patientId,
      startTime,
      endTime,
      status: "confirmed",
      bookedVia: "manual",
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    if (updates.status === "cancelled") {
      const appointment = await cancelAppointment(id);
      return NextResponse.json({ appointment });
    }

    const appointment = await updateAppointment(id, updates);
    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch {
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
