import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../config/db";
import { env } from "../config/env";
import { AppError } from "../middleware/error";
import { generateOTPCode } from "../utils/code";
import { minutesFromNow } from "../utils/time";
import { logger } from "../providers/logger";

export async function sendOtpEmail(to: string, code: string) {
  logger.info("Signup OTP issued", {
    to,
    code,
    expiresInMin: env.OTP_TTL_MIN,
  });
}

export async function issueSignupOtp(userId: string, email: string) {
  await db("email_otps")
    .where({ user_id: userId, purpose: "signup" })
    .whereNull("used_at")
    .update({ used_at: db.fn.now() });

  const code = String(generateOTPCode());
  await db("email_otps").insert({
    id: randomUUID(),
    user_id: userId,
    purpose: "signup",
    code_hash: await bcrypt.hash(code, 10),
    expires_at: minutesFromNow(env.OTP_TTL_MIN),
  });
  await sendOtpEmail(email, code);
  return env.NODE_ENV === "production" ? undefined : code;
}

export async function verifySignupOtp(userId: string, code: string) {
  const row = await db("email_otps")
    .where({ user_id: userId, purpose: "signup" })
    .whereNull("used_at")
    .orderBy("created_at", "desc")
    .first();

  if (!row) {
    throw new AppError(400, "No verification code found. Request a new one.");
  }
  if (new Date(row.expires_at) < new Date()) {
    throw new AppError(400, "That code expired. Request a new one.");
  }
  const ok = await bcrypt.compare(code, row.code_hash);
  if (!ok) throw new AppError(400, "Invalid verification code.");

  await db("email_otps").where({ id: row.id }).update({ used_at: db.fn.now() });
}
