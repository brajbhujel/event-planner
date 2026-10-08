import type { Request, Response } from "express";
import { z } from "zod";
import {
  loginSchema,
  signupSchema,
  profileSchema,
} from "../validations";
import { AppError } from "../middleware/error";
import * as authService from "../services/auth";
import {
  REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from "../utils/cookies";

export class AuthController {
  static async signup(req: Request, res: Response) {
    const input = signupSchema.parse(req.body);
    const data = await authService.signup(input);
    res.status(201).json({ data });
  }

  static async verifyEmail(req: Request, res: Response) {
    const input = z
      .object({
        email: z.string().trim().toLowerCase().pipe(z.email()),
        code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
      })
      .parse(req.body);
    res.json({ data: await authService.verifyEmail(input) });
  }

  static async resendOtp(req: Request, res: Response) {
    const { email } = z
      .object({ email: z.string().trim().toLowerCase().pipe(z.email()) })
      .parse(req.body);
    res.json({ data: await authService.resendOtp(email) });
  }

  static async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);

    if (result.kind === "needsVerification") {
      res.json({
        data: { needsVerification: true, email: result.email },
      });
      return;
    }
    if (result.kind === "requires2FA") {
      res.json({
        data: { requires2FA: true, userId: result.userId },
      });
      return;
    }

    setSessionCookies(res, result.session.tokens);
    res.json({ data: { user: result.session.user } });
  }

  static async completeTwoFactor(req: Request, res: Response) {
    const input = z
      .object({
        userId: z.uuid(),
        code: z.string().trim().min(6).max(16),
        backup: z.boolean().optional(),
      })
      .parse(req.body);
    const session = await authService.completeTwoFactor(input);
    setSessionCookies(res, session.tokens);
    res.json({ data: { user: session.user } });
  }

  static async refresh(req: Request, res: Response) {
    const refreshToken =
      (typeof req.body?.refreshToken === "string" && req.body.refreshToken) ||
      req.cookies?.[REFRESH_COOKIE] ||
      req.headers["x-refresh-token"];
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new AppError(401, "Refresh token required.");
    }
    const session = await authService.refresh(refreshToken);
    setSessionCookies(res, session.tokens);
    res.json({ data: { user: session.user } });
  }

  static async me(req: Request, res: Response) {
    res.json({ data: await authService.me(req.user.id) });
  }

  static async updateProfile(req: Request, res: Response) {
    const input = profileSchema.parse(req.body);
    res.json({
      data: await authService.updateProfile(req.user.id, input),
    });
  }

  static async logout(_req: Request, res: Response) {
    clearSessionCookies(res);
    res.status(204).end();
  }

  static async twoFactorStatus(req: Request, res: Response) {
    res.json({ data: await authService.getTwoFactorStatus(req.user.id) });
  }

  static async setupTwoFactor(req: Request, res: Response) {
    res.json({ data: await authService.setupTwoFactor(req.user.id) });
  }

  static async verifyTwoFactor(req: Request, res: Response) {
    const { token } = z
      .object({ token: z.string().trim().regex(/^\d{6}$/) })
      .parse(req.body);
    res.json({
      data: await authService.verifyAndEnableTwoFactor(req.user.id, token),
    });
  }

  static async disableTwoFactor(req: Request, res: Response) {
    const { token } = z
      .object({ token: z.string().trim().min(6).max(16) })
      .parse(req.body);
    await authService.disableTwoFactor(req.user.id, token);
    res.json({ data: { disabled: true } });
  }
}
