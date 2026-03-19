import { NextRequest, NextResponse } from "next/server";
import { getServices, createService, deleteService } from "@/lib/db/services";

const CLINIC_ID = process.env.CLINIC_ID ?? "clinic-1";

export async function GET() {
  try {
    const services = await getServices(CLINIC_ID);
    return NextResponse.json({ services });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, durationMinutes, price, category } = body;

    if (!name || !description || durationMinutes == null || price == null) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, durationMinutes, price" },
        { status: 400 }
      );
    }

    const service = await createService({
      clinicId: CLINIC_ID,
      name,
      description,
      durationMinutes: Number(durationMinutes),
      price: Number(price),
      category: category || undefined,
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteService(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
