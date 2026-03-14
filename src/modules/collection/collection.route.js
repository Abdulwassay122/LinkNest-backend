import { Router } from "express";
import {
    getAllCollections,
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addBookmarkToCollection,
    removeBookmarkFromCollection,
} from "./collection.controller.js";
import { verifyAccessToken } from "../../middleware/auth.middleware.js";

const router = Router();

// =====================
// Collection Routes
// =====================

// Get all collections or create a new collection
router.route("/collections")
    .get(verifyAccessToken, getAllCollections)
    .post(verifyAccessToken, createCollection);

// Get, update, or delete a specific collection
router.route("/collections/:collectionId")
    .get(verifyAccessToken, getCollection)
    .patch(verifyAccessToken, updateCollection)
    .delete(verifyAccessToken, deleteCollection);

// Add bookmark to collection
router.route("/collections/:collectionId/bookmarks/:bookmarkId")
    .post(verifyAccessToken, addBookmarkToCollection);

// Remove bookmark from collection
router.route("/collections/:collectionId/bookmarks/:bookmarkId")
    .delete(verifyAccessToken, removeBookmarkFromCollection);

export default router;