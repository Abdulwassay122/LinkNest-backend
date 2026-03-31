import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import passport from "passport";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../db/index.js";
import { sendOTPEmail, sendPasswordResetEmail } from "../../config/email.config.js";
import { generateOTP, hashToken, getOTPExpiryDate, getResetTokenExpiryDate } from "../../utils/otp.utils.js";

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
        if (existingUser.isEmailVerified) {
            throw new ApiError(409, "User with this email already exists");
        } else {
            // User exists but not verified - resend OTP
            const otp = generateOTP();
            const otpExpiresAt = getOTPExpiryDate();
            
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    otpCode: hashToken(otp),
                    otpExpiresAt,
                },
            });
            
            await sendOTPEmail(email, otp);
            
            return res.status(200).json(new ApiResponse(
                200,
                { email: existingUser.email, message: "OTP resent successfully" },
                "Please verify your email"
            ));
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = getOTPExpiryDate();

    // Create user (not verified yet)
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || null,
            provider: "local",
            otpCode: hashToken(otp),
            otpExpiresAt,
            isEmailVerified: false,
        },
    });

    // Send OTP email
    try {
        await sendOTPEmail(email, otp);
    } catch (error) {
        console.error("Failed to send OTP email:", error);
        // Don't fail signup, but log the error
    }

    // Return user data (excluding sensitive info)
    const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
    };

    return res
        .status(201)
        .json(new ApiResponse(201, userResponse, "User registered. Please verify your email."));
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

    // Check if email is verified - return flag instead of throwing error
    if (!user.isEmailVerified) {
        // Generate OTP for verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = hashToken(otp);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: hashedOTP,
                otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
        });

        // Send OTP email
        try {
            await sendOTPEmail(email, otp);
        } catch (error) {
            console.error("Failed to send OTP email:", error);
        }

        // Return user data with unverified flag
        return res
            .status(200)
            .json(new ApiResponse(200, {
                id: user.id,
                email: user.email,
                name: user.name,
                isEmailVerified: false,
                requiresVerification: true,
            }, "Email verification required. A new OTP has been sent to your email."));
    }

    // Generate tokens for verified users
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
        isEmailVerified: user.isEmailVerified,
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
    // Get redirect_uri from query parameters
    const redirectUri = req.query.redirect_uri || process.env.FRONTEND_URL || "http://localhost:3000/auth/callback";

    passport.authenticate("google", { session: false }, async (err, user, info) => {
        if (err) {
            // Redirect to frontend with error
            return res.redirect(`${redirectUri}?error=authentication_failed`);
        }

        if (!user) {
            // Redirect to frontend with error
            return res.redirect(`${redirectUri}?error=authentication_failed`);
        }

        try {
            // Generate tokens
            const { accessToken, refreshToken } = await createTokens(user);

            // Set cookies
            setTokenCookies(res, accessToken, refreshToken);

            // Redirect to frontend callback page with code
            // The code parameter is passed for compatibility, but cookies are already set
            return res.redirect(`${redirectUri}?code=oauth_success`);
        } catch (error) {
            console.error("Google OAuth callback error:", error);
            return res.redirect(`${redirectUri}?error=authentication_failed`);
        }
    })(req, res, next);
});

// =====================
// Verify OTP Controller
// =====================
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if already verified
    if (user.isEmailVerified) {
        throw new ApiError(400, "Email already verified");
    }

    // Check OTP expiration
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        throw new ApiError(400, "OTP expired. Please request a new one");
    }

    // Verify OTP
    const hashedOTP = hashToken(otp);
    if (user.otpCode !== hashedOTP) {
        throw new ApiError(400, "Invalid OTP");
    }

    // Update user
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            otpCode: null,
            otpExpiresAt: null,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { email: user.email }, "Email verified successfully"));
});

// =====================
// Resend OTP Controller
// =====================
export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if already verified
    if (user.isEmailVerified) {
        throw new ApiError(400, "Email already verified");
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiresAt = getOTPExpiryDate();

    // Update user with new OTP
    await prisma.user.update({
        where: { id: user.id },
        data: {
            otpCode: hashToken(otp),
            otpExpiresAt,
        },
    });

    // Send OTP email
    try {
        await sendOTPEmail(email, otp);
    } catch (error) {
        console.error("Failed to resend OTP email:", error);
        throw new ApiError(500, "Failed to send OTP email");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { email: user.email }, "OTP resent successfully"));
});

// =====================
// Change Password Controller
// =====================
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required");
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if user has a password (local auth)
    if (!user.password) {
        throw new ApiError(400, "Cannot change password for OAuth accounts");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Current password is incorrect");
    }

    // Validate new password
    if (newPassword.length < 8) {
        throw new ApiError(400, "New password must be at least 8 characters");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and invalidate refresh tokens
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            refreshToken: null, // Invalidate existing sessions
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password changed successfully"));
});

// =====================
// Forgot Password Controller
// =====================
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    // Also skip OAuth users (they don't have passwords)
    if (!user || !user.password) {
        console.log(`Password reset requested for non-existent or OAuth user: ${email}`);
        return res
            .status(200)
            .json(new ApiResponse(200, null, "If an account exists with this email, a password reset link has been sent."));
    }

    // Generate reset token
    const resetToken = generateOTP(); // Use 6-digit OTP as reset token
    const hashedResetToken = hashToken(resetToken);
    const resetTokenExpiresAt = getResetTokenExpiryDate(); // 1 hour

    // Save hashed token to database
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: hashedResetToken,
            resetTokenExpiresAt,
        },
    });

    // Send reset email
    try {
        await sendPasswordResetEmail(email, resetToken);
        console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
        console.error("Failed to send password reset email:", error);
        // Rollback the token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: null,
                resetTokenExpiresAt: null,
            },
        });
        throw new ApiError(500, "Failed to send password reset email");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "If an account exists with this email, a password reset link has been sent."));
});

// =====================
// Reset Password Controller
// =====================
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        throw new ApiError(400, "Reset token and new password are required");
    }

    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters");
    }

    // Hash the token to compare with stored hash
    const hashedToken = hashToken(token);

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
        where: {
            resetToken: hashedToken,
            resetTokenExpiresAt: {
                gt: new Date(),
            },
        },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiresAt: null,
            refreshToken: null, // Invalidate existing sessions
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password reset successfully. Please login with your new password."));
});
