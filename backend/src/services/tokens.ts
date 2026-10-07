import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../config/env";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export type AccessClaims = {
  sub: string;
  name: string;
  email: string;
};

export function signAccessToken(user: AccessClaims) {
  return jwt.sign(
    { typ: "access", name: user.name, email: user.email },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      subject: user.sub,
      jwtid: randomUUID(),
      expiresIn: env.ACCESS_TTL as jwt.SignOptions["expiresIn"],
    },
  );
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ typ: "refresh" }, env.JWT_REFRESH_SECRET, {
    algorithm: "HS256",
    subject: userId,
    jwtid: randomUUID(),
    expiresIn: env.REFRESH_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });
  if (typeof decoded === "string" || !decoded.sub) {
    throw new Error("Invalid access token");
  }
  if (decoded.typ && decoded.typ !== "access") {
    throw new Error("Not an access token");
  }
  return decoded as jwt.JwtPayload & { name?: string; email?: string };
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ["HS256"],
  });
  if (typeof decoded === "string" || !decoded.sub) {
    throw new Error("Invalid refresh token");
  }
  if (decoded.typ !== "refresh") {
    throw new Error("Not a refresh token");
  }
  return decoded as jwt.JwtPayload;
}

export function issueTokenPair(user: AccessClaims): TokenPair {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.sub),
    expiresIn: env.ACCESS_TTL,
    refreshExpiresIn: env.REFRESH_TTL,
  };
}
