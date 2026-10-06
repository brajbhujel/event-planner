import type { Response } from "express";
import { env } from "../config/env";

export const SESSION_COOKIE = "event_planner_session";
export const REFRESH_COOKIE = "event_planner_refresh";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export function setSessionCookies(res: Response, tokens: TokenPair) {
  const secure = env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expiresIn * 1000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.refreshExpiresIn * 1000,
  });
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}
