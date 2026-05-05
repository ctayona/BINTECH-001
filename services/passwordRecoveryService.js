/**
 * Password Recovery Service
 * Manages OTP generation, storage, validation, and recovery session lifecycle
 * Implements the OTP Service Interface from design specifications
 */

const crypto = require('crypto');

// In-memory cache for OTP sessions (can be replaced with Redis)
// Structure: { email: PasswordRecoverySession }
const otpCache = new Map();

// Configuration constants
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure OTP
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
  // Generate random bytes and convert to 6-digit number
  const randomBytes = crypto.randomBytes(3);
  const randomNumber = randomBytes.readUIntBE(0, 3);
  const otp = String(randomNumber % 1000000).padStart(OTP_LENGTH, '0');
  
  console.log(`[OTP Service] Generated OTP: ${otp}`);
  return otp;
}

/**
 * Generate a cryptographically secure recovery token
 * @returns {string} Unique recovery token
 */
function generateRecoveryToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store OTP with expiration timestamp
 * @param {string} email - User email address
 * @param {string} otp - OTP code to store
 * @param {number} expiryMinutes - Minutes until OTP expires (default: 10)
 * @returns {boolean} True if stored successfully
 */
function storeOTP(email, otp, expiryMinutes = OTP_EXPIRY_MINUTES) {
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60000);
    
    const session = {
      email: normalizedEmail,
      otp: otp,
      otpCreatedAt: now,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      maxAttempts: MAX_OTP_ATTEMPTS,
      isVerified: false,
      recoveryToken: generateRecoveryToken(),
      createdAt: now,
      updatedAt: now
    };
    
    otpCache.set(normalizedEmail, session);
    
    console.log(`[OTP Service] Stored OTP for ${normalizedEmail}, expires at ${expiresAt.toISOString()}`);
    return true;
  } catch (error) {
    console.error('[OTP Service] Error storing OTP:', error.message);
    return false;
  }
}

/**
 * Retrieve OTP session from cache
 * @param {string} email - User email address
 * @returns {object|null} Recovery session or null if not found
 */
function getOTPSession(email) {
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const session = otpCache.get(normalizedEmail);
    
    if (!session) {
      console.log(`[OTP Service] No session found for ${normalizedEmail}`);
      return null;
    }
    
    console.log(`[OTP Service] Retrieved session for ${normalizedEmail}`);
    return session;
  } catch (error) {
    console.error('[OTP Service] Error retrieving OTP session:', error.message);
    return null;
  }
}

/**
 * Verify OTP against stored value
 * @param {string} email - User email address
 * @param {string} otp - OTP code to verify
 * @returns {object} { success: boolean, message: string, attemptsRemaining?: number }
 */
function verifyOTP(email, otp) {
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const session = getOTPSession(normalizedEmail);
    
    if (!session) {
      console.log(`[OTP Service] Verification failed: No active session for ${normalizedEmail}`);
      return {
        success: false,
        message: 'Recovery session not found or expired'
      };
    }
    
    // Check if OTP is expired
    if (isOTPExpired(normalizedEmail)) {
      invalidateOTP(normalizedEmail);
      console.log(`[OTP Service] Verification failed: OTP expired for ${normalizedEmail}`);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }
    
    // Check attempt limit
    if (session.otpAttempts >= session.maxAttempts) {
      invalidateOTP(normalizedEmail);
      console.log(`[OTP Service] Verification failed: Max attempts exceeded for ${normalizedEmail}`);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      };
    }
    
    // Verify OTP code
    if (session.otp !== String(otp).trim()) {
      session.otpAttempts += 1;
      session.updatedAt = new Date();
      otpCache.set(normalizedEmail, session);
      
      const attemptsRemaining = session.maxAttempts - session.otpAttempts;
      console.log(`[OTP Service] Verification failed: Invalid OTP for ${normalizedEmail}, attempts remaining: ${attemptsRemaining}`);
      
      return {
        success: false,
        message: 'Invalid OTP code',
        attemptsRemaining: attemptsRemaining
      };
    }
    
    // Mark session as verified
    session.isVerified = true;
    session.updatedAt = new Date();
    otpCache.set(normalizedEmail, session);
    
    console.log(`[OTP Service] Verification successful for ${normalizedEmail}`);
    return {
      success: true,
      message: 'OTP verified successfully',
      recoveryToken: session.recoveryToken
    };
  } catch (error) {
    console.error('[OTP Service] Error verifying OTP:', error.message);
    return {
      success: false,
      message: 'Error verifying OTP'
    };
  }
}

/**
 * Check if OTP has expired
 * @param {string} email - User email address
 * @returns {boolean} True if OTP is expired
 */
function isOTPExpired(email) {
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const session = getOTPSession(normalizedEmail);
    
    if (!session) {
      return true;
    }
    
    const isExpired = new Date() > session.otpExpiresAt;
    
    if (isExpired) {
      console.log(`[OTP Service] OTP expired for ${normalizedEmail}`);
    }
    
    return isExpired;
  } catch (error) {
    console.error('[OTP Service] Error checking OTP expiration:', error.message);
    return true;
  }
}

/**
 * Invalidate OTP session
 * @param {string} email - User email address
 * @returns {boolean} True if invalidated successfully
 */
function invalidateOTP(email) {
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const deleted = otpCache.delete(normalizedEmail);
    
    if (deleted) {
      console.log(`[OTP Service] Invalidated OTP session for ${normalizedEmail}`);
    }
    
    return deleted;
  } catch (error) {
    console.error('[OTP Service] Error invalidating OTP:', error.message);
    return false;
  }
}

/**
 * Verify recovery token
 * @param {string} email - User email address
 * @param {string} token - Recovery token to verify
 * @returns {boolean} True if token is valid
 */
function verifyRecoveryToken(email, token) {
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const session = getOTPSession(normalizedEmail);
    
    if (!session) {
      return false;
    }
    
    const isValid = session.recoveryToken === token && session.isVerified;
    
    if (!isValid) {
      console.log(`[OTP Service] Invalid recovery token for ${normalizedEmail}`);
    }
    
    return isValid;
  } catch (error) {
    console.error('[OTP Service] Error verifying recovery token:', error.message);
    return false;
  }
}

/**
 * Get recovery session details
 * @param {string} email - User email address
 * @returns {object|null} Recovery session or null
 */
function getRecoverySession(email) {
  return getOTPSession(email);
}

/**
 * Update recovery session
 * @param {string} email - User email address
 * @param {object} updates - Fields to update
 * @returns {boolean} True if updated successfully
 */
function updateRecoverySession(email, updates) {
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const session = getOTPSession(normalizedEmail);
    
    if (!session) {
      return false;
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };
    
    otpCache.set(normalizedEmail, updatedSession);
    console.log(`[OTP Service] Updated recovery session for ${normalizedEmail}`);
    return true;
  } catch (error) {
    console.error('[OTP Service] Error updating recovery session:', error.message);
    return false;
  }
}

/**
 * Clean up expired sessions (maintenance function)
 * @returns {number} Number of sessions cleaned up
 */
function cleanupExpiredSessions() {
  try {
    let cleanedCount = 0;
    const now = new Date();
    
    for (const [email, session] of otpCache.entries()) {
      if (now > session.otpExpiresAt) {
        otpCache.delete(email);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[OTP Service] Cleaned up ${cleanedCount} expired sessions`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('[OTP Service] Error cleaning up expired sessions:', error.message);
    return 0;
  }
}

/**
 * Get cache statistics (for debugging)
 * @returns {object} Cache statistics
 */
function getCacheStats() {
  return {
    totalSessions: otpCache.size,
    sessions: Array.from(otpCache.entries()).map(([email, session]) => ({
      email,
      isVerified: session.isVerified,
      isExpired: isOTPExpired(email),
      attemptsRemaining: session.maxAttempts - session.otpAttempts,
      expiresAt: session.otpExpiresAt.toISOString()
    }))
  };
}

// Export all functions
module.exports = {
  generateOTP,
  generateRecoveryToken,
  storeOTP,
  getOTPSession,
  verifyOTP,
  isOTPExpired,
  invalidateOTP,
  verifyRecoveryToken,
  getRecoverySession,
  updateRecoverySession,
  cleanupExpiredSessions,
  getCacheStats,
  
  // Constants
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS
};
