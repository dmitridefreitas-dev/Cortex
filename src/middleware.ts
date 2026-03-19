import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

function makeSessionToken(password: string): string {
  return createHash("sha256").update(`${password}:cortex-dashboard`).digest("hex");
}

export function middleware(req: NextRequest) {
  const authCookie = req.cookies.get("dashboard_auth")?.value;
  const password = process.env.DASHBOARD_PASSWORD;

  if (password && authCookie === makeSessionToken(password)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/dashboard-login", req.url));
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
