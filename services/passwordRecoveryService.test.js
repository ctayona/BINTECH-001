/**
 * Unit Tests for Password Recovery Service
 * Tests OTP generation, storage, validation, and session management
 */

const passwordRecoveryService = require('./passwordRecoveryService');

describe('Password Recovery Service', () => {
  
  describe('OTP Generation', () => {
    test('generateOTP should return a 6-digit string', () => {
      const otp = passwordRecoveryService.generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });
    
    test('generateOTP should generate different OTPs on consecutive calls', () => {
      const otp1 = passwordRecoveryService.generateOTP();
      const otp2 = passwordRecoveryService.generateOTP();
      // Note: There's a small chance they could be the same (1 in 1,000,000)
      // but this test should pass in practice
      expect(otp1).not.toBe(otp2);
    });
    
    test('generateOTP should only contain numeric characters', () => {
      for (let i = 0; i < 10; i++) {
        const otp = passwordRecoveryService.generateOTP();
        expect(/^\d+$/.test(otp)).toBe(true);
      }
    });
  });
  
  describe('OTP Storage and Retrieval', () => {
    test('storeOTP should store OTP session successfully', () => {
      const email = 'test@example.com';
      const otp = '123456';
      const result = passwordRecoveryService.storeOTP(email, otp);
      expect(result).toBe(true);
    });
    
    test('getOTPSession should retrieve stored session', () => {
      const email = 'test@example.com';
      const otp = '654321';
      passwordRecoveryService.storeOTP(email, otp);
      
      const session = passwordRecoveryService.getOTPSession(email);
      expect(session).not.toBeNull();
      expect(session.email).toBe(email.toLowerCase());
      expect(session.otp).toBe(otp);
    });
    
    test('getOTPSession should normalize email to lowercase', () => {
      const email = 'TEST@EXAMPLE.COM';
      const otp = '111111';
      passwordRecoveryService.storeOTP(email, otp);
      
      const session = passwordRecoveryService.getOTPSession(email);
      expect(session.email).toBe('test@example.com');
    });
    
    test('getOTPSession should return null for non-existent session', () => {
      const session = passwordRecoveryService.getOTPSession('nonexistent@example.com');
      expect(session).toBeNull();
    });
  });
  
  describe('OTP Expiration', () => {
    test('isOTPExpired should return false for new OTP', () => {
      const email = 'test@example.com';
      const otp = '999999';
      passwordRecoveryService.storeOTP(email, otp);
      
      const isExpired = passwordRecoveryService.isOTPExpired(email);
      expect(isExpired).toBe(false);
    });
    
    test('isOTPExpired should return true for expired OTP', (done) => {
      const email = 'test@example.com';
      const otp = '888888';
      // Store with 0 minutes expiry (expires immediately)
      passwordRecoveryService.storeOTP(email, otp, 0);
      
      // Wait a bit and check
      setTimeout(() => {
        const isExpired = passwordRecoveryService.isOTPExpired(email);
        expect(isExpired).toBe(true);
        done();
      }, 100);
    });
  });
  
  describe('OTP Verification', () => {
    test('verifyOTP should succeed with correct OTP', () => {
      const email = 'test@example.com';
      const otp = '555555';
      passwordRecoveryService.storeOTP(email, otp);
      
      const result = passwordRecoveryService.verifyOTP(email, otp);
      expect(result.success).toBe(true);
      expect(result.message).toContain('verified successfully');
    });
    
    test('verifyOTP should fail with incorrect OTP', () => {
      const email = 'test@example.com';
      const otp = '444444';
      passwordRecoveryService.storeOTP(email, otp);
      
      const result = passwordRecoveryService.verifyOTP(email, '000000');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid OTP');
    });
    
    test('verifyOTP should increment attempt counter on failure', () => {
      const email = 'test@example.com';
      const otp = '333333';
      passwordRecoveryService.storeOTP(email, otp);
      
      const session1 = passwordRecoveryService.getOTPSession(email);
      expect(session1.otpAttempts).toBe(0);
      
      passwordRecoveryService.verifyOTP(email, '000000');
      
      const session2 = passwordRecoveryService.getOTPSession(email);
      expect(session2.otpAttempts).toBe(1);
    });
    
    test('verifyOTP should fail after max attempts', () => {
      const email = 'test@example.com';
      const otp = '222222';
      passwordRecoveryService.storeOTP(email, otp);
      
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        passwordRecoveryService.verifyOTP(email, '000000');
      }
      
      // 6th attempt should fail with max attempts message
      const result = passwordRecoveryService.verifyOTP(email, otp);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Too many failed attempts');
    });
    
    test('verifyOTP should mark session as verified on success', () => {
      const email = 'test@example.com';
      const otp = '111111';
      passwordRecoveryService.storeOTP(email, otp);
      
      const session1 = passwordRecoveryService.getOTPSession(email);
      expect(session1.isVerified).toBe(false);
      
      passwordRecoveryService.verifyOTP(email, otp);
      
      const session2 = passwordRecoveryService.getOTPSession(email);
      expect(session2.isVerified).toBe(true);
    });
  });
  
  describe('OTP Invalidation', () => {
    test('invalidateOTP should remove session', () => {
      const email = 'test@example.com';
      const otp = '777777';
      passwordRecoveryService.storeOTP(email, otp);
      
      let session = passwordRecoveryService.getOTPSession(email);
      expect(session).not.toBeNull();
      
      passwordRecoveryService.invalidateOTP(email);
      
      session = passwordRecoveryService.getOTPSession(email);
      expect(session).toBeNull();
    });
  });
  
  describe('Recovery Token', () => {
    test('getOTPSession should include recovery token', () => {
      const email = 'test@example.com';
      const otp = '666666';
      passwordRecoveryService.storeOTP(email, otp);
      
      const session = passwordRecoveryService.getOTPSession(email);
      expect(session.recoveryToken).toBeDefined();
      expect(typeof session.recoveryToken).toBe('string');
      expect(session.recoveryToken.length).toBeGreaterThan(0);
    });
    
    test('verifyRecoveryToken should return true for valid token', () => {
      const email = 'test@example.com';
      const otp = '555555';
      passwordRecoveryService.storeOTP(email, otp);
      passwordRecoveryService.verifyOTP(email, otp);
      
      const session = passwordRecoveryService.getOTPSession(email);
      const isValid = passwordRecoveryService.verifyRecoveryToken(email, session.recoveryToken);
      expect(isValid).toBe(true);
    });
    
    test('verifyRecoveryToken should return false for invalid token', () => {
      const email = 'test@example.com';
      const otp = '444444';
      passwordRecoveryService.storeOTP(email, otp);
      passwordRecoveryService.verifyOTP(email, otp);
      
      const isValid = passwordRecoveryService.verifyRecoveryToken(email, 'invalid-token');
      expect(isValid).toBe(false);
    });
    
    test('verifyRecoveryToken should return false if session not verified', () => {
      const email = 'test@example.com';
      const otp = '333333';
      passwordRecoveryService.storeOTP(email, otp);
      
      const session = passwordRecoveryService.getOTPSession(email);
      const isValid = passwordRecoveryService.verifyRecoveryToken(email, session.recoveryToken);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Session Management', () => {
    test('updateRecoverySession should update session fields', () => {
      const email = 'test@example.com';
      const otp = '222222';
      passwordRecoveryService.storeOTP(email, otp);
      
      const result = passwordRecoveryService.updateRecoverySession(email, {
        isVerified: true
      });
      expect(result).toBe(true);
      
      const session = passwordRecoveryService.getOTPSession(email);
      expect(session.isVerified).toBe(true);
    });
    
    test('cleanupExpiredSessions should remove expired sessions', (done) => {
      const email = 'test@example.com';
      const otp = '111111';
      // Store with 0 minutes expiry
      passwordRecoveryService.storeOTP(email, otp, 0);
      
      setTimeout(() => {
        const cleanedCount = passwordRecoveryService.cleanupExpiredSessions();
        expect(cleanedCount).toBeGreaterThan(0);
        
        const session = passwordRecoveryService.getOTPSession(email);
        expect(session).toBeNull();
        done();
      }, 100);
    });
  });
  
  describe('Cache Statistics', () => {
    test('getCacheStats should return cache information', () => {
      const email = 'test@example.com';
      const otp = '999999';
      passwordRecoveryService.storeOTP(email, otp);
      
      const stats = passwordRecoveryService.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.totalSessions).toBeGreaterThan(0);
      expect(Array.isArray(stats.sessions)).toBe(true);
    });
  });
});
