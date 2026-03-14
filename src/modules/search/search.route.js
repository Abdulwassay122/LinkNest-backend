import { Router } from "express";
import {
    searchBookmarks,
    searchCollections,
    getRecentBookmarks,
    getPopularTags,
} from "./search.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// =====================
// Search & Extras Routes
// =====================
router.route("/bookmarks/search").get(verifyJWT, searchBookmarks);
router.route("/collections/search").get(verifyJWT, searchCollections);
router.route("/bookmarks/recent").get(verifyJWT, getRecentBookmarks);
router.route("/tags/popular").get(verifyJWT, getPopularTags);

export default router;