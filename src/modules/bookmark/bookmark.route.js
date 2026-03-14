import { Router } from "express";
import {
    getAllBookmarks,
    getBookmark,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    getFavoriteBookmarks,
    addTags,
    removeTag,
} from "./bookmark.controller.js";
import { verifyAccessToken } from "../../middleware/auth.middleware.js";

const router = Router();

// =====================
// Bookmark Routes
// =====================

// Get all bookmarks or create a new bookmark
router.route("/bookmarks")
    .get(verifyAccessToken, getAllBookmarks)
    .post(verifyAccessToken, createBookmark);

// Get, update, or delete a specific bookmark
router.route("/bookmarks/:bookmarkId")
    .get(verifyAccessToken, getBookmark)
    .patch(verifyAccessToken, updateBookmark)
    .delete(verifyAccessToken, deleteBookmark);

// Toggle favorite status
router.route("/bookmarks/:bookmarkId/favorite")
    .patch(verifyAccessToken, toggleFavorite);

// Get favorite bookmarks
router.route("/bookmarks/favorites")
    .get(verifyAccessToken, getFavoriteBookmarks);

// Add tags to a bookmark
router.route("/bookmarks/:bookmarkId/tags")
    .post(verifyAccessToken, addTags);

// Remove a tag from a bookmark
router.route("/bookmarks/:bookmarkId/tags/:tagId")
    .delete(verifyAccessToken, removeTag);

export default router;
