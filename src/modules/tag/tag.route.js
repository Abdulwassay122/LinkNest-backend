import { Router } from "express";
import {
    getTags,
    getTag,
    createTag,
    updateTag,
    deleteTag,
} from "./tag.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// =====================
// Tag Routes
// =====================
router.route("/tags").get(verifyJWT, getTags).post(verifyJWT, createTag);

router
    .route("/tags/:tagId")
    .get(verifyJWT, getTag)
    .patch(verifyJWT, updateTag)
    .delete(verifyJWT, deleteTag);

export default router;