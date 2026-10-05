import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export function signAccessToken(userId: string, sessionId: string) {
  return jwt.sign({ typ: "access" }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: userId,
    jwtid: sessionId,
    expiresIn: env.ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(userId: string, sessionId: string) {
  return jwt.sign({ typ: "refresh" }, env.JWT_REFRESH_SECRET, {
    algorithm: "HS256",
    subject: userId,
    jwtid: sessionId,
    expiresIn: env.REFRESH_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });
  if (typeof decoded === "string" || !decoded.sub || !decoded.jti) {
    throw new Error("Invalid access token");
  }
  if (decoded.typ && decoded.typ !== "access") {
    throw new Error("Not an access token");
  }
  return decoded as jwt.JwtPayload;
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ["HS256"],
  });
  if (typeof decoded === "string" || !decoded.sub || !decoded.jti) {
    throw new Error("Invalid refresh token");
  }
  if (decoded.typ !== "refresh") {
    throw new Error("Not a refresh token");
  }
  return decoded as jwt.JwtPayload;
}

export function issueTokenPair(userId: string, sessionId: string): TokenPair {
  return {
    accessToken: signAccessToken(userId, sessionId),
    refreshToken: signRefreshToken(userId, sessionId),
    expiresIn: env.ACCESS_TTL,
    refreshExpiresIn: env.REFRESH_TTL,
  };
}
