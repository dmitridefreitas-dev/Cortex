import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: recentAppts }, { data: recentConvos }, { data: recentResponses }] =
      await Promise.all([
        supabase
          .from("appointments")
          .select("id, status, start_time, booked_via, patient_id, provider_id, service_id, created_at")
          .gte("created_at", oneDayAgo)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("conversations")
          .select("id, patient_id, created_at, updated_at")
          .gte("updated_at", oneDayAgo)
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("intake_responses")
          .select("id, form_id, patient_id, submitted_at")
          .gte("submitted_at", oneDayAgo)
          .order("submitted_at", { ascending: false })
          .limit(10),
      ]);

    const activities: Array<{ type: string; description: string; timestamp: string; id: string }> = [];

    for (const apt of recentAppts || []) {
      const verb =
        apt.status === "cancelled"
          ? "cancelled"
          : apt.booked_via === "chat"
            ? "booked via AI chat"
            : "booked by staff";
      activities.push({
        type: "appointment",
        description: `Appointment ${verb}`,
        timestamp: apt.created_at,
        id: apt.id,
      });
    }

    for (const conv of recentConvos || []) {
      activities.push({
        type: "conversation",
        description: "AI conversation active",
        timestamp: conv.updated_at,
        id: conv.id,
      });
    }

    for (const resp of recentResponses || []) {
      activities.push({
        type: "intake",
        description: "Intake form submitted",
        timestamp: resp.submitted_at,
        id: resp.id,
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ activities: activities.slice(0, 30) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
