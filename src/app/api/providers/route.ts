import { NextRequest, NextResponse } from "next/server";
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
} from "@/lib/db/providers";

const CLINIC_ID = process.env.CLINIC_ID ?? "clinic-1";

export async function GET() {
  try {
    const providers = await getProviders(CLINIC_ID);
    return NextResponse.json({ providers });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, specialty, expertise, email, phone, bio } = body;

    if (!name || !specialty || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields: name, specialty, email, phone" },
        { status: 400 }
      );
    }

    const provider = await createProvider({
      clinicId: CLINIC_ID,
      name,
      specialty,
      expertise: expertise ?? "",
      email,
      phone,
      bio: bio ?? "",
    });

    return NextResponse.json({ provider }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    const provider = await updateProvider(id, updates);
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ provider });
  } catch {
    return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteProvider(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}
