import { Router } from "express";
import {
    getCollections,
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection,
} from "./collection.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// =====================
// Collection Routes
// =====================
router.route("/collections").get(verifyJWT, getCollections).post(verifyJWT, createCollection);

router
    .route("/collections/:collectionId")
    .get(verifyJWT, getCollection)
    .patch(verifyJWT, updateCollection)
    .delete(verifyJWT, deleteCollection);

export default router;