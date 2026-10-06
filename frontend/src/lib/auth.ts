import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/validations";
import { SESSION_COOKIE, REFRESH_COOKIE } from "@/config/api";
import { authService, ApiError } from "@/services/auth.service";

export const currentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  if (!jar.has(SESSION_COOKIE) && !jar.has(REFRESH_COOKIE)) return null;
  try {
    return await authService.me();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
