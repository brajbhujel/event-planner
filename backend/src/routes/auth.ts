import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  loginSchema,
  signupSchema,
  profileSchema,
  type User,
} from "../validations";
import { z } from "zod";
import { db } from "../config/db";
import { env } from "../config/env";
import { authGuard } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { issueTokenPair, verifyRefreshToken } from "../services/tokens";
import { issueSignupOtp, verifySignupOtp } from "../services/otp";
import {
  assertTotpOrBackup,
  disableTwoFactor,
  getTwoFactorStatus,
  loadUserFor2fa,
  setupTwoFactor,
  verifyAndEnableTwoFactor,
} from "../services/two-factor";

export const authRoutes = Router();

function publicUser(row: {
  id: string;
  name: string;
  email: string;
  email_verified_at?: Date | string | null;
  two_factor_enabled?: boolean;
}): User & { emailVerified: boolean; twoFactorEnabled: boolean } {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: Boolean(row.email_verified_at),
    twoFactorEnabled: Boolean(row.two_factor_enabled),
  };
}

async function createSession(user: {
  id: string;
  name: string;
  email: string;
  email_verified_at?: Date | string | null;
  two_factor_enabled?: boolean;
}) {
  const id = randomUUID();
  await db("sessions").where("expires_at", "<", db.fn.now()).delete();
  await db("sessions").insert({
    id,
    user_id: user.id,
    expires_at: new Date(Date.now() + env.REFRESH_TTL * 1000),
  });
  const tokens = issueTokenPair(user.id, id);
  return {
    user: publicUser(user),
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    refreshExpiresIn: tokens.refreshExpiresIn,
  };
}

authRoutes.post("/signup", async (req, res) => {
  const input = signupSchema.parse(req.body);
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
  res.status(201).json({
    data: {
      needsVerification: true,
      email: user.email,
      ...(testOtp ? { testOtp } : {}),
    },
  });
});

authRoutes.post("/verify-email", async (req, res) => {
  const input = z
    .object({
      email: z.string().trim().toLowerCase().pipe(z.email()),
      code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
    })
    .parse(req.body);

  const user = await db("users").where({ email: input.email }).first();
  if (!user) throw new AppError(404, "No account found for that email.");
  if (user.email_verified_at) {
    res.json({ data: { verified: true, alreadyVerified: true } });
    return;
  }

  await verifySignupOtp(user.id, input.code);
  await db("users")
    .where({ id: user.id })
    .update({ email_verified_at: db.fn.now() });

  res.json({ data: { verified: true } });
});

authRoutes.post("/resend-otp", async (req, res) => {
  const input = z
    .object({ email: z.string().trim().toLowerCase().pipe(z.email()) })
    .parse(req.body);
  const user = await db("users").where({ email: input.email }).first();
  if (!user) throw new AppError(404, "No account found for that email.");
  if (user.email_verified_at) {
    throw new AppError(400, "Email is already verified. You can sign in.");
  }
  const testOtp = await issueSignupOtp(user.id, user.email);
  res.json({
    data: {
      sent: true,
      ...(testOtp ? { testOtp } : {}),
    },
  });
});

authRoutes.post("/login", async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await db("users").where({ email: input.email }).first();
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new AppError(401, "Email or password is incorrect.");
  }
  if (!user.email_verified_at) {
    res.status(200).json({
      data: {
        needsVerification: true,
        email: user.email,
      },
    });
    return;
  }
  if (user.two_factor_enabled) {
    // Challenge — not an error. Client must call /auth/2fa/session next.
    res.status(200).json({
      data: {
        requires2FA: true,
        userId: user.id,
      },
    });
    return;
  }
  res.json({ data: await createSession(user) });
});

authRoutes.post("/2fa/session", async (req, res) => {
  const input = z
    .object({
      userId: z.uuid(),
      code: z.string().trim().min(6).max(16),
      backup: z.boolean().optional(),
    })
    .parse(req.body);

  const user = await loadUserFor2fa(input.userId);
  if (!user.two_factor_enabled) {
    throw new AppError(400, "Two-factor authentication is not enabled.");
  }
  await assertTotpOrBackup(user, input.code, { preferBackup: input.backup });
  res.json({ data: await createSession(user) });
});

authRoutes.post("/refresh", async (req, res) => {
  const refreshToken =
    (typeof req.body?.refreshToken === "string" && req.body.refreshToken) ||
    req.headers["x-refresh-token"];
  if (!refreshToken || typeof refreshToken !== "string") {
    throw new AppError(401, "Refresh token required.");
  }

  let payload: { sub?: string; jti?: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }

  const session = await db("sessions as s")
    .join("users as u", "u.id", "s.user_id")
    .where({ "s.id": payload.jti, "u.id": payload.sub })
    .where("s.expires_at", ">", db.fn.now())
    .select(
      "s.id as sessionId",
      "u.id",
      "u.name",
      "u.email",
      "u.email_verified_at",
      "u.two_factor_enabled",
    )
    .first();

  if (!session) {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }

  // Rotate session id so stolen refresh tokens can't be reused after refresh.
  const newSessionId = randomUUID();
  await db("sessions").where({ id: session.sessionId }).delete();
  await db("sessions").insert({
    id: newSessionId,
    user_id: session.id,
    expires_at: new Date(Date.now() + env.REFRESH_TTL * 1000),
  });

  const tokens = issueTokenPair(session.id, newSessionId);
  res.json({
    data: {
      user: publicUser(session),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
    },
  });
});

authRoutes.get("/me", authGuard, async (req, res) => {
  const row = await db("users").where({ id: req.user.id }).first();
  res.json({ data: publicUser(row ?? req.user) });
});

authRoutes.patch("/me", authGuard, async (req, res) => {
  const input = profileSchema.parse(req.body);
  const [user] = await db("users")
    .where({ id: req.user.id })
    .update({ name: input.name })
    .returning([
      "id",
      "name",
      "email",
      "email_verified_at",
      "two_factor_enabled",
    ]);
  res.json({ data: publicUser(user) });
});

authRoutes.post("/logout", authGuard, async (req, res) => {
  await db("sessions").where({ id: req.sessionId }).delete();
  res.status(204).end();
});

// —— 2FA management (authenticated) ——
authRoutes.get("/2fa/status", authGuard, async (req, res) => {
  res.json({ data: await getTwoFactorStatus(req.user.id) });
});

authRoutes.post("/2fa/setup", authGuard, async (req, res) => {
  res.json({ data: await setupTwoFactor(req.user.id) });
});

authRoutes.post("/2fa/verify", authGuard, async (req, res) => {
  const { token } = z
    .object({ token: z.string().trim().regex(/^\d{6}$/) })
    .parse(req.body);
  res.json({ data: await verifyAndEnableTwoFactor(req.user.id, token) });
});

authRoutes.post("/2fa/disable", authGuard, async (req, res) => {
  const { token } = z
    .object({ token: z.string().trim().min(6).max(16) })
    .parse(req.body);
  await disableTwoFactor(req.user.id, token);
  res.json({ data: { disabled: true } });
});
