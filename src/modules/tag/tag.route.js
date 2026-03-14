import { Router } from "express";
import {
    getAllTags,
    getTag,
    createTag,
    updateTag,
    deleteTag,
    getTagByName,
    addTagToBookmark,
    removeTagFromBookmark,
} from "./tag.controller.js";
import { verifyAccessToken } from "../../middleware/auth.middleware.js";

const router = Router();

// =====================
// Tag Routes
// =====================

// Get all tags or create a new tag
router.route("/tags")
    .get(verifyAccessToken, getAllTags)
    .post(verifyAccessToken, createTag);

// Get, update, or delete a specific tag
router.route("/tags/:tagId")
    .get(verifyAccessToken, getTag)
    .patch(verifyAccessToken, updateTag)
    .delete(verifyAccessToken, deleteTag);

// Get tag by name
router.route("/tags/name/:tagName")
    .get(verifyAccessToken, getTagByName);

// Add tag to bookmark
router.route("/bookmarks/:bookmarkId/tags/:tagId")
    .post(verifyAccessToken, addTagToBookmark);

// Remove tag from bookmark
router.route("/bookmarks/:bookmarkId/tags/:tagId")
    .delete(verifyAccessToken, removeTagFromBookmark);

export default router;