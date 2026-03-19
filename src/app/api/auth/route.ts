import { NextRequest, NextResponse } from "next/server";

async function makeSessionToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:cortex-dashboard`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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

  const token = await makeSessionToken(correct);
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
