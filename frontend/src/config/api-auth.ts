import "server-only";
import { cookies, headers } from "next/headers";
import api, {
  bindApiAuth,
  SESSION_COOKIE,
  REFRESH_COOKIE,
  type TokenBundle,
} from "@/config/api";

export async function setAuthCookies(data: TokenBundle) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: data.expiresIn,
  });
  jar.set(REFRESH_COOKIE, data.refreshToken, {
    httpOnly: true,
    secure,
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

async function getAccessToken() {
  const headerStore = await headers();
  return (
    headerStore.get("x-access-token") ??
    (await cookies()).get(SESSION_COOKIE)?.value ??
    null
  );
}

async function refreshAccessToken() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  try {
    const response = await api.post(
      "/auth/refresh",
      { refreshToken },
      { token: null },
    );
    const data = response.data.data as TokenBundle;
    try {
      await setAuthCookies(data);
    } catch {
      // RSC cannot set cookies; middleware covers page navigations.
    }
    return data.token;
  } catch {
    return null;
  }
}

bindApiAuth({
  getAccessToken,
  refreshAccessToken,
});
