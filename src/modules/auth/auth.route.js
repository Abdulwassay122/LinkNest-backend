import { Router } from "express";
import {
    signup,
    login,
    logout,
    getMe,
    googleOAuth,
    googleOAuthCallback,
    refreshToken,
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

// Google OAuth Routes
router.get("/auth/oauth/google", googleOAuth);
router.get("/auth/oauth/google/callback", googleOAuthCallback);

export default router;
