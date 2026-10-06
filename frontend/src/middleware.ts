import { NextResponse, type NextRequest } from "next/server";
import api, { SESSION_COOKIE, REFRESH_COOKIE, ApiError } from "@/config/api";

type RefreshData = {
  token: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

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

function applyAuthCookies(res: NextResponse, data: RefreshData) {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: data.expiresIn,
  });
  res.cookies.set(REFRESH_COOKIE, data.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: data.refreshExpiresIn,
  });
}

export async function middleware(request: NextRequest) {
  const access = request.cookies.get(SESSION_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh || !accessExpired(access)) {
    return NextResponse.next();
  }

  try {
    const response = await api.post(
      "/auth/refresh",
      { refreshToken: refresh },
      { token: null },
    );
    const data = response.data.data as RefreshData;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-access-token", data.token);

    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    applyAuthCookies(res, data);
    return res;
  } catch (error) {
    const res = NextResponse.next();
    if (error instanceof ApiError && error.status === 401) {
      res.cookies.delete(SESSION_COOKIE);
      res.cookies.delete(REFRESH_COOKIE);
    }
    return res;
  }
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/events/:path*",
    "/my-events/:path*",
    "/profile/:path*",
  ],
};
