import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import passport from "passport";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";

// Token Generation Function
export const createTokens = async (user) => {
    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
        }
    );

    const refreshToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
        }
    );

    // Store refresh token in database
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    return { accessToken, refreshToken };
};

// Cookie Options
const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Set token cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
    const cookieOptions = getCookieOptions();

    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);
};

// Clear token cookies
const clearTokenCookies = (res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
};

// =====================
// Signup Controller
// =====================
export const signup = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || null,
            provider: "local",
        },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await createTokens(user);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Return user data (excluding sensitive info)
    const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
        profileImage: user.profileImage,
    };

    return res
        .status(201)
        .json(new ApiResponse(201, userResponse, "User registered successfully"));
});

// =====================
// Login Controller
// =====================
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Check if user has a password (might be OAuth user)
    if (!user.password) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await createTokens(user);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Return user data
    const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
        profileImage: user.profileImage,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, userResponse, "User logged in successfully"));
});

// =====================
// Logout Controller
// =====================
export const logout = asyncHandler(async (req, res) => {
    // Clear refresh token from database
    await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null },
    });

    // Clear cookies
    clearTokenCookies(res);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

// =====================
// Get Current User Controller
// =====================
export const getMe = asyncHandler(async (req, res) => {
    const userResponse = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        provider: req.user.provider,
        profileImage: req.user.profileImage,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, userResponse, "User fetched successfully"));
});

// =====================
// Refresh Token Controller
// =====================
export const refreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized - No refresh token provided");
    }

    // Verify refresh token
    let decodedToken;
    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Unauthorized - Invalid refresh token");
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { id: decodedToken.id },
    });

    if (!user) {
        throw new ApiError(401, "Unauthorized - User not found");
    }

    // Check if refresh token matches
    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized - Refresh token mismatch");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await createTokens(user);

    // Set new cookies
    setTokenCookies(res, accessToken, newRefreshToken);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Token refreshed successfully"));
});

// =====================
// Google OAuth Controller
// =====================
export const googleOAuth = asyncHandler(async (req, res, next) => {
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })(req, res, next);
});

// =====================
// Google OAuth Callback Controller
// =====================
export const googleOAuthCallback = asyncHandler(async (req, res, next) => {
    passport.authenticate("google", { session: false }, async (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            throw new ApiError(401, "Google authentication failed");
        }

        // Generate tokens
        const { accessToken, refreshToken } = await createTokens(user);

        // Set cookies
        setTokenCookies(res, accessToken, refreshToken);

        // Return user data
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            provider: user.provider,
            profileImage: user.profileImage,
        };

        return res
            .status(200)
            .json(new ApiResponse(200, userResponse, "Google login successful"));
    })(req, res, next);
});
