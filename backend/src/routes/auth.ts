import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authGuard } from "../middleware/auth";

export const authRoutes = Router();

authRoutes.post("/signup", AuthController.signup);
authRoutes.post("/verify-email", AuthController.verifyEmail);
authRoutes.post("/resend-otp", AuthController.resendOtp);
authRoutes.post("/login", AuthController.login);
authRoutes.post("/2fa/session", AuthController.completeTwoFactor);
authRoutes.post("/refresh", AuthController.refresh);
authRoutes.post("/logout", AuthController.logout);

authRoutes.get("/me", authGuard, AuthController.me);
authRoutes.patch("/me", authGuard, AuthController.updateProfile);

authRoutes.get("/2fa/status", authGuard, AuthController.twoFactorStatus);
authRoutes.post("/2fa/setup", authGuard, AuthController.setupTwoFactor);
authRoutes.post("/2fa/verify", authGuard, AuthController.verifyTwoFactor);
authRoutes.post("/2fa/disable", authGuard, AuthController.disableTwoFactor);
