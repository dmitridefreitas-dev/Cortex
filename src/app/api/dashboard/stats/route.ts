import { NextRequest, NextResponse } from "next/server";
import { getAppointments } from "@/lib/db/appointments";
import { getPatients } from "@/lib/db/patients";
import { getServices } from "@/lib/db/services";
import { getProviders } from "@/lib/db/providers";
import { isToday } from "date-fns";

const CLINIC_ID = "clinic-1";

export async function GET(req: NextRequest) {
  try {
    const appointments = await getAppointments(CLINIC_ID);
    const patients = await getPatients(CLINIC_ID);
    const services = await getServices(CLINIC_ID);
    const providers = await getProviders(CLINIC_ID);

    const todayApts = appointments.filter((a) => isToday(new Date(a.startTime)));
    const confirmedToday = todayApts.filter(a => a.status === "confirmed").length;
    
    // Calculate new patients in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newPatients = patients.filter(p => new Date(p.createdAt) >= thirtyDaysAgo).length;

    const stats = {
      appointmentsToday: confirmedToday,
      totalPatients: patients.length,
      newPatientsLast30: newPatients,
      totalServices: services.length,
      totalProviders: providers.length,
      appointmentsTotal: appointments.length,
    };

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
