import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const port = Number(process.env.PORT);
const corsOrigin = process.env.CORS_ALLOWED_ORIGINS;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}
if (
  !process.env.JWT_REFRESH_SECRET ||
  process.env.JWT_REFRESH_SECRET.length < 32
) {
  throw new Error("JWT_REFRESH_SECRET must be at least 32 characters");
}
if (!corsOrigin) {
  throw new Error("CORS_ALLOWED_ORIGINS is required");
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TTL: Number(process.env.JWT_ACCESS_TTL ?? 15 * 60),
  REFRESH_TTL: Number(process.env.JWT_REFRESH_TTL ?? 7 * 24 * 60 * 60),
  OTP_TTL_MIN: Number(process.env.OTP_TTL_MIN ?? 10),
  PORT: port,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  CORS_ALLOWED_ORIGINS: corsOrigin,
};
