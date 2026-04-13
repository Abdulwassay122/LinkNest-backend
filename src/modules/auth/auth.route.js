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
import { 
    loginLimiter, 
    signupLimiter, 
    otpLimiter, 
    otpResendLimiter,
    passwordResetLimiter,
    writeLimiter 
} from "../../middleware/rateLimiter.js";

const router = Router();

// =====================
// Auth Routes
// =====================
router.post("/auth/signup", signupLimiter, signup);
router.post("/auth/login", loginLimiter, login);
router.post("/auth/logout", verifyAccessToken, writeLimiter, logout);
router.get("/auth/me", verifyAccessToken, getMe);
router.post("/auth/refresh", verifyRefreshToken, refreshToken);

// OTP Routes
router.post("/auth/verify-otp", otpLimiter, verifyOTP);
router.post("/auth/resend-otp", otpResendLimiter, resendOTP);

// Password Management
router.post("/auth/change-password", verifyAccessToken, writeLimiter, changePassword);
router.post("/auth/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/auth/reset-password", passwordResetLimiter, resetPassword);

// Google OAuth Routes
router.get("/auth/oauth/google", googleOAuth);
router.get("/auth/oauth/google/callback", googleOAuthCallback);

export default router;
