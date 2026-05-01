/**
 * Password Recovery Controller
 * Handles password recovery endpoints: forgot-password, verify-otp, reset-password
 * Implements the Password Recovery Controller Interface from design specifications
 */

const passwordRecoveryService = require('../services/passwordRecoveryService');
const emailService = require('../services/emailService');
const passwordValidator = require('../lib/passwordValidator');
const auditLogger = require('../lib/auditLogger');
const supabase = require('../config/supabase');

// Rate limiting store: { email: { count: number, resetTime: timestamp } }
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 requests per hour per email

/**
 * Check rate limit for an email
 * @param {string} email - User email address
 * @returns {object} { allowed: boolean, remaining: number, resetTime?: number }
 */
function checkRateLimit(email) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const now = Date.now();
  
  let limitData = rateLimitStore.get(normalizedEmail);
  
  // Initialize or reset if window expired
  if (!limitData || now > limitData.resetTime) {
    limitData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    rateLimitStore.set(normalizedEmail, limitData);
  }
  
  const allowed = limitData.count < RATE_LIMIT_MAX_REQUESTS;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - limitData.count);
  
  return {
    allowed,
    remaining,
    resetTime: limitData.resetTime
  };
}

/**
 * Increment rate limit counter
 * @param {string} email - User email address
 */
function incrementRateLimit(email) {
  const normalizedEmail = String(email).trim().toLowerCase();
  let limitData = rateLimitStore.get(normalizedEmail);
  
  if (limitData) {
    limitData.count += 1;
  }
}

/**
 * Normalize and validate email format
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, normalizedEmail?: string, reason?: string }
 */
function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      reason: 'Email is required'
    };
  }
  
  const normalizedEmail = String(email).trim().toLowerCase();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return {
      isValid: false,
      reason: 'Invalid email format'
    };
  }
  
  return {
    isValid: true,
    normalizedEmail
  };
}

/**
 * Get client IP address from request
 * @param {object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Get user agent from request
 * @param {object} req - Express request object
 * @returns {string} User agent string
 */
function getUserAgent(req) {
  return req.get('user-agent') || 'unknown';
}

/**
 * POST /api/auth/forgot-password
 * Initiate password recovery by sending OTP to email
 * 
 * Request body:
 * {
 *   email: string (required)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   recoveryToken?: string (if successful)
 * }
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    console.log(`[Password Recovery] Forgot password request for: ${email}`);
    
    // Step 1: Validate email format
    const emailValidation = validateEmailFormat(email);
    if (!emailValidation.isValid) {
      console.log(`[Password Recovery] Invalid email format: ${email}`);
      auditLogger.recordFailedAttempt(email, 'Invalid email format', ipAddress, userAgent);
      
      // Return generic success message for security (don't reveal if email exists)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive an OTP shortly.'
      });
    }
    
    const normalizedEmail = emailValidation.normalizedEmail;
    
    // Step 2: Check rate limit
    const rateLimit = checkRateLimit(normalizedEmail);
    if (!rateLimit.allowed) {
      console.log(`[Password Recovery] Rate limit exceeded for: ${normalizedEmail}`);
      auditLogger.recordFailedAttempt(normalizedEmail, 'Rate limit exceeded', ipAddress, userAgent);
      
      // Return generic success message for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive an OTP shortly.'
      });
    }
    
    // Step 3: Check if user exists in database
    console.log(`[Password Recovery] Querying user_accounts for email: ${normalizedEmail}`);
    const { data: userAccount, error: queryError } = await supabase
      .from('user_accounts')
      .select('system_id, role, email')
      .eq('email', normalizedEmail)
      .single();
    
    if (queryError) {
      console.error(`[Password Recovery] Query error for ${normalizedEmail}:`, queryError.message);
      console.error(`[Password Recovery] Error details:`, queryError);
    }
    
    if (queryError || !userAccount) {
      console.log(`[Password Recovery] User not found: ${normalizedEmail}`);
      console.log(`[Password Recovery] Query error: ${queryError ? queryError.message : 'No error, but user is null'}`);
      auditLogger.recordFailedAttempt(normalizedEmail, 'User not found', ipAddress, userAgent);
      
      // Return generic success message for security (don't reveal if email exists)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive an OTP shortly.'
      });
    }
    
    // Step 4: Generate OTP
    const otp = passwordRecoveryService.generateOTP();
    
    // Step 5: Store OTP session
    const stored = passwordRecoveryService.storeOTP(normalizedEmail, otp);
    if (!stored) {
      console.log(`[Password Recovery] Failed to store OTP for: ${normalizedEmail}`);
      auditLogger.recordFailedAttempt(normalizedEmail, 'Failed to store OTP', ipAddress, userAgent);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate password recovery. Please try again.'
      });
    }
    
    // Step 6: Send OTP email
    // Get user's first name from role-specific table for personalization
    let firstName = 'User';
    const roleTable = userAccount.role === 'student' ? 'student_accounts' 
                    : userAccount.role === 'faculty' ? 'faculty_accounts'
                    : userAccount.role === 'staff' ? 'staff_accounts'
                    : null;
    
    if (roleTable) {
      const { data: roleProfile } = await supabase
        .from(roleTable)
        .select('first_name')
        .eq('email', normalizedEmail)
        .single();
      
      if (roleProfile && roleProfile.first_name) {
        firstName = roleProfile.first_name;
      }
    }
    
    const emailSent = await emailService.sendOTPEmail(normalizedEmail, otp, firstName);
    if (!emailSent) {
      console.log(`[Password Recovery] Failed to send OTP email to: ${normalizedEmail}`);
      passwordRecoveryService.invalidateOTP(normalizedEmail);
      auditLogger.recordFailedAttempt(normalizedEmail, 'Failed to send OTP email', ipAddress, userAgent);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
    
    // Step 7: Increment rate limit counter
    incrementRateLimit(normalizedEmail);
    
    // Step 8: Get recovery token for response
    const session = passwordRecoveryService.getRecoverySession(normalizedEmail);
    const recoveryToken = session ? session.recoveryToken : null;
    
    // Step 9: Log audit trail
    auditLogger.recordOTPInitiation(normalizedEmail, ipAddress, userAgent);
    auditLogger.recordOTPSent(normalizedEmail, ipAddress, userAgent);
    
    console.log(`[Password Recovery] OTP sent successfully to: ${normalizedEmail}`);
    
    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
      recoveryToken: recoveryToken
    });
    
  } catch (error) {
    console.error('[Password Recovery] Error in forgotPassword:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
}

/**
 * POST /api/auth/verify-otp
 * Verify OTP code and mark recovery session as verified
 * 
 * Request body:
 * {
 *   email: string (required),
 *   otp: string (required, 6 digits),
 *   recoveryToken: string (required)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   recoveryToken?: string (if successful),
 *   attemptsRemaining?: number (if failed)
 * }
 */
async function verifyOTP(req, res) {
  try {
    const { email, otp, recoveryToken } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    console.log(`[Password Recovery] Verify OTP request for: ${email}`);
    
    // Step 1: Validate email format
    const emailValidation = validateEmailFormat(email);
    if (!emailValidation.isValid) {
      console.log(`[Password Recovery] Invalid email format in verify-otp: ${email}`);
      auditLogger.recordOTPVerification(email, false, 'Invalid email format', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const normalizedEmail = emailValidation.normalizedEmail;
    
    // Step 2: Validate OTP format
    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(String(otp).trim())) {
      console.log(`[Password Recovery] Invalid OTP format for: ${normalizedEmail}`);
      auditLogger.recordOTPVerification(normalizedEmail, false, 'Invalid OTP format', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'OTP must be a 6-digit code'
      });
    }
    
    // Step 3: Validate recovery token
    if (!recoveryToken || typeof recoveryToken !== 'string') {
      console.log(`[Password Recovery] Invalid recovery token for: ${normalizedEmail}`);
      auditLogger.recordOTPVerification(normalizedEmail, false, 'Invalid recovery token', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid recovery token'
      });
    }
    
    // Step 4: Verify OTP using service
    const verificationResult = passwordRecoveryService.verifyOTP(normalizedEmail, String(otp).trim());
    
    if (!verificationResult.success) {
      console.log(`[Password Recovery] OTP verification failed for: ${normalizedEmail}`);
      auditLogger.recordOTPVerification(normalizedEmail, false, verificationResult.message, ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
        attemptsRemaining: verificationResult.attemptsRemaining
      });
    }
    
    // Step 5: Verify recovery token matches session
    const isTokenValid = passwordRecoveryService.verifyRecoveryToken(normalizedEmail, recoveryToken);
    if (!isTokenValid) {
      console.log(`[Password Recovery] Recovery token mismatch for: ${normalizedEmail}`);
      auditLogger.recordOTPVerification(normalizedEmail, false, 'Recovery token mismatch', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid recovery token'
      });
    }
    
    // Step 6: Log successful verification
    auditLogger.recordOTPVerification(normalizedEmail, true, null, ipAddress, userAgent);
    
    console.log(`[Password Recovery] OTP verified successfully for: ${normalizedEmail}`);
    
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      recoveryToken: recoveryToken
    });
    
  } catch (error) {
    console.error('[Password Recovery] Error in verifyOTP:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
}

/**
 * POST /api/auth/reset-password
 * Reset password after OTP verification
 * 
 * Request body:
 * {
 *   email: string (required),
 *   newPassword: string (required),
 *   confirmPassword: string (required),
 *   recoveryToken: string (required)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */
async function resetPassword(req, res) {
  try {
    const { email, newPassword, confirmPassword, recoveryToken } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    console.log(`[Password Recovery] Reset password request for: ${email}`);
    
    // Step 1: Validate email format
    const emailValidation = validateEmailFormat(email);
    if (!emailValidation.isValid) {
      console.log(`[Password Recovery] Invalid email format in reset-password: ${email}`);
      auditLogger.recordPasswordReset(email, false, 'Invalid email format', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const normalizedEmail = emailValidation.normalizedEmail;
    
    // Step 2: Validate recovery token
    if (!recoveryToken || typeof recoveryToken !== 'string') {
      console.log(`[Password Recovery] Invalid recovery token for: ${normalizedEmail}`);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'Invalid recovery token', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid recovery token'
      });
    }
    
    // Step 3: Retrieve recovery session
    const session = passwordRecoveryService.getRecoverySession(normalizedEmail);
    if (!session) {
      console.log(`[Password Recovery] No active recovery session for: ${normalizedEmail}`);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'No active recovery session', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Recovery session not found or expired'
      });
    }
    
    // Step 4: Verify session is verified
    if (!session.isVerified) {
      console.log(`[Password Recovery] Recovery session not verified for: ${normalizedEmail}`);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'Recovery session not verified', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Recovery session not verified. Please verify OTP first.'
      });
    }
    
    // Step 5: Verify recovery token matches
    if (session.recoveryToken !== recoveryToken) {
      console.log(`[Password Recovery] Recovery token mismatch for: ${normalizedEmail}`);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'Recovery token mismatch', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid recovery token'
      });
    }
    
    // Step 6: Validate password match
    if (!passwordValidator.validateMatch(newPassword, confirmPassword)) {
      console.log(`[Password Recovery] Passwords do not match for: ${normalizedEmail}`);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'Passwords do not match', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    
    // Step 7: Validate password strength
    const strengthResult = passwordValidator.validateStrength(newPassword);
    if (!strengthResult.isValid) {
      console.log(`[Password Recovery] Password validation failed for: ${normalizedEmail}`);
      auditLogger.recordPasswordReset(normalizedEmail, false, strengthResult.reason, ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: strengthResult.reason
      });
    }
    
    // Step 8: Retrieve user from database
    const { data: userAccount, error: queryError } = await supabase
      .from('user_accounts')
      .select('system_id, password, role, email')
      .eq('email', normalizedEmail)
      .single();
    
    if (queryError || !userAccount) {
      console.log(`[Password Recovery] User not found for: ${normalizedEmail}`);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'User not found', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's first name from role-specific table for confirmation email
    let firstName = 'User';
    const roleTable = userAccount.role === 'student' ? 'student_accounts' 
                    : userAccount.role === 'faculty' ? 'faculty_accounts'
                    : userAccount.role === 'staff' ? 'staff_accounts'
                    : null;
    
    if (roleTable) {
      const { data: roleProfile } = await supabase
        .from(roleTable)
        .select('first_name')
        .eq('email', normalizedEmail)
        .single();
      
      if (roleProfile && roleProfile.first_name) {
        firstName = roleProfile.first_name;
      }
    }
    
    // Step 9: Check if new password is different from old password
    const isDifferent = await passwordValidator.isDifferentFromOld(newPassword, userAccount.password);
    if (!isDifferent) {
      console.log(`[Password Recovery] New password same as old for: ${normalizedEmail}`);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'New password same as old', ipAddress, userAgent);
      
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password'
      });
    }
    
    // Step 10: Hash new password
    let hashedPassword;
    try {
      hashedPassword = await passwordValidator.hashPassword(newPassword);
    } catch (hashError) {
      console.error(`[Password Recovery] Error hashing password for: ${normalizedEmail}`, hashError.message);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'Error hashing password', ipAddress, userAgent);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to process password. Please try again.'
      });
    }
    
    // Step 11: Update password in database
    const { error: updateError } = await supabase
      .from('user_accounts')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('system_id', userAccount.system_id);
    
    if (updateError) {
      console.error(`[Password Recovery] Database update failed for: ${normalizedEmail}`, updateError.message);
      auditLogger.recordPasswordReset(normalizedEmail, false, 'Database update failed', ipAddress, userAgent);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update password. Please try again.'
      });
    }
    
    // Step 12: Invalidate recovery session
    passwordRecoveryService.invalidateOTP(normalizedEmail);
    
    // Step 13: Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation(normalizedEmail, firstName);
    } catch (emailError) {
      console.error(`[Password Recovery] Error sending confirmation email to: ${normalizedEmail}`, emailError.message);
      // Don't fail the request if confirmation email fails - password was already reset
    }
    
    // Step 14: Log successful password reset
    auditLogger.recordPasswordReset(normalizedEmail, true, null, ipAddress, userAgent);
    
    console.log(`[Password Recovery] Password reset successfully for: ${normalizedEmail}`);
    
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
    
  } catch (error) {
    console.error('[Password Recovery] Error in resetPassword:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
}

// Export controller functions
module.exports = {
  forgotPassword,
  verifyOTP,
  resetPassword,
  
  // Utility functions (for testing)
  checkRateLimit,
  incrementRateLimit,
  validateEmailFormat,
  getClientIP,
  getUserAgent
};
