import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, REFRESH_COOKIE } from "@/config/cookies";

function accessExpired(token: string | undefined) {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized)) as { exp?: number };
    if (typeof json.exp !== "number") return true;
    return json.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

function forwardSetCookies(from: Response, to: NextResponse) {
  const getSetCookie = from.headers.getSetCookie?.bind(from.headers);
  const lines = getSetCookie ? getSetCookie() : [];
  for (const line of lines) {
    to.headers.append("set-cookie", line);
  }
}

export async function middleware(request: NextRequest) {
  const access = request.cookies.get(SESSION_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!refresh && !access) {
    if (isAuthPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!refresh || !accessExpired(access)) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return NextResponse.next();

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/v1/auth/refresh`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Cookie: `${REFRESH_COOKIE}=${refresh}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(SESSION_COOKIE);
      res.cookies.delete(REFRESH_COOKIE);
      return res;
    }

    const res = isAuthPage
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
    forwardSetCookies(response, res);
    return res;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/events/:path*",
    "/my-events/:path*",
    "/profile/:path*",
    "/login",
    "/signup",
  ],
};
