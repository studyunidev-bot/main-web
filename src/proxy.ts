import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const locales = ["th", "en", "ja", "zh"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "template-only-secret-change-before-deploy",
  });
  const isAdmin = pathname.startsWith("/admins") || pathname.startsWith("/api/admin") || pathname.startsWith("/gatpat/admin");

  if (isAdmin && !token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (token && pathname.startsWith("/auth")) {
    const requestedDestination = request.nextUrl.searchParams.get("callbackUrl") ?? "";
    if (requestedDestination.startsWith("/webb/")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/gatpat/admin/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
