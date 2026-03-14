import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../db/index.js";

// Verify Access Token Middleware
export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
        throw new ApiError(401, "Unauthorized - No access token provided");
    }

    try {
        const decodedToken = jwt.verify(
            accessToken,
            process.env.JWT_ACCESS_SECRET
        );

        // Fetch user from database to ensure user still exists
        const user = await prisma.user.findUnique({
            where: { id: decodedToken.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                provider: true,
                profileImage: true,
            },
        });

        if (!user) {
            throw new ApiError(401, "Unauthorized - User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            throw new ApiError(401, "Unauthorized - Invalid or expired access token");
        }
        throw error;
    }
});

// Verify Refresh Token Middleware
export const verifyRefreshToken = asyncHandler(async (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        throw new ApiError(401, "Unauthorized - No refresh token provided");
    }

    try {
        const decodedToken = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // Fetch user from database to verify refresh token matches
        const user = await prisma.user.findUnique({
            where: { id: decodedToken.id },
        });

        if (!user) {
            throw new ApiError(401, "Unauthorized - User not found");
        }

        if (user.refreshToken !== refreshToken) {
            throw new ApiError(401, "Unauthorized - Invalid refresh token");
        }

        req.user = user;
        req.refreshToken = refreshToken;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            throw new ApiError(401, "Unauthorized - Invalid or expired refresh token");
        }
        throw error;
    }
});

// Optional Auth - attaches user if token exists, but doesn't require it
export const optionalAuth = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies?.accessToken;

    if (accessToken) {
        try {
            const decodedToken = jwt.verify(
                accessToken,
                process.env.JWT_ACCESS_SECRET
            );

            const user = await prisma.user.findUnique({
                where: { id: decodedToken.id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    provider: true,
                    profileImage: true,
                },
            });

            if (user) {
                req.user = user;
            }
        } catch (error) {
            // Token invalid, but that's okay for optional auth
        }
    }

    next();
});
