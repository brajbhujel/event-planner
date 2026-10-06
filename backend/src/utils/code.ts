export function generateOTPCode(): number {
  return Math.floor(Math.random() * 900000 + 100000);
}

export function generateReferenceCode(length = 6): string {
  const chars = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
