/** "HH:mm" → total milliseconds from midnight. */
export function calculateTotalMilliSeconds(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 * 60 * 1000 + m * 60 * 1000;
}

/** "HH:mm" → total minutes. */
export function calculateTotalMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Timestamp that is `pauseTime` (HH:mm duration) from now. */
export function calculatePauseTimestamp(pauseTime: string): Date {
  return new Date(Date.now() + calculateTotalMilliSeconds(pauseTime));
}

/** Date that is `minutes` from now (used for OTP expiry). */
export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
