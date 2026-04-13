import rateLimit from 'express-rate-limit';
import { VALIDATION_CONSTANTS } from '../utils/validation.js';

/**
 * Rate Limiting Configuration
 * 
 * Why this is needed:
 * 1. Brute Force Prevention: Limits login attempts to prevent password guessing
 * 2. OTP Enumeration Prevention: Limits OTP verification attempts
 * 3. API Abuse Prevention: Prevents DoS attacks via excessive requests
 * 4. Email Bombing Prevention: Limits password reset and OTP requests
 * 5. Search Endpoint Protection: Prevents expensive query abuse
 */

// =====================
// General API Rate Limiter
// Applied to all API routes by default
// =====================
export const generalLimiter = rateLimit({
    windowMs: VALIDATION_CONSTANTS.RATE_LIMIT_WINDOW_MS, // 15 minutes
    max: VALIDATION_CONSTANTS.GENERAL_MAX_REQUESTS, // 100 requests per 15 minutes
    message: {
        statusCode: 429,
        message: 'Too many requests, please try again later',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// =====================
// Authentication Rate Limiters
// =====================

// Login endpoint - strict limiting
export const loginLimiter = rateLimit({
    windowMs: VALIDATION_CONSTANTS.RATE_LIMIT_WINDOW_MS, // 15 minutes
    max: VALIDATION_CONSTANTS.LOGIN_MAX_ATTEMPTS, // 5 attempts per 15 minutes
    message: {
        statusCode: 429,
        message: 'Too many login attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests (only count failures)
    skipSuccessfulRequests: false,
});

// OTP verification - very strict limiting
export const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: VALIDATION_CONSTANTS.OTP_MAX_ATTEMPTS, // 3 attempts per hour
    message: {
        statusCode: 429,
        message: 'Too many OTP verification attempts. Please try again after 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// OTP resend - moderate limiting
export const otpResendLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1, // 1 request per minute
    message: {
        statusCode: 429,
        message: 'Please wait 1 minute before requesting another OTP',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Password reset request - strict limiting
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: {
        statusCode: 429,
        message: 'Too many password reset requests. Please try again after 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Signup - moderate limiting
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 signups per hour
    message: {
        statusCode: 429,
        message: 'Too many signup attempts. Please try again after 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =====================
// Search Rate Limiter
// Applied to search endpoints (expensive queries)
// =====================
export const searchLimiter = rateLimit({
    windowMs: VALIDATION_CONSTANTS.RATE_LIMIT_WINDOW_MS, // 15 minutes
    max: VALIDATION_CONSTANTS.SEARCH_MAX_REQUESTS, // 30 requests per 15 minutes
    message: {
        statusCode: 429,
        message: 'Too many search requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =====================
// File Upload Rate Limiter
// Applied to upload endpoints
// =====================
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        statusCode: 429,
        message: 'Too many upload requests. Please try again after 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =====================
// Write Operation Rate Limiter
// Applied to POST, PUT, PATCH, DELETE operations
// =====================
export const writeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 write operations per minute
    message: {
        statusCode: 429,
        message: 'Too many write operations. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =====================
// Helper function to apply multiple limiters
// =====================
export const applyLimiters = (...limiters) => {
    return (req, res, next) => {
        const limiter = limiters.shift();
        if (limiter) {
            limiter(req, res, () => {
                if (limiters.length > 0) {
                    applyLimiters(...limiters)(req, res, next);
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    };
};
