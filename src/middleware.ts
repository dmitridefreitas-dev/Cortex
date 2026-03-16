import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const authCookie = req.cookies.get("dashboard_auth")?.value;

  if (authCookie === "1") {
    return NextResponse.next();
  }

  // Redirect to login page (outside dashboard layout)
  return NextResponse.redirect(new URL("/dashboard-login", req.url));
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
