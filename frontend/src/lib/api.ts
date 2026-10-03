import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "event_planner_session";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(
      `${process.env.API_URL ?? "http://localhost:4000"}/api/v1${path}`,
      { ...options, headers, cache: "no-store" },
    );
  } catch {
    throw new ApiError(
      503,
      "We couldn’t reach the server. Please try again in a moment.",
    );
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
