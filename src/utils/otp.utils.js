import crypto from 'crypto';

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate a secure random token for password reset
 * @returns {string} Random token (64 characters)
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - Expiration date
 * @returns {boolean} True if expired
 */
export const isOTPExpired = (expiresAt) => {
  return new Date() > expiresAt;
};

/**
 * Get expiration date for OTP (10 minutes from now)
 * @returns {Date} Expiration date
 */
export const getOTPExpiryDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 10); // 10 minutes
  return date;
};

/**
 * Get expiration date for reset token (1 hour from now)
 * @returns {Date} Expiration date
 */
export const getResetTokenExpiryDate = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1); // 1 hour
  return date;
};
