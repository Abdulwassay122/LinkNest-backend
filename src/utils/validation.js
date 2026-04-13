import { ApiError } from './ApiError.js';

/**
 * Input Validation and Sanitization Utilities
 * 
 * Why this is needed:
 * 1. SQL Injection Prevention: While Prisma ORM provides protection against SQL injection,
 *    we still need to validate and sanitize input to prevent:
 *    - LIKE-based attacks in search queries
 *    - Denial of Service via extremely long input strings
 *    - Logic bombs through special character manipulation
 * 
 * 2. XSS Prevention: Sanitize user input to prevent cross-site scripting attacks
 *    when data is displayed in the frontend
 * 
 * 3. Data Integrity: Ensure data consistency and prevent malformed data entry
 * 
 * 4. Rate Limiting: Prevent brute force and enumeration attacks on sensitive endpoints
 */

// =====================
// Validation Constants
// =====================

export const VALIDATION_CONSTANTS = {
    // Length limits
    MAX_EMAIL_LENGTH: 255,
    MAX_PASSWORD_LENGTH: 128,
    MIN_PASSWORD_LENGTH: 8,
    MAX_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 1000,
    MAX_URL_LENGTH: 2048,
    MAX_SEARCH_LENGTH: 100,
    MAX_TAG_NAME_LENGTH: 50,
    MAX_COLLECTION_NAME_LENGTH: 100,
    MAX_COLLECTION_DESCRIPTION_LENGTH: 500,
    
    // Pagination limits
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE_SIZE: 20,
    MIN_PAGE_SIZE: 1,
    
    // Rate limiting windows (in milliseconds)
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    
    // Rate limit max attempts
    LOGIN_MAX_ATTEMPTS: 5,
    OTP_MAX_ATTEMPTS: 3,
    SEARCH_MAX_REQUESTS: 30,
    GENERAL_MAX_REQUESTS: 100,
};

// =====================
// Input Sanitization Functions
// =====================

/**
 * Sanitize string input to prevent XSS and SQL injection
 * Removes or escapes potentially dangerous characters
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input) => {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    
    // Remove or escape SQL wildcards that could be used in LIKE attacks
    // This is extra protection on top of Prisma's parameterization
    sanitized = sanitized.replace(/[%_]/g, (match) => {
        return match === '%' ? '\\%' : '\\_';
    });
    
    // Trim whitespace from both ends
    sanitized = sanitized.trim();
    
    // Limit consecutive whitespace to prevent formatting attacks
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    return sanitized;
};

/**
 * Sanitize search query specifically
 * More aggressive sanitization for search inputs
 * 
 * @param query - Search query to sanitize
 * @returns Sanitized search query
 */
export const sanitizeSearchQuery = (query) => {
    if (typeof query !== 'string') {
        return query;
    }
    
    // Basic sanitization
    let sanitized = sanitizeString(query);
    
    // Remove potentially dangerous characters for search
    sanitized = sanitized.replace(/[<>\"'`;]/g, '');
    
    // Limit length
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_SEARCH_LENGTH) {
        sanitized = sanitized.substring(0, VALIDATION_CONSTANTS.MAX_SEARCH_LENGTH);
    }
    
    return sanitized;
};

/**
 * Sanitize URL to prevent SSRF and other URL-based attacks
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export const sanitizeUrl = (url) => {
    if (typeof url !== 'string') {
        return null;
    }
    
    const trimmed = url.trim();
    
    // Check length
    if (trimmed.length > VALIDATION_CONSTANTS.MAX_URL_LENGTH || trimmed.length === 0) {
        return null;
    }
    
    try {
        const parsedUrl = new URL(trimmed);
        
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return null;
        }
        
        // Block private IP ranges to prevent SSRF
        const hostname = parsedUrl.hostname.toLowerCase();
        
        // Block localhost and loopback
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
            return null;
        }
        
        // Block private IP ranges
        const privateIpPatterns = [
            /^10\./,                          // 10.0.0.0/8
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
            /^192\.168\./,                    // 192.168.0.0/16
            /^169\.254\./,                    // Link-local
            /^0\./,                           // 0.0.0.0/8
            /^127\./,                         // 127.0.0.0/8
        ];
        
        if (privateIpPatterns.some(pattern => pattern.test(hostname))) {
            return null;
        }
        
        return trimmed;
    } catch {
        return null;
    }
};

/**
 * Sanitize tag name
 * 
 * @param name - Tag name to sanitize
 * @returns Sanitized tag name
 */
export const sanitizeTagName = (name) => {
    if (typeof name !== 'string') {
        return name;
    }
    
    let sanitized = sanitizeString(name);
    
    // Remove special characters that could cause issues
    sanitized = sanitized.replace(/[<>\"'`;,#]/g, '');
    
    // Convert to lowercase for consistency
    sanitized = sanitized.toLowerCase();
    
    // Limit length
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_TAG_NAME_LENGTH) {
        sanitized = sanitized.substring(0, VALIDATION_CONSTANTS.MAX_TAG_NAME_LENGTH);
    }
    
    return sanitized;
};

/**
 * Sanitize email address
 * 
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export const sanitizeEmail = (email) => {
    if (typeof email !== 'string') {
        return email;
    }
    
    let sanitized = email.trim().toLowerCase();
    
    // Limit length
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH) {
        sanitized = sanitized.substring(0, VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH);
    }
    
    return sanitized;
};

// =====================
// Validation Functions
// =====================

/**
 * Validate email format
 * 
 * @param email - Email to validate
 * @throws ApiError if invalid
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        throw new ApiError(400, 'Email is required');
    }
    
    const sanitized = sanitizeEmail(email);
    
    if (sanitized.length === 0) {
        throw new ApiError(400, 'Email cannot be empty');
    }
    
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH) {
        throw new ApiError(400, `Email must be less than ${VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH} characters`);
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
        throw new ApiError(400, 'Invalid email format');
    }
};

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @throws ApiError if invalid
 */
export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        throw new ApiError(400, 'Password is required');
    }
    
    if (password.length < VALIDATION_CONSTANTS.MIN_PASSWORD_LENGTH) {
        throw new ApiError(400, `Password must be at least ${VALIDATION_CONSTANTS.MIN_PASSWORD_LENGTH} characters`);
    }
    
    if (password.length > VALIDATION_CONSTANTS.MAX_PASSWORD_LENGTH) {
        throw new ApiError(400, `Password must be less than ${VALIDATION_CONSTANTS.MAX_PASSWORD_LENGTH} characters`);
    }
    
    // Check for reasonable complexity (at least letters and numbers)
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasLetters || !hasNumbers) {
        throw new ApiError(400, 'Password must contain both letters and numbers');
    }
};

/**
 * Validate name input (user name, bookmark name, etc.)
 * 
 * @param name - Name to validate
 * @param fieldName - Name of the field for error messages
 * @throws ApiError if invalid
 */
export const validateName = (name, fieldName= 'Name') => {
    if (!name || typeof name !== 'string') {
        throw new ApiError(400, `${fieldName} is required`);
    }
    
    const sanitized = sanitizeString(name);
    
    if (sanitized.length === 0) {
        throw new ApiError(400, `${fieldName} cannot be empty`);
    }
    
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_NAME_LENGTH) {
        throw new ApiError(400, `${fieldName} must be less than ${VALIDATION_CONSTANTS.MAX_NAME_LENGTH} characters`);
    }
};

/**
 * Validate URL format
 * 
 * @param url - URL to validate
 * @throws ApiError if invalid
 */
export const validateUrl = (url) => {
    if (!url || typeof url !== 'string') {
        throw new ApiError(400, 'URL is required');
    }
    
    const sanitized = sanitizeUrl(url);
    
    if (!sanitized) {
        throw new ApiError(400, 'Invalid URL format. Only HTTP and HTTPS URLs are allowed');
    }
};

/**
 * Validate search query
 * 
 * @param query - Search query to validate
 * @throws ApiError if invalid
 */
export const validateSearchQuery = (query) => {
    if (!query || typeof query !== 'string') {
        throw new ApiError(400, 'Search query is required');
    }
    
    const sanitized = sanitizeSearchQuery(query);
    
    if (sanitized.length === 0) {
        throw new ApiError(400, 'Search query cannot be empty');
    }
    
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_SEARCH_LENGTH) {
        throw new ApiError(400, `Search query must be less than ${VALIDATION_CONSTANTS.MAX_SEARCH_LENGTH} characters`);
    }
};

/**
 * Validate pagination parameters
 * 
 * @param page - Page number
 * @param pageSize - Page size
 * @returns Validated pagination parameters
 */
export const validatePagination = (
    page,
    pageSize
) => {
    let pageNum = 1;
    let pageSizeNum = VALIDATION_CONSTANTS.DEFAULT_PAGE_SIZE;
    
    if (page !== undefined && page !== null) {
        pageNum = Number.parseInt(String(page), 10);
        if (Number.isNaN(pageNum) || pageNum < 1) {
            pageNum = 1;
        }
    }
    
    if (pageSize !== undefined && pageSize !== null) {
        pageSizeNum = Number.parseInt(String(pageSize), 10);
        if (Number.isNaN(pageSizeNum) || pageSizeNum < VALIDATION_CONSTANTS.MIN_PAGE_SIZE) {
            pageSizeNum = VALIDATION_CONSTANTS.MIN_PAGE_SIZE;
        }
        if (pageSizeNum > VALIDATION_CONSTANTS.MAX_PAGE_SIZE) {
            pageSizeNum = VALIDATION_CONSTANTS.MAX_PAGE_SIZE;
        }
    }
    
    return { page: pageNum, pageSize: pageSizeNum };
};

/**
 * Validate ID parameter (numeric ID from URL params)
 * 
 * @param id - ID string from URL params
 * @param fieldName - Name of the field for error messages
 * @returns Validated numeric ID
 * @throws ApiError if invalid
 */
export const validateId = (id, fieldName= 'ID') => {
    if (!id || typeof id !== 'string') {
        throw new ApiError(400, `${fieldName} is required`);
    }
    
    const numericId = Number.parseInt(id, 10);
    
    if (Number.isNaN(numericId) || numericId < 1) {
        throw new ApiError(400, `Invalid ${fieldName.toLowerCase()}. Must be a positive number`);
    }
    
    return numericId;
};

/**
 * Validate description input
 * 
 * @param description - Description to validate
 * @throws ApiError if invalid
 */
export const validateDescription = (description)=> {
    if (!description || typeof description !== 'string') {
        return null;
    }
    
    const sanitized = sanitizeString(description);
    
    if (sanitized.length === 0) {
        return null;
    }
    
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
        throw new ApiError(400, `Description must be less than ${VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`);
    }
    
    return sanitized;
};

/**
 * Validate tag name
 * 
 * @param name - Tag name to validate
 * @throws ApiError if invalid
 */
export const validateTagName = (name) => {
    if (!name || typeof name !== 'string') {
        throw new ApiError(400, 'Tag name is required');
    }
    
    const sanitized = sanitizeTagName(name);
    
    if (sanitized.length === 0) {
        throw new ApiError(400, 'Tag name cannot be empty');
    }
    
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_TAG_NAME_LENGTH) {
        throw new ApiError(400, `Tag name must be less than ${VALIDATION_CONSTANTS.MAX_TAG_NAME_LENGTH} characters`);
    }
};

/**
 * Validate collection name
 * 
 * @param name - Collection name to validate
 * @throws ApiError if invalid
 */
export const validateCollectionName = (name) => {
    if (!name || typeof name !== 'string') {
        throw new ApiError(400, 'Collection name is required');
    }
    
    const sanitized = sanitizeString(name);
    
    if (sanitized.length === 0) {
        throw new ApiError(400, 'Collection name cannot be empty');
    }
    
    if (sanitized.length > VALIDATION_CONSTANTS.MAX_COLLECTION_NAME_LENGTH) {
        throw new ApiError(400, `Collection name must be less than ${VALIDATION_CONSTANTS.MAX_COLLECTION_NAME_LENGTH} characters`);
    }
};

/**
 * Validate bookmark type
 * 
 * @param type - Bookmark type to validate
 * @throws ApiError if invalid
 */
export const validateBookmarkType = (type) => {
    if (!type) {
        return;
    }
    
    const validTypes = ['link', 'article', 'video', 'github', 'tool'];
    
    if (!validTypes.includes(type.toLowerCase())) {
        throw new ApiError(400, `Invalid bookmark type. Must be one of: ${validTypes.join(', ')}`);
    }
};

/**
 * Validate array of tags
 * 
 * @param tags - Array of tag names
 * @throws ApiError if invalid
 */
export const validateTags = (tags) => {
    if (!tags || !Array.isArray(tags)) {
        return;
    }
    
    if (tags.length === 0) {
        return;
    }
    
    if (tags.length > 20) {
        throw new ApiError(400, 'Cannot add more than 20 tags to a bookmark');
    }
    
    for (const tag of tags) {
        if (typeof tag !== 'string') {
            throw new ApiError(400, 'All tags must be strings');
        }
        validateTagName(tag);
    }
};
