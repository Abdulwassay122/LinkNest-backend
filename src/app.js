import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import passport from "./config/passport.config.js";
import { ApiError } from "./utils/ApiError.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Security Headers
app.use(helmet({
    contentSecurityPolicy: false, // Configure based on your needs
    crossOriginEmbedderPolicy: false,
}));

// CORS Configuration - Allow frontend to send credentials
app.use(
    cors({
        origin: [process.env.CORS_ORIGIN, process.env.FRONTEND_URL, "http://localhost:3000"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Apply general rate limiting to all API routes
app.use("/api/v1", generalLimiter);

// Passport Initialization
app.use(passport.initialize());

// =====================
// Routes Registration
// =====================
import authRouter from "./modules/auth/auth.route.js";
import userRouter from "./modules/user/user.route.js";
import bookmarkRouter from "./modules/bookmark/bookmark.route.js";
import collectionRouter from "./modules/collection/collection.route.js";
import tagRouter from "./modules/tag/tag.route.js";
import searchRouter from "./modules/search/search.route.js";

app.use("/api/v1", authRouter);
app.use("/api/v1", userRouter);
app.use("/api/v1", bookmarkRouter);
app.use("/api/v1", collectionRouter);
app.use("/api/v1", tagRouter);
app.use("/api/v1", searchRouter);

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
