import { describe, expect, it } from "vitest";
import {
  calculateTotalMilliSeconds,
  calculateTotalMinutes,
  minutesFromNow,
} from "./time";

describe("time utils", () => {
  it("converts HH:mm to milliseconds", () => {
    expect(calculateTotalMilliSeconds("01:00")).toBe(3_600_000);
    expect(calculateTotalMilliSeconds("00:30")).toBe(1_800_000);
  });

  it("converts HH:mm to minutes", () => {
    expect(calculateTotalMinutes("01:30")).toBe(90);
  });

  it("minutesFromNow is in the future", () => {
    const before = Date.now();
    const at = minutesFromNow(10).getTime();
    expect(at).toBeGreaterThanOrEqual(before + 10 * 60 * 1000 - 50);
  });
});
