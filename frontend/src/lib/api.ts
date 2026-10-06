import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "event_planner_session";
export const REFRESH_COOKIE = "event_planner_refresh";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type TokenBundle = {
  token: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export async function setAuthCookies(data: TokenBundle) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.expiresIn,
  });
  jar.set(REFRESH_COOKIE, data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.refreshExpiresIn,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

async function refreshAccessToken(): Promise<boolean> {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return false;

  try {
    const response = await fetch(
      `${process.env.API_URL}/api/v1/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      },
    );
    if (!response.ok) return false;
    const body = (await response.json()) as { data: TokenBundle };
    await setAuthCookies(body.data);
    return true;
  } catch {
    return false;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  _retried = false,
): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(
      `${process.env.API_URL}/api/v1${path}`,
      { ...options, headers, cache: "no-store" },
    );
  } catch {
    throw new ApiError(
      503,
      "We couldn’t reach the server. Please try again in a moment.",
    );
  }

  if (response.status === 401 && !_retried && path !== "/auth/refresh") {
    const refreshed = await refreshAccessToken();
    if (refreshed) return api<T>(path, options, true);
  }

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.message ?? "Something went wrong. Please try again.",
      body?.error?.fields,
    );
  }
  return body as T;
}
