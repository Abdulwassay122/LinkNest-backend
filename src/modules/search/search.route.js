import { Router } from "express";
import {
    search,
    searchByName,
    searchByDescription,
    searchByLink,
    filterBookmarks,
    getByType,
    getRecentBookmarks,
    getStatistics,
} from "./search.controller.js";
import { verifyAccessToken } from "../../middleware/auth.middleware.js";
import { searchLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

// =====================
// Search Routes
// =====================

// General search - with rate limiting
router.route("/bookmarks/search")
    .get(verifyAccessToken, searchLimiter, search);

// Search by name
router.route("/search/by-name")
    .get(verifyAccessToken, searchLimiter, searchByName);

// Search by description
router.route("/search/by-description")
    .get(verifyAccessToken, searchLimiter, searchByDescription);

// Search by link
router.route("/search/by-link")
    .get(verifyAccessToken, searchLimiter, searchByLink);

// Filter bookmarks
router.route("/bookmarks/filter")
    .get(verifyAccessToken, searchLimiter, filterBookmarks);

// Get bookmarks by type
router.route("/bookmarks/type/:type")
    .get(verifyAccessToken, getByType);

// Get recent bookmarks
router.route("/bookmarks/recent")
    .get(verifyAccessToken, getRecentBookmarks);

// Get statistics
router.route("/bookmarks/statistics")
    .get(verifyAccessToken, getStatistics);

export default router;
