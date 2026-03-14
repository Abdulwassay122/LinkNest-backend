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

const router = Router();

// =====================
// Search Routes
// =====================

// General search
router.route("/bookmarks/search")
    .get(verifyAccessToken, search);

// Search by name
router.route("/search/by-name")
    .get(verifyAccessToken, searchByName);

// Search by description
router.route("/search/by-description")
    .get(verifyAccessToken, searchByDescription);

// Search by link
router.route("/search/by-link")
    .get(verifyAccessToken, searchByLink);

// Filter bookmarks
router.route("/bookmarks/filter")
    .get(verifyAccessToken, filterBookmarks);

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
