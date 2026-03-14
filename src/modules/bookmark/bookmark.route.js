import { Router } from "express";
import {
    getBookmarks,
    getBookmark,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    addTags,
    removeTag,
} from "./bookmark.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// =====================
// Bookmark Routes
// =====================
router.route("/bookmarks").get(verifyJWT, getBookmarks).post(verifyJWT, createBookmark);

router
    .route("/bookmarks/:bookmarkId")
    .get(verifyJWT, getBookmark)
    .patch(verifyJWT, updateBookmark)
    .delete(verifyJWT, deleteBookmark);

router.route("/bookmarks/:bookmarkId/favorite").patch(verifyJWT, toggleFavorite);
router.route("/bookmarks/:bookmarkId/tags").post(verifyJWT, addTags);
router.route("/bookmarks/:bookmarkId/tags/:tagId").delete(verifyJWT, removeTag);

export default router;