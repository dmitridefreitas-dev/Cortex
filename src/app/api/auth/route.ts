import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function makeSessionToken(password: string): string {
  return createHash("sha256").update(`${password}:cortex-dashboard`).digest("hex");
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.DASHBOARD_PASSWORD;

  if (!correct) {
    return NextResponse.json(
      { error: "Dashboard password is not configured. Set DASHBOARD_PASSWORD in your environment." },
      { status: 503 }
    );
  }

  if (password.trim() !== correct.trim()) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = makeSessionToken(correct);
  const res = NextResponse.json({ success: true });
  res.cookies.set("dashboard_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
