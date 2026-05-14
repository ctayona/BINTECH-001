/**
 * Signup OTP Service
 * Manages OTP generation, pending signup payload storage, validation, and lifecycle
 */

const crypto = require('crypto');

const signupCache = new Map();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateOTP() {
  const randomBytes = crypto.randomBytes(3);
  const randomNumber = randomBytes.readUIntBE(0, 3);
  return String(randomNumber % 1000000).padStart(OTP_LENGTH, '0');
}

function generateSignupToken() {
  return crypto.randomBytes(32).toString('hex');
}

function storeSignupSession(email, pendingRegistration, otp, expiryMinutes = OTP_EXPIRY_MINUTES) {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !pendingRegistration || !otp) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60000);

    signupCache.set(normalizedEmail, {
      email: normalizedEmail,
      otp,
      otpCreatedAt: now,
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
      maxAttempts: MAX_OTP_ATTEMPTS,
      isVerified: false,
      signupToken: generateSignupToken(),
      pendingRegistration,
      createdAt: now,
      updatedAt: now
    });

    return true;
  } catch (error) {
    console.error('[Signup OTP Service] Error storing signup session:', error.message);
    return false;
  }
}

function getSignupSession(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return signupCache.get(normalizedEmail) || null;
}

function isExpired(email) {
  const session = getSignupSession(email);
  if (!session) {
    return true;
  }

  return new Date() > session.otpExpiresAt;
}

function verifySignupOTP(email, otp) {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const session = getSignupSession(normalizedEmail);

    if (!session) {
      return {
        success: false,
        message: 'Signup session not found or expired'
      };
    }

    if (isExpired(normalizedEmail)) {
      invalidateSignupSession(normalizedEmail);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }

    if (session.otpAttempts >= session.maxAttempts) {
      invalidateSignupSession(normalizedEmail);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      };
    }

    if (session.otp !== String(otp || '').trim()) {
      session.otpAttempts += 1;
      session.updatedAt = new Date();
      signupCache.set(normalizedEmail, session);

      return {
        success: false,
        message: 'Invalid OTP code',
        attemptsRemaining: session.maxAttempts - session.otpAttempts
      };
    }

    session.isVerified = true;
    session.updatedAt = new Date();
    signupCache.set(normalizedEmail, session);

    return {
      success: true,
      message: 'OTP verified successfully',
      signupToken: session.signupToken,
      pendingRegistration: session.pendingRegistration
    };
  } catch (error) {
    console.error('[Signup OTP Service] Error verifying signup OTP:', error.message);
    return {
      success: false,
      message: 'Error verifying OTP'
    };
  }
}

function verifySignupToken(email, signupToken) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const session = getSignupSession(normalizedEmail);

  if (!session || !session.isVerified) {
    return false;
  }

  return session.signupToken === String(signupToken || '').trim();
}

function invalidateSignupSession(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return signupCache.delete(normalizedEmail);
}

module.exports = {
  generateOTP,
  generateSignupToken,
  storeSignupSession,
  getSignupSession,
  verifySignupOTP,
  verifySignupToken,
  invalidateSignupSession,
  isExpired,
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS
};