/**
 * Password Validator
 * Validates password strength, hashing, and comparison
 * Implements the Password Validator Interface from design specifications
 */

const bcrypt = require('bcrypt');

// Password validation configuration
const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  bcryptSaltRounds: 10
};

/**
 * Validate password strength against requirements
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, reason?: string, requirements: object }
 */
function validateStrength(password) {
  const result = {
    isValid: true,
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChars: false
    },
    failedRequirements: []
  };
  
  if (!password || typeof password !== 'string') {
    result.isValid = false;
    result.reason = 'Password must be a non-empty string';
    return result;
  }
  
  const pwd = String(password).trim();
  
  // Check minimum length
  if (pwd.length >= PASSWORD_CONFIG.minLength) {
    result.requirements.minLength = true;
  } else {
    result.isValid = false;
    result.failedRequirements.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
  }
  
  // Check for uppercase letters
  if (PASSWORD_CONFIG.requireUppercase) {
    if (/[A-Z]/.test(pwd)) {
      result.requirements.hasUppercase = true;
    } else {
      result.isValid = false;
      result.failedRequirements.push('Password must contain at least one uppercase letter (A-Z)');
    }
  }
  
  // Check for lowercase letters
  if (PASSWORD_CONFIG.requireLowercase) {
    if (/[a-z]/.test(pwd)) {
      result.requirements.hasLowercase = true;
    } else {
      result.isValid = false;
      result.failedRequirements.push('Password must contain at least one lowercase letter (a-z)');
    }
  }
  
  // Check for numbers
  if (PASSWORD_CONFIG.requireNumbers) {
    if (/\d/.test(pwd)) {
      result.requirements.hasNumbers = true;
    } else {
      result.isValid = false;
      result.failedRequirements.push('Password must contain at least one number (0-9)');
    }
  }
  
  // Check for special characters
  if (PASSWORD_CONFIG.requireSpecialChars) {
    const specialCharRegex = new RegExp(`[${PASSWORD_CONFIG.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (specialCharRegex.test(pwd)) {
      result.requirements.hasSpecialChars = true;
    } else {
      result.isValid = false;
      result.failedRequirements.push(`Password must contain at least one special character (${PASSWORD_CONFIG.specialChars})`);
    }
  }
  
  // Set reason if invalid
  if (!result.isValid) {
    result.reason = result.failedRequirements.join('; ');
  }
  
  console.log(`[Password Validator] Validation result for password: ${result.isValid ? 'VALID' : 'INVALID'}`);
  
  return result;
}

/**
 * Validate that two passwords match
 * @param {string} password - First password
 * @param {string} confirmPassword - Second password to compare
 * @returns {boolean} True if passwords match
 */
function validateMatch(password, confirmPassword) {
  if (!password || !confirmPassword) {
    console.log('[Password Validator] Password match validation failed: empty password');
    return false;
  }
  
  const match = String(password) === String(confirmPassword);
  
  if (!match) {
    console.log('[Password Validator] Password match validation failed: passwords do not match');
  } else {
    console.log('[Password Validator] Password match validation passed');
  }
  
  return match;
}

/**
 * Hash password using bcrypt
 * @param {string} password - Password to hash
 * @returns {Promise<string>} Hashed password
 * @throws {Error} If hashing fails
 */
async function hashPassword(password) {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    
    const pwd = String(password).trim();
    
    console.log(`[Password Validator] Hashing password with ${PASSWORD_CONFIG.bcryptSaltRounds} salt rounds`);
    
    const hashedPassword = await bcrypt.hash(pwd, PASSWORD_CONFIG.bcryptSaltRounds);
    
    console.log('[Password Validator] Password hashed successfully');
    
    return hashedPassword;
  } catch (error) {
    console.error('[Password Validator] Error hashing password:', error.message);
    throw error;
  }
}

/**
 * Compare plain password with hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(plainPassword, hashedPassword) {
  try {
    if (!plainPassword || !hashedPassword) {
      console.log('[Password Validator] Password comparison failed: empty password');
      return false;
    }
    
    const match = await bcrypt.compare(String(plainPassword), String(hashedPassword));
    
    if (match) {
      console.log('[Password Validator] Password comparison successful');
    } else {
      console.log('[Password Validator] Password comparison failed: passwords do not match');
    }
    
    return match;
  } catch (error) {
    console.error('[Password Validator] Error comparing passwords:', error.message);
    return false;
  }
}

/**
 * Check if password is different from old password
 * @param {string} newPassword - New password
 * @param {string} oldHashedPassword - Old hashed password
 * @returns {Promise<boolean>} True if new password is different from old
 */
async function isDifferentFromOld(newPassword, oldHashedPassword) {
  try {
    if (!newPassword || !oldHashedPassword) {
      return true; // Consider different if either is missing
    }
    
    const isSame = await comparePassword(newPassword, oldHashedPassword);
    const isDifferent = !isSame;
    
    if (!isDifferent) {
      console.log('[Password Validator] New password is same as old password');
    } else {
      console.log('[Password Validator] New password is different from old password');
    }
    
    return isDifferent;
  } catch (error) {
    console.error('[Password Validator] Error checking password difference:', error.message);
    return true; // Assume different on error
  }
}

/**
 * Validate password for reset (strength + match + different from old)
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Confirmation password
 * @param {string} oldHashedPassword - Old hashed password (optional)
 * @returns {Promise<object>} { isValid: boolean, reason?: string }
 */
async function validatePasswordReset(newPassword, confirmPassword, oldHashedPassword = null) {
  try {
    // Check strength
    const strengthResult = validateStrength(newPassword);
    if (!strengthResult.isValid) {
      return {
        isValid: false,
        reason: strengthResult.reason
      };
    }
    
    // Check match
    if (!validateMatch(newPassword, confirmPassword)) {
      return {
        isValid: false,
        reason: 'Passwords do not match'
      };
    }
    
    // Check if different from old password
    if (oldHashedPassword) {
      const isDifferent = await isDifferentFromOld(newPassword, oldHashedPassword);
      if (!isDifferent) {
        return {
          isValid: false,
          reason: 'New password must be different from current password'
        };
      }
    }
    
    console.log('[Password Validator] Password reset validation passed');
    
    return {
      isValid: true
    };
  } catch (error) {
    console.error('[Password Validator] Error validating password reset:', error.message);
    return {
      isValid: false,
      reason: 'Error validating password'
    };
  }
}

/**
 * Get password requirements as human-readable text
 * @returns {string} Password requirements description
 */
function getPasswordRequirements() {
  const requirements = [];
  
  requirements.push(`At least ${PASSWORD_CONFIG.minLength} characters`);
  
  if (PASSWORD_CONFIG.requireUppercase) {
    requirements.push('At least one uppercase letter (A-Z)');
  }
  
  if (PASSWORD_CONFIG.requireLowercase) {
    requirements.push('At least one lowercase letter (a-z)');
  }
  
  if (PASSWORD_CONFIG.requireNumbers) {
    requirements.push('At least one number (0-9)');
  }
  
  if (PASSWORD_CONFIG.requireSpecialChars) {
    requirements.push(`At least one special character (${PASSWORD_CONFIG.specialChars})`);
  }
  
  return requirements.join(', ');
}

/**
 * Get password configuration
 * @returns {object} Password configuration
 */
function getPasswordConfig() {
  return { ...PASSWORD_CONFIG };
}

// Export all functions
module.exports = {
  validateStrength,
  validateMatch,
  hashPassword,
  comparePassword,
  isDifferentFromOld,
  validatePasswordReset,
  getPasswordRequirements,
  getPasswordConfig,
  
  // Constants
  PASSWORD_CONFIG
};
