import { NextRequest, NextResponse } from "next/server";
import { getSchedules, setSchedule } from "@/lib/db/schedules";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        { error: "providerId query parameter is required" },
        { status: 400 }
      );
    }

    const schedules = await getSchedules(providerId);
    return NextResponse.json({ schedules });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { providerId, dayOfWeek, startTime, endTime, breakStart, breakEnd } =
      body;

    if (
      !providerId ||
      dayOfWeek === undefined ||
      dayOfWeek === null ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: providerId, dayOfWeek, startTime, endTime",
        },
        { status: 400 }
      );
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)" },
        { status: 400 }
      );
    }

    const schedule = await setSchedule({
      providerId,
      dayOfWeek,
      startTime,
      endTime,
      breakStart: breakStart ?? undefined,
      breakEnd: breakEnd ?? undefined,
    });

    return NextResponse.json({ schedule }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save schedule" },
      { status: 500 }
    );
  }
}
