import { Router } from "express";
import {
    createUser,
    getUser,
    updateUser,
    deleteUser,
} from "./user.controller.js";
import { verifyAccessToken, optionalAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// =====================
// User Routes
// =====================
router.post("/users", optionalAuth, createUser); // Create user (optional auth for admin creation)
router.get("/users/:userId", verifyAccessToken, getUser); // Get user by ID
router.patch("/users/:userId", verifyAccessToken, updateUser); // Update user
router.delete("/users/:userId", verifyAccessToken, deleteUser); // Delete user

export default router;