/**
 * Unit Tests for Password Validator
 * Tests password strength validation, hashing, and comparison
 */

const passwordValidator = require('./passwordValidator');

describe('Password Validator', () => {
  
  describe('Password Strength Validation', () => {
    test('validateStrength should accept strong password', () => {
      const result = passwordValidator.validateStrength('SecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.requirements.minLength).toBe(true);
      expect(result.requirements.hasUppercase).toBe(true);
      expect(result.requirements.hasLowercase).toBe(true);
      expect(result.requirements.hasNumbers).toBe(true);
      expect(result.requirements.hasSpecialChars).toBe(true);
    });
    
    test('validateStrength should reject password shorter than 8 characters', () => {
      const result = passwordValidator.validateStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.requirements.minLength).toBe(false);
      expect(result.reason).toContain('at least 8 characters');
    });
    
    test('validateStrength should reject password without uppercase', () => {
      const result = passwordValidator.validateStrength('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.requirements.hasUppercase).toBe(false);
      expect(result.reason).toContain('uppercase letter');
    });
    
    test('validateStrength should reject password without lowercase', () => {
      const result = passwordValidator.validateStrength('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.requirements.hasLowercase).toBe(false);
      expect(result.reason).toContain('lowercase letter');
    });
    
    test('validateStrength should reject password without numbers', () => {
      const result = passwordValidator.validateStrength('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.requirements.hasNumbers).toBe(false);
      expect(result.reason).toContain('number');
    });
    
    test('validateStrength should reject password without special characters', () => {
      const result = passwordValidator.validateStrength('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.requirements.hasSpecialChars).toBe(false);
      expect(result.reason).toContain('special character');
    });
    
    test('validateStrength should reject empty password', () => {
      const result = passwordValidator.validateStrength('');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('non-empty string');
    });
    
    test('validateStrength should reject null password', () => {
      const result = passwordValidator.validateStrength(null);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('non-empty string');
    });
    
    test('validateStrength should trim whitespace', () => {
      const result = passwordValidator.validateStrength('  SecurePass123!  ');
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('Password Match Validation', () => {
    test('validateMatch should return true for matching passwords', () => {
      const result = passwordValidator.validateMatch('SecurePass123!', 'SecurePass123!');
      expect(result).toBe(true);
    });
    
    test('validateMatch should return false for non-matching passwords', () => {
      const result = passwordValidator.validateMatch('SecurePass123!', 'DifferentPass123!');
      expect(result).toBe(false);
    });
    
    test('validateMatch should return false for empty passwords', () => {
      const result = passwordValidator.validateMatch('', '');
      expect(result).toBe(false);
    });
    
    test('validateMatch should return false if one password is empty', () => {
      const result = passwordValidator.validateMatch('SecurePass123!', '');
      expect(result).toBe(false);
    });
  });
  
  describe('Password Hashing', () => {
    test('hashPassword should return a bcrypt hash', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordValidator.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash format
    });
    
    test('hashPassword should produce different hashes for same password', async () => {
      const password = 'SecurePass123!';
      const hash1 = await passwordValidator.hashPassword(password);
      const hash2 = await passwordValidator.hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Different due to salt
    });
    
    test('hashPassword should reject empty password', async () => {
      try {
        await passwordValidator.hashPassword('');
        expect(true).toBe(false); // Should throw
      } catch (error) {
        expect(error.message).toContain('non-empty string');
      }
    });
    
    test('hashPassword should reject null password', async () => {
      try {
        await passwordValidator.hashPassword(null);
        expect(true).toBe(false); // Should throw
      } catch (error) {
        expect(error.message).toContain('non-empty string');
      }
    });
  });
  
  describe('Password Comparison', () => {
    test('comparePassword should return true for matching password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordValidator.hashPassword(password);
      const match = await passwordValidator.comparePassword(password, hash);
      
      expect(match).toBe(true);
    });
    
    test('comparePassword should return false for non-matching password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordValidator.hashPassword(password);
      const match = await passwordValidator.comparePassword('DifferentPass123!', hash);
      
      expect(match).toBe(false);
    });
    
    test('comparePassword should return false for empty password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordValidator.hashPassword(password);
      const match = await passwordValidator.comparePassword('', hash);
      
      expect(match).toBe(false);
    });
    
    test('comparePassword should return false for empty hash', async () => {
      const match = await passwordValidator.comparePassword('SecurePass123!', '');
      expect(match).toBe(false);
    });
  });
  
  describe('Password Difference Check', () => {
    test('isDifferentFromOld should return true for different password', async () => {
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass123!';
      const oldHash = await passwordValidator.hashPassword(oldPassword);
      
      const isDifferent = await passwordValidator.isDifferentFromOld(newPassword, oldHash);
      expect(isDifferent).toBe(true);
    });
    
    test('isDifferentFromOld should return false for same password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordValidator.hashPassword(password);
      
      const isDifferent = await passwordValidator.isDifferentFromOld(password, hash);
      expect(isDifferent).toBe(false);
    });
    
    test('isDifferentFromOld should return true if old hash is missing', async () => {
      const isDifferent = await passwordValidator.isDifferentFromOld('NewPass123!', null);
      expect(isDifferent).toBe(true);
    });
  });
  
  describe('Password Reset Validation', () => {
    test('validatePasswordReset should pass for valid reset', async () => {
      const newPassword = 'NewPass123!';
      const confirmPassword = 'NewPass123!';
      const oldPassword = 'OldPass123!';
      const oldHash = await passwordValidator.hashPassword(oldPassword);
      
      const result = await passwordValidator.validatePasswordReset(
        newPassword,
        confirmPassword,
        oldHash
      );
      
      expect(result.isValid).toBe(true);
    });
    
    test('validatePasswordReset should fail for weak password', async () => {
      const result = await passwordValidator.validatePasswordReset(
        'weak',
        'weak',
        null
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBeDefined();
    });
    
    test('validatePasswordReset should fail for non-matching passwords', async () => {
      const result = await passwordValidator.validatePasswordReset(
        'NewPass123!',
        'DifferentPass123!',
        null
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('do not match');
    });
    
    test('validatePasswordReset should fail if same as old password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordValidator.hashPassword(password);
      
      const result = await passwordValidator.validatePasswordReset(
        password,
        password,
        hash
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('different from current password');
    });
  });
  
  describe('Password Requirements', () => {
    test('getPasswordRequirements should return requirements string', () => {
      const requirements = passwordValidator.getPasswordRequirements();
      expect(typeof requirements).toBe('string');
      expect(requirements).toContain('8 characters');
      expect(requirements).toContain('uppercase');
      expect(requirements).toContain('lowercase');
      expect(requirements).toContain('number');
      expect(requirements).toContain('special character');
    });
    
    test('getPasswordConfig should return configuration object', () => {
      const config = passwordValidator.getPasswordConfig();
      expect(config).toBeDefined();
      expect(config.minLength).toBe(8);
      expect(config.requireUppercase).toBe(true);
      expect(config.requireLowercase).toBe(true);
      expect(config.requireNumbers).toBe(true);
      expect(config.requireSpecialChars).toBe(true);
      expect(config.bcryptSaltRounds).toBe(10);
    });
  });
});
