import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { db } from "../config/db";
import { AppError } from "../middleware/error";

function totpFor(secret: string, email: string) {
  return new OTPAuth.TOTP({
    issuer: "Event Planner",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export async function getTwoFactorStatus(userId: string) {
  const user = await db("users").where({ id: userId }).first();
  if (!user) throw new AppError(404, "User not found.");
  const codes = (user.backup_codes as string[]) ?? [];
  return {
    twoFactorEnabled: Boolean(user.two_factor_enabled),
    backupCodesCount: codes.length,
  };
}

export async function setupTwoFactor(userId: string) {
  const user = await db("users").where({ id: userId }).first();
  if (!user) throw new AppError(404, "User not found.");
  if (user.two_factor_enabled) {
    throw new AppError(409, "Two-factor authentication is already enabled.");
  }

  const otpSecret = new OTPAuth.Secret({ size: 20 });
  const base32 = otpSecret.base32;

  await db("users").where({ id: userId }).update({
    two_factor_secret: base32,
    two_factor_enabled: false,
  });

  const totp = totpFor(base32, user.email);
  const qrDataUrl = await QRCode.toDataURL(totp.toString());
  return { qrDataUrl, secret: base32 };
}

export async function verifyAndEnableTwoFactor(userId: string, token: string) {
  const user = await db("users").where({ id: userId }).first();
  if (!user?.two_factor_secret) {
    throw new AppError(400, "Start 2FA setup first.");
  }
  if (user.two_factor_enabled) {
    throw new AppError(409, "Two-factor authentication is already enabled.");
  }

  const delta = totpFor(user.two_factor_secret, user.email).validate({
    token: token.replace(/\s/g, ""),
    window: 1,
  });
  if (delta === null) throw new AppError(400, "Invalid authenticator code.");

  const plainCodes = Array.from({ length: 10 }, () =>
    randomBytes(4).toString("hex").toUpperCase(),
  );
  const hashed = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, 10)));

  await db("users").where({ id: userId }).update({
    two_factor_enabled: true,
    backup_codes: JSON.stringify(hashed),
  });

  return { backupCodes: plainCodes };
}

export async function disableTwoFactor(userId: string, token: string) {
  const user = await db("users").where({ id: userId }).first();
  if (!user?.two_factor_enabled || !user.two_factor_secret) {
    throw new AppError(400, "Two-factor authentication is not enabled.");
  }
  await assertTotpOrBackup(user, token);
  await db("users").where({ id: userId }).update({
    two_factor_enabled: false,
    two_factor_secret: null,
    backup_codes: JSON.stringify([]),
  });
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  email_verified_at?: Date | string | null;
  two_factor_secret: string | null;
  two_factor_enabled: boolean;
  backup_codes: string[] | string;
};

function parseBackupCodes(raw: string[] | string): string[] {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/** Accepts a 6-digit TOTP or a single-use backup code. */
export async function assertTotpOrBackup(
  user: UserRow,
  tokenOrBackup: string,
  opts?: { preferBackup?: boolean },
) {
  const value = tokenOrBackup.trim().toUpperCase();
  const codes = parseBackupCodes(user.backup_codes);

  // Backup codes are 8 hex chars; TOTP is 6 digits
  const looksLikeBackup = /^[A-F0-9]{8}$/i.test(value) || opts?.preferBackup;

  if (looksLikeBackup || value.length > 6) {
    for (let i = 0; i < codes.length; i++) {
      if (await bcrypt.compare(value, codes[i])) {
        const next = [...codes];
        next.splice(i, 1);
        await db("users")
          .where({ id: user.id })
          .update({ backup_codes: JSON.stringify(next) });
        return;
      }
    }
    throw new AppError(400, "Invalid backup code.");
  }

  if (!user.two_factor_secret) {
    throw new AppError(400, "Two-factor authentication is not set up.");
  }
  const delta = totpFor(user.two_factor_secret, user.email).validate({
    token: value,
    window: 1,
  });
  if (delta === null) throw new AppError(400, "Invalid authenticator code.");
}

export async function loadUserFor2fa(userId: string) {
  const user = await db("users").where({ id: userId }).first();
  if (!user) throw new AppError(404, "User not found.");
  return user as UserRow;
}
