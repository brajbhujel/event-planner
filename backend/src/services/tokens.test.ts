import { describe, expect, it } from "vitest";
import { generateOtpCode } from "./otp";
import {
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./tokens";

describe("generateOtpCode", () => {
  it("returns a 6-digit string", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
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
