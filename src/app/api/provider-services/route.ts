import { NextRequest, NextResponse } from "next/server";
import { getServicesByProvider, assignServiceToProvider, removeServiceFromProvider } from "@/lib/db/services";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "providerId required" }, { status: 400 });
  const services = await getServicesByProvider(providerId);
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const { providerId, serviceId } = await req.json();
  if (!providerId || !serviceId) return NextResponse.json({ error: "providerId and serviceId required" }, { status: 400 });
  await assignServiceToProvider(serviceId, providerId);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");
  const serviceId = searchParams.get("serviceId");
  if (!providerId || !serviceId) return NextResponse.json({ error: "providerId and serviceId required" }, { status: 400 });
  await removeServiceFromProvider(serviceId, providerId);
  return NextResponse.json({ success: true });
}
