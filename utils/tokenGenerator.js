import crypto from 'crypto';

/**
 * Generate a unique registration token for coach team registration
 * @returns {string} Unique token string
 */
export const generateRegistrationToken = () => {
  // Generate 32 random bytes and convert to hex string
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate registration link URL
 * @param {string} token - Registration token
 * @param {string} baseUrl - Base URL of the application (optional, defaults to frontend URL)
 * @returns {string} Full registration URL
 */
export const generateRegistrationLink = (token, baseUrl = null) => {
  // If baseUrl is provided, use it; otherwise construct from environment or default
  const frontendUrl = baseUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/register?token=${token}`;
};




