/**
 * Unit Tests for Password Recovery Controller
 * Tests all three endpoints: forgot-password, verify-otp, reset-password
 */

// Mock dependencies BEFORE importing the controller
jest.mock('../services/passwordRecoveryService');
jest.mock('../services/emailService');
jest.mock('../lib/passwordValidator');
jest.mock('../lib/auditLogger');
jest.mock('../config/supabase');

const passwordRecoveryController = require('./passwordRecoveryController');
const passwordRecoveryService = require('../services/passwordRecoveryService');
const emailService = require('../services/emailService');
const passwordValidator = require('../lib/passwordValidator');
const auditLogger = require('../lib/auditLogger');
const supabase = require('../config/supabase');

describe('Password Recovery Controller', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Clear rate limit store by creating new controller instance
    // (This is a workaround since the rate limit store is module-level)
    
    // Setup mock request and response objects
    req = {
      body: {},
      ip: '192.168.1.1',
      connection: { remoteAddress: '192.168.1.1' },
      get: jest.fn((header) => {
        if (header === 'user-agent') {
          return 'Mozilla/5.0 Test Browser';
        }
        return '';
      })
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });
  
  describe('forgotPassword endpoint', () => {
    test('should send OTP for valid email with existing user', async () => {
      // Arrange
      req.body = { email: 'student@umak.edu.ph' };
      
      passwordRecoveryService.generateOTP.mockReturnValue('123456');
      passwordRecoveryService.storeOTP.mockReturnValue(true);
      passwordRecoveryService.getRecoverySession.mockReturnValue({
        recoveryToken: 'test-token-123'
      });
      emailService.sendOTPEmail.mockResolvedValue(true);
      
      // Mock both user_accounts and student_accounts queries
      supabase.from.mockImplementation((table) => {
        if (table === 'user_accounts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                system_id: 'user-123',
                role: 'student',
                email: 'student@umak.edu.ph'
              },
              error: null
            })
          };
        } else if (table === 'student_accounts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                first_name: 'John'
              },
              error: null
            })
          };
        }
      });
      
      // Act
      await passwordRecoveryController.forgotPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('OTP sent'),
          recoveryToken: 'test-token-123'
        })
      );
      expect(emailService.sendOTPEmail).toHaveBeenCalledWith(
        'student@umak.edu.ph',
        '123456',
        'John'
      );
    });
    
    test('should return generic success for non-existent email (security)', async () => {
      // Arrange
      req.body = { email: 'nonexistent@umak.edu.ph' };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('No rows found')
        })
      });
      
      // Act
      await passwordRecoveryController.forgotPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('If an account exists')
        })
      );
      expect(emailService.sendOTPEmail).not.toHaveBeenCalled();
    });
    
    test('should return generic success for invalid email format (security)', async () => {
      // Arrange
      req.body = { email: 'invalid-email' };
      
      // Act
      await passwordRecoveryController.forgotPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('If an account exists')
        })
      );
      expect(emailService.sendOTPEmail).not.toHaveBeenCalled();
    });
    
    test('should enforce rate limiting (3 requests per hour)', async () => {
      // Arrange - use unique email to avoid cross-test pollution
      const uniqueEmail = `ratelimit-${Date.now()}@umak.edu.ph`;
      req.body = { email: uniqueEmail };
      
      // Mock user exists
      const mockSingle = jest.fn();
      const mockEq = jest.fn();
      const mockSelect = jest.fn();
      
      mockSingle.mockResolvedValue({
        data: {
          system_id: 'user-123',
          role: 'student',
          email: uniqueEmail
        },
        error: null
      });
      
      mockEq.mockReturnValue({
        single: mockSingle
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      supabase.from.mockImplementation((table) => {
        if (table === 'user_accounts') {
          return {
            select: mockSelect
          };
        } else if (table === 'student_accounts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                first_name: 'John'
              },
              error: null
            })
          };
        }
      });
      
      passwordRecoveryService.generateOTP.mockReturnValue('123456');
      passwordRecoveryService.storeOTP.mockReturnValue(true);
      passwordRecoveryService.getRecoverySession.mockReturnValue({
        recoveryToken: 'test-token-123'
      });
      emailService.sendOTPEmail.mockResolvedValue(true);
      
      // Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        await passwordRecoveryController.forgotPassword(req, res);
      }
      
      // 4th request should be rate limited
      await passwordRecoveryController.forgotPassword(req, res);
      
      // Assert - 4th request should return generic success (rate limited)
      const lastCall = res.json.mock.calls[res.json.mock.calls.length - 1][0];
      expect(lastCall.success).toBe(true);
      expect(lastCall.message).toContain('If an account exists');
      
      // Email should only be sent 3 times
      expect(emailService.sendOTPEmail).toHaveBeenCalledTimes(3);
    });
    
    test('should return error if OTP storage fails', async () => {
      // Arrange - use unique email
      const uniqueEmail = `storage-fail-${Date.now()}@umak.edu.ph`;
      req.body = { email: uniqueEmail };
      
      const mockSingle = jest.fn();
      const mockEq = jest.fn();
      const mockSelect = jest.fn();
      
      mockSingle.mockResolvedValue({
        data: {
          system_id: 'user-123',
          role: 'student',
          email: uniqueEmail
        },
        error: null
      });
      
      mockEq.mockReturnValue({
        single: mockSingle
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      supabase.from.mockReturnValue({
        select: mockSelect
      });
      
      passwordRecoveryService.generateOTP.mockReturnValue('123456');
      passwordRecoveryService.storeOTP.mockReturnValue(false);
      
      // Act
      await passwordRecoveryController.forgotPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to initiate')
        })
      );
    });
    
    test('should return error if email sending fails', async () => {
      // Arrange - use unique email
      const uniqueEmail = `email-fail-${Date.now()}@umak.edu.ph`;
      req.body = { email: uniqueEmail };
      
      const mockSingle = jest.fn();
      const mockEq = jest.fn();
      const mockSelect = jest.fn();
      
      mockSingle.mockResolvedValue({
        data: {
          system_id: 'user-123',
          role: 'student',
          email: uniqueEmail
        },
        error: null
      });
      
      mockEq.mockReturnValue({
        single: mockSingle
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      supabase.from.mockImplementation((table) => {
        if (table === 'user_accounts') {
          return {
            select: mockSelect
          };
        } else if (table === 'student_accounts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                first_name: 'John'
              },
              error: null
            })
          };
        }
      });
      
      passwordRecoveryService.generateOTP.mockReturnValue('123456');
      passwordRecoveryService.storeOTP.mockReturnValue(true);
      emailService.sendOTPEmail.mockResolvedValue(false);
      passwordRecoveryService.invalidateOTP.mockReturnValue(true);
      
      // Act
      await passwordRecoveryController.forgotPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to send OTP')
        })
      );
      expect(passwordRecoveryService.invalidateOTP).toHaveBeenCalled();
    });
  });
  
  describe('verifyOTP endpoint', () => {
    test('should verify correct OTP code', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        otp: '123456',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.verifyOTP.mockReturnValue({
        success: true,
        message: 'OTP verified successfully',
        recoveryToken: 'test-token-123'
      });
      
      passwordRecoveryService.verifyRecoveryToken.mockReturnValue(true);
      
      // Act
      await passwordRecoveryController.verifyOTP(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('OTP verified'),
          recoveryToken: 'test-token-123'
        })
      );
    });
    
    test('should reject incorrect OTP code', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        otp: '000000',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.verifyOTP.mockReturnValue({
        success: false,
        message: 'Invalid OTP code',
        attemptsRemaining: 4
      });
      
      // Act
      await passwordRecoveryController.verifyOTP(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid OTP code',
          attemptsRemaining: 4
        })
      );
    });
    
    test('should reject OTP after expiration', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        otp: '123456',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.verifyOTP.mockReturnValue({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
      
      // Act
      await passwordRecoveryController.verifyOTP(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('expired')
        })
      );
    });
    
    test('should enforce attempt limit (5 attempts)', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        otp: '000000',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.verifyOTP.mockReturnValue({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
      
      // Act
      await passwordRecoveryController.verifyOTP(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Too many failed attempts')
        })
      );
    });
    
    test('should reject invalid OTP format', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        otp: 'invalid',
        recoveryToken: 'test-token-123'
      };
      
      // Act
      await passwordRecoveryController.verifyOTP(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('6-digit code')
        })
      );
    });
    
    test('should reject invalid recovery token', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        otp: '123456',
        recoveryToken: 'invalid-token'
      };
      
      passwordRecoveryService.verifyOTP.mockReturnValue({
        success: true,
        message: 'OTP verified successfully',
        recoveryToken: 'test-token-123'
      });
      
      passwordRecoveryService.verifyRecoveryToken.mockReturnValue(false);
      
      // Act
      await passwordRecoveryController.verifyOTP(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid recovery token'
        })
      );
    });
  });
  
  describe('resetPassword endpoint', () => {
    test('should reset password with valid session and strong password', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.getRecoverySession.mockReturnValue({
        isVerified: true,
        recoveryToken: 'test-token-123'
      });
      
      passwordValidator.validateMatch.mockReturnValue(true);
      passwordValidator.validateStrength.mockReturnValue({
        isValid: true
      });
      
      passwordValidator.isDifferentFromOld.mockResolvedValue(true);
      passwordValidator.hashPassword.mockResolvedValue('hashed-password-123');
      
      const mockSingle = jest.fn();
      const mockEq = jest.fn();
      const mockSelect = jest.fn();
      const mockUpdate = jest.fn();
      const mockUpdateEq = jest.fn();
      
      mockSingle.mockResolvedValue({
        data: {
          system_id: 'user-123',
          password: 'old-hashed-password',
          role: 'student',
          email: 'student@umak.edu.ph'
        },
        error: null
      });
      
      mockEq.mockReturnValue({
        single: mockSingle
      });
      
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      
      mockUpdateEq.mockResolvedValue({
        error: null
      });
      
      mockUpdate.mockReturnValue({
        eq: mockUpdateEq
      });
      
      supabase.from.mockImplementation((table) => {
        if (table === 'user_accounts') {
          return {
            select: mockSelect,
            update: mockUpdate
          };
        } else if (table === 'student_accounts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                first_name: 'John'
              },
              error: null
            })
          };
        }
      });
      
      passwordRecoveryService.invalidateOTP.mockReturnValue(true);
      emailService.sendPasswordResetConfirmation.mockResolvedValue(true);
      
      // Act
      await passwordRecoveryController.resetPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Password reset successfully')
        })
      );
      expect(passwordRecoveryService.invalidateOTP).toHaveBeenCalled();
    });
    
    test('should reject reset with unverified session', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.getRecoverySession.mockReturnValue({
        isVerified: false,
        recoveryToken: 'test-token-123'
      });
      
      // Act
      await passwordRecoveryController.resetPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not verified')
        })
      );
    });
    
    test('should reject mismatched passwords', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.getRecoverySession.mockReturnValue({
        isVerified: true,
        recoveryToken: 'test-token-123'
      });
      
      passwordValidator.validateMatch.mockReturnValue(false);
      
      // Act
      await passwordRecoveryController.resetPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('do not match')
        })
      );
    });
    
    test('should reject weak password', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        newPassword: 'weak',
        confirmPassword: 'weak',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.getRecoverySession.mockReturnValue({
        isVerified: true,
        recoveryToken: 'test-token-123'
      });
      
      passwordValidator.validateMatch.mockReturnValue(true);
      passwordValidator.validateStrength.mockReturnValue({
        isValid: false,
        reason: 'Password must be at least 8 characters long'
      });
      
      // Act
      await passwordRecoveryController.resetPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('at least 8 characters')
        })
      );
    });
    
    test('should reject password same as old password', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        newPassword: 'OldPassword123!',
        confirmPassword: 'OldPassword123!',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.getRecoverySession.mockReturnValue({
        isVerified: true,
        recoveryToken: 'test-token-123'
      });
      
      passwordValidator.validateMatch.mockReturnValue(true);
      passwordValidator.validateStrength.mockReturnValue({
        isValid: true
      });
      
      passwordValidator.isDifferentFromOld.mockResolvedValue(false);
      
      supabase.from.mockImplementation((table) => {
        if (table === 'user_accounts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                system_id: 'user-123',
                password: 'old-hashed-password',
                role: 'student',
                email: 'student@umak.edu.ph'
              },
              error: null
            })
          };
        } else if (table === 'student_accounts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                first_name: 'John'
              },
              error: null
            })
          };
        }
      });
      
      // Act
      await passwordRecoveryController.resetPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('must be different')
        })
      );
    });
    
    test('should reject invalid recovery token', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
        recoveryToken: 'invalid-token'
      };
      
      passwordRecoveryService.getRecoverySession.mockReturnValue({
        isVerified: true,
        recoveryToken: 'test-token-123'
      });
      
      // Act
      await passwordRecoveryController.resetPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid recovery token'
        })
      );
    });
    
    test('should reject reset with no active session', async () => {
      // Arrange
      req.body = {
        email: 'student@umak.edu.ph',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
        recoveryToken: 'test-token-123'
      };
      
      passwordRecoveryService.getRecoverySession.mockReturnValue(null);
      
      // Act
      await passwordRecoveryController.resetPassword(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found or expired')
        })
      );
    });
  });
  
  describe('Utility functions', () => {
    test('validateEmailFormat should accept valid emails', () => {
      const result = passwordRecoveryController.validateEmailFormat('student@umak.edu.ph');
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe('student@umak.edu.ph');
    });
    
    test('validateEmailFormat should reject invalid emails', () => {
      const result = passwordRecoveryController.validateEmailFormat('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBeDefined();
    });
    
    test('validateEmailFormat should normalize email to lowercase', () => {
      const result = passwordRecoveryController.validateEmailFormat('STUDENT@UMAK.EDU.PH');
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe('student@umak.edu.ph');
    });
    
    test('validateEmailFormat should trim whitespace', () => {
      const result = passwordRecoveryController.validateEmailFormat('  student@umak.edu.ph  ');
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe('student@umak.edu.ph');
    });
    
    test('checkRateLimit should allow requests within limit', () => {
      const email = 'test@example.com';
      
      const result1 = passwordRecoveryController.checkRateLimit(email);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(3);
      
      const result2 = passwordRecoveryController.checkRateLimit(email);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });
    
    test('checkRateLimit should block requests after limit exceeded', () => {
      const email = 'test@example.com';
      
      // Make 3 requests
      passwordRecoveryController.incrementRateLimit(email);
      passwordRecoveryController.incrementRateLimit(email);
      passwordRecoveryController.incrementRateLimit(email);
      
      // 4th request should be blocked
      const result = passwordRecoveryController.checkRateLimit(email);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
    
    test('getClientIP should extract IP from request', () => {
      const ip = passwordRecoveryController.getClientIP(req);
      expect(ip).toBe('192.168.1.1');
    });
    
    test('getUserAgent should extract user agent from request', () => {
      const ua = passwordRecoveryController.getUserAgent(req);
      expect(ua).toBe('Mozilla/5.0 Test Browser');
    });
  });
});
