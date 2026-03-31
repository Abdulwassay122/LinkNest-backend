import { Router } from "express";
import {
    signup,
    login,
    logout,
    getMe,
    googleOAuth,
    googleOAuthCallback,
    refreshToken,
    verifyOTP,
    resendOTP,
    changePassword,
    forgotPassword,
    resetPassword,
} from "./auth.controller.js";
import { verifyAccessToken, verifyRefreshToken } from "../../middleware/auth.middleware.js";

const router = Router();

// =====================
// Auth Routes
// =====================
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/logout", verifyAccessToken, logout);
router.get("/auth/me", verifyAccessToken, getMe);
router.post("/auth/refresh", verifyRefreshToken, refreshToken);

// OTP Routes
router.post("/auth/verify-otp", verifyOTP);
router.post("/auth/resend-otp", resendOTP);

// Password Management
router.post("/auth/change-password", verifyAccessToken, changePassword);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);

// Google OAuth Routes
router.get("/auth/oauth/google", googleOAuth);
router.get("/auth/oauth/google/callback", googleOAuthCallback);

export default router;
