import { describe, expect, it } from "vitest";
import { generateOTPCode, generateReferenceCode } from "../utils/code";
import {
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./tokens";

describe("generateOTPCode", () => {
  it("returns a 6-digit number", () => {
    const code = generateOTPCode();
    expect(code).toBeGreaterThanOrEqual(100000);
    expect(code).toBeLessThanOrEqual(999999);
  });
});

describe("generateReferenceCode", () => {
  it("returns uppercase alphanumeric of requested length", () => {
    const code = generateReferenceCode(8);
    expect(code).toMatch(/^[0-9A-Z]{8}$/);
  });
});

describe("token pair", () => {
  it("issues access and refresh with different typ claims", () => {
    const pair = issueTokenPair("user-1", "session-1");
    const access = verifyAccessToken(pair.accessToken);
    const refresh = verifyRefreshToken(pair.refreshToken);
    expect(access.sub).toBe("user-1");
    expect(access.jti).toBe("session-1");
    expect(refresh.sub).toBe("user-1");
    expect(refresh.jti).toBe("session-1");
    expect(refresh.typ).toBe("refresh");
  });

  it("rejects refresh token as access", () => {
    const pair = issueTokenPair("user-1", "session-1");
    expect(() => verifyAccessToken(pair.refreshToken)).toThrow();
  });
});
