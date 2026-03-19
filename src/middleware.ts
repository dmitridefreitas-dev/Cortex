import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function makeSessionToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:cortex-dashboard`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const authCookie = req.cookies.get("dashboard_auth")?.value;
  const password = process.env.DASHBOARD_PASSWORD;

  if (password && authCookie === (await makeSessionToken(password))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/dashboard-login", req.url));
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
