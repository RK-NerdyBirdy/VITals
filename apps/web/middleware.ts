import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const adminEmails = (process.env.ADMIN_EMAILS ?? "robomaneet@gmail.com")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const email = req.auth?.user?.email?.toLowerCase() ?? "";
  const isAdminUser = role === "ADMIN" || adminEmails.includes(email);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isDashboardAliasRoute = ["/opd", "/lab", "/records", "/profile"].some(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`)
  );

  if ((isAdminRoute || isDashboardRoute || isDashboardAliasRoute) && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && !isAdminUser) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/opd/:path*",
    "/lab/:path*",
    "/records/:path*",
    "/profile/:path*",
  ],
};
