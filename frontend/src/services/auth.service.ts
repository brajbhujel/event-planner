"use server";

import "@/config/api-auth";
import api, { ApiError } from "@/config/api";
import { setAuthCookies, clearAuthCookies } from "@/config/api-auth";
import type { User } from "@/validations";

export type AuthSession = {
  token: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  user: User;
};

export type LoginResult =
  | { kind: "session"; session: AuthSession }
  | { kind: "needsVerification"; email: string; testOtp?: string }
  | { kind: "requires2FA"; userId: string };

type AuthPayload = {
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  user?: User;
  needsVerification?: boolean;
  email?: string;
  requires2FA?: boolean;
  userId?: string;
  testOtp?: string;
};

function toSession(data: AuthPayload): AuthSession | null {
  if (
    !data.token ||
    !data.refreshToken ||
    !data.expiresIn ||
    !data.refreshExpiresIn ||
    !data.user
  ) {
    return null;
  }
  return {
    token: data.token,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    refreshExpiresIn: data.refreshExpiresIn,
    user: data.user,
  };
}

export const authService = {
  async signup(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthPayload> {
    const response = await api.post("/auth/signup", input);
    return response.data.data;
  },

  async login(input: {
    email: string;
    password: string;
  }): Promise<LoginResult> {
    const response = await api.post("/auth/login", input);
    const data = response.data.data as AuthPayload;

    if (data.needsVerification && data.email) {
      return {
        kind: "needsVerification",
        email: data.email,
        ...(data.testOtp ? { testOtp: data.testOtp } : {}),
      };
    }
    if (data.requires2FA && data.userId) {
      return { kind: "requires2FA", userId: data.userId };
    }
    const session = toSession(data);
    if (!session) throw new ApiError(500, "Unexpected login response.");
    return { kind: "session", session };
  },

  async completeTwoFactor(input: {
    userId: string;
    code: string;
    backup?: boolean;
  }): Promise<AuthSession> {
    const response = await api.post("/auth/2fa/session", input);
    const session = toSession(response.data.data);
    if (!session) throw new ApiError(500, "Could not complete 2FA login.");
    return session;
  },

  async verifyEmail(input: { email: string; code: string }): Promise<void> {
    await api.post("/auth/verify-email", input);
  },

  async resendOtp(email: string): Promise<{ sent: boolean; testOtp?: string }> {
    const response = await api.post("/auth/resend-otp", { email });
    return response.data.data;
  },

  async me(): Promise<User> {
    const response = await api.get("/auth/me");
    return response.data.data;
  },

  async updateProfile(input: { name: string }): Promise<User> {
    const response = await api.patch("/auth/me", input);
    return response.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
  },

  async twoFactorStatus(): Promise<{
    twoFactorEnabled: boolean;
    backupCodesCount: number;
  }> {
    const response = await api.get("/auth/2fa/status");
    return response.data.data;
  },

  async setupTwoFactor(): Promise<{ qrDataUrl: string; secret: string }> {
    const response = await api.post("/auth/2fa/setup");
    return response.data.data;
  },

  async verifyTwoFactor(token: string): Promise<{ backupCodes: string[] }> {
    const response = await api.post("/auth/2fa/verify", { token });
    return response.data.data;
  },

  async disableTwoFactor(token: string): Promise<void> {
    await api.post("/auth/2fa/disable", { token });
  },

  setSession: setAuthCookies,
  clearSession: clearAuthCookies,
};

export { ApiError };
