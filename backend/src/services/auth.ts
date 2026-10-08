import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { User } from "../validations";
import { db } from "../config/db";
import { AppError } from "../middleware/error";
import { issueTokenPair, verifyRefreshToken } from "./tokens";
import { issueSignupOtp, verifySignupOtp } from "./otp";
import {
  assertTotpOrBackup,
  disableTwoFactor,
  getTwoFactorStatus,
  loadUserFor2fa,
  setupTwoFactor,
  verifyAndEnableTwoFactor,
} from "./two-factor";

export type PublicUser = User & {
  emailVerified: boolean;
  twoFactorEnabled: boolean;
};

export type AuthSession = {
  user: PublicUser;
  tokens: ReturnType<typeof issueTokenPair>;
};

function publicUser(row: {
  id: string;
  name: string;
  email: string;
  email_verified_at?: Date | string | null;
  two_factor_enabled?: boolean;
}): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: Boolean(row.email_verified_at),
    twoFactorEnabled: Boolean(row.two_factor_enabled),
  };
}

function issueAuth(user: {
  id: string;
  name: string;
  email: string;
  email_verified_at?: Date | string | null;
  two_factor_enabled?: boolean;
}): AuthSession {
  return {
    user: publicUser(user),
    tokens: issueTokenPair({
      sub: user.id,
      name: user.name,
      email: user.email,
    }),
  };
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}) {
  const [user] = await db("users")
    .insert({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      password_hash: await bcrypt.hash(input.password, 10),
      email_verified_at: null,
    })
    .returning(["id", "name", "email", "email_verified_at"]);

  const testOtp = await issueSignupOtp(user.id, user.email);
  return {
    needsVerification: true as const,
    email: user.email as string,
    ...(testOtp ? { testOtp } : {}),
  };
}

export async function verifyEmail(input: { email: string; code: string }) {
  const user = await db("users").where({ email: input.email }).first();
  if (!user) throw new AppError(404, "No account found for that email.");
  if (user.email_verified_at) {
    return { verified: true as const, alreadyVerified: true as const };
  }

  await verifySignupOtp(user.id, input.code);
  await db("users")
    .where({ id: user.id })
    .update({ email_verified_at: db.fn.now() });

  return { verified: true as const };
}

export async function resendOtp(email: string) {
  const user = await db("users").where({ email }).first();
  if (!user) throw new AppError(404, "No account found for that email.");
  if (user.email_verified_at) {
    throw new AppError(400, "Email is already verified. You can sign in.");
  }
  const testOtp = await issueSignupOtp(user.id, user.email);
  return { sent: true as const, ...(testOtp ? { testOtp } : {}) };
}

export type LoginResult =
  | { kind: "needsVerification"; email: string }
  | { kind: "requires2FA"; userId: string }
  | { kind: "session"; session: AuthSession };

export async function login(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const user = await db("users").where({ email: input.email }).first();
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new AppError(401, "Email or password is incorrect.");
  }
  if (!user.email_verified_at) {
    return { kind: "needsVerification", email: user.email };
  }
  if (user.two_factor_enabled) {
    return { kind: "requires2FA", userId: user.id };
  }
  return { kind: "session", session: issueAuth(user) };
}

export async function completeTwoFactor(input: {
  userId: string;
  code: string;
  backup?: boolean;
}): Promise<AuthSession> {
  const user = await loadUserFor2fa(input.userId);
  if (!user.two_factor_enabled) {
    throw new AppError(400, "Two-factor authentication is not enabled.");
  }
  await assertTotpOrBackup(user, input.code, { preferBackup: input.backup });
  return issueAuth(user);
}

export async function refresh(refreshToken: string): Promise<AuthSession> {
  let payload: { sub?: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }

  const user = await db("users").where({ id: payload.sub }).first();
  if (!user) {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }
  return issueAuth(user);
}

export async function me(userId: string): Promise<PublicUser> {
  const row = await db("users").where({ id: userId }).first();
  if (!row) throw new AppError(401, "Please sign in to continue.");
  return publicUser(row);
}

export async function updateProfile(
  userId: string,
  input: { name: string },
): Promise<PublicUser> {
  const [user] = await db("users")
    .where({ id: userId })
    .update({ name: input.name })
    .returning([
      "id",
      "name",
      "email",
      "email_verified_at",
      "two_factor_enabled",
    ]);
  return publicUser(user);
}

export { getTwoFactorStatus, setupTwoFactor, verifyAndEnableTwoFactor, disableTwoFactor };
