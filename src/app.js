import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.config.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// CORS Configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Passport Initialization
app.use(passport.initialize());

// =====================
// Routes Registration
// =====================
import authRouter from "./modules/auth/auth.route.js";
import userRouter from "./modules/user/user.route.js";
// import bookmarkRouter from "./modules/bookmark/bookmark.route.js";
// import collectionRouter from "./modules/collection/collection.route.js";
// import tagRouter from "./modules/tag/tag.route.js";
// import searchRouter from "./modules/search/search.route.js";

app.use("/api/v1", authRouter);
app.use("/api/v1", userRouter);
// app.use("/api/v1", bookmarkRouter);
// app.use("/api/v1", collectionRouter);
// app.use("/api/v1", tagRouter);
// app.use("/api/v1", searchRouter);

// =====================
// Global Error Handler
// =====================
export const globalErrorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            success: false,
            message: err.message,
            errors: err.errors || [],
        });
    }

    console.error(err);

    res.status(500).json({
        statusCode: 500,
        success: false,
        message: err.message || "Internal Server Error",
        errors: [],
    });
};

app.use(globalErrorHandler);

export { app };
