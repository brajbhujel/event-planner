import api, { ApiError } from "@/config/api";
import type { User } from "@/validations";

export type LoginResult =
  | { kind: "session"; user: User }
  | { kind: "needsVerification"; email: string; testOtp?: string }
  | { kind: "requires2FA"; userId: string };

type AuthPayload = {
  user?: User;
  needsVerification?: boolean;
  email?: string;
  requires2FA?: boolean;
  userId?: string;
  testOtp?: string;
};

export const authService = {
  async signup(input: { name: string; email: string; password: string }) {
    const response = await api.post("/auth/signup", input);
    return response.data.data as AuthPayload;
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
    if (!data.user) throw new ApiError(500, "Unexpected login response.");
    return { kind: "session", user: data.user };
  },

  async completeTwoFactor(input: {
    userId: string;
    code: string;
    backup?: boolean;
  }) {
    const response = await api.post("/auth/2fa/session", input);
    const data = response.data.data as AuthPayload;
    if (!data.user) throw new ApiError(500, "Could not complete 2FA login.");
    return data.user;
  },

  async verifyEmail(input: { email: string; code: string }) {
    await api.post("/auth/verify-email", input);
  },

  async resendOtp(email: string) {
    const response = await api.post("/auth/resend-otp", { email });
    return response.data.data as { sent: boolean; testOtp?: string };
  },

  async me() {
    const response = await api.get("/auth/me");
    return response.data.data as User;
  },

  async updateProfile(input: { name: string }) {
    const response = await api.patch("/auth/me", input);
    return response.data.data as User;
  },

  async logout() {
    await api.post("/auth/logout");
  },

  async twoFactorStatus() {
    const response = await api.get("/auth/2fa/status");
    return response.data.data as {
      twoFactorEnabled: boolean;
      backupCodesCount: number;
    };
  },

  async setupTwoFactor() {
    const response = await api.post("/auth/2fa/setup");
    return response.data.data as { qrDataUrl: string; secret: string };
  },

  async verifyTwoFactor(token: string) {
    const response = await api.post("/auth/2fa/verify", { token });
    return response.data.data as { backupCodes: string[] };
  },

  async disableTwoFactor(token: string) {
    await api.post("/auth/2fa/disable", { token });
  },
};

export { ApiError };
