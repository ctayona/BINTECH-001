/**
 * Property-Based Tests for Password Recovery Service
 * Tests universal correctness properties using fast-check
 */

const fc = require('fast-check');
const passwordRecoveryService = require('./passwordRecoveryService');

describe('Password Recovery Service - Property-Based Tests', () => {
  
  describe('Property 1: OTP Uniqueness', () => {
    /**
     * Validates: Requirements 2.1
     * 
     * Property: For any two distinct password recovery sessions initiated at different times,
     * the generated OTPs must be different.
     * 
     * ∀ session1, session2 ∈ PasswordRecoverySessions:
     *   (session1.email ≠ session2.email ∨ session1.createdAt ≠ session2.createdAt)
     *   ⟹ session1.otp ≠ session2.otp
     */
    test('OTP Uniqueness: Generated OTPs should be unique across multiple generations', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 100 }), (numOTPs) => {
          const generatedOTPs = new Set();
          
          for (let i = 0; i < numOTPs; i++) {
            const otp = passwordRecoveryService.generateOTP();
            
            // Each OTP should be unique (with extremely high probability)
            // The probability of collision is 1/1,000,000 per pair
            expect(otp).toMatch(/^\d{6}$/);
            generatedOTPs.add(otp);
          }
          
          // With 100 OTPs, we should have very few collisions (statistically ~0)
          // Allow for 1 collision in 100 OTPs (probability ~0.005%)
          const collisionRate = 1 - (generatedOTPs.size / numOTPs);
          expect(collisionRate).toBeLessThan(0.01);
        }),
        { numRuns: 10 }
      );
    });

    test('OTP Uniqueness: Different sessions should have different OTPs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.emailAddress(), { minLength: 5, maxLength: 20 }),
          (emails) => {
            const otpsByEmail = new Map();
            
            // Generate OTP for each email
            for (const email of emails) {
              const otp = passwordRecoveryService.generateOTP();
              passwordRecoveryService.storeOTP(email, otp);
              otpsByEmail.set(email, otp);
            }
            
            // Verify all OTPs are unique
            const otpValues = Array.from(otpsByEmail.values());
            const uniqueOTPs = new Set(otpValues);
            
            // With high probability, all OTPs should be unique
            expect(uniqueOTPs.size).toBeGreaterThanOrEqual(
              Math.max(1, otpValues.length - 1)
            );
          }
        ),
        { numRuns: 5 }
      );
    });

    test('OTP Uniqueness: OTP format is always 6 digits', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (count) => {
          for (let i = 0; i < count; i++) {
            const otp = passwordRecoveryService.generateOTP();
            
            // Must be exactly 6 digits
            expect(otp).toMatch(/^\d{6}$/);
            expect(otp.length).toBe(6);
            
            // Must be numeric
            expect(/^[0-9]+$/.test(otp)).toBe(true);
            
            // Must be in valid range
            const otpNum = parseInt(otp, 10);
            expect(otpNum).toBeGreaterThanOrEqual(0);
            expect(otpNum).toBeLessThan(1000000);
          }
        }),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 2: OTP Expiration Enforcement', () => {
    /**
     * Validates: Requirements 2.1, 2.2
     * 
     * Property: An OTP cannot be verified after its expiration time has passed.
     * 
     * ∀ session ∈ PasswordRecoverySessions:
     *   (currentTime() > session.otpExpiresAt)
     *   ⟹ verifyOTP(session.email, session.otp, session.recoveryToken) = false
     */
    test('OTP Expiration: Expired OTPs cannot be verified', (done) => {
      const email = 'test-expiry@example.com';
      const otp = passwordRecoveryService.generateOTP();
      
      // Store with very short expiry
      passwordRecoveryService.storeOTP(email, otp, 0);
      
      // Wait for expiration
      setTimeout(() => {
        const isExpired = passwordRecoveryService.isOTPExpired(email);
        expect(isExpired).toBe(true);
        
        // Verification should fail for expired OTP
        const result = passwordRecoveryService.verifyOTP(email, otp);
        expect(result.success).toBe(false);
        expect(result.message).toContain('expired');
        
        done();
      }, 150);
    });

    test('OTP Expiration: Fresh OTPs are not expired', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.integer({ min: 5, max: 60 }),
          (email, expiryMinutes) => {
            const otp = passwordRecoveryService.generateOTP();
            
            // Store with reasonable expiry
            passwordRecoveryService.storeOTP(email, otp, expiryMinutes);
            
            // Fresh OTP should not be expired
            const isExpired = passwordRecoveryService.isOTPExpired(email);
            expect(isExpired).toBe(false);
            
            // Verification should succeed
            const result = passwordRecoveryService.verifyOTP(email, otp);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 3: Attempt Limit Enforcement', () => {
    /**
     * Validates: Requirements 2.3
     * 
     * Property: After maximum attempts are exceeded, no further OTP verification 
     * attempts are allowed for that session.
     * 
     * ∀ session ∈ PasswordRecoverySessions:
     *   (session.otpAttempts ≥ session.maxAttempts)
     *   ⟹ verifyOTP(session.email, otp, session.recoveryToken) = false
     */
    test('Attempt Limit: Verification fails after max attempts', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.integer({ min: 1, max: 10 }),
          (email, wrongAttempts) => {
            const otp = passwordRecoveryService.generateOTP();
            passwordRecoveryService.storeOTP(email, otp);
            
            const maxAttempts = passwordRecoveryService.MAX_OTP_ATTEMPTS;
            
            // Make max attempts with wrong OTP
            for (let i = 0; i < maxAttempts; i++) {
              const result = passwordRecoveryService.verifyOTP(email, '000000');
              expect(result.success).toBe(false);
            }
            
            // Next attempt should fail even with correct OTP
            const finalResult = passwordRecoveryService.verifyOTP(email, otp);
            expect(finalResult.success).toBe(false);
            expect(finalResult.message).toContain('Too many failed attempts');
          }
        ),
        { numRuns: 5 }
      );
    });

    test('Attempt Limit: Attempt counter increments correctly', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.integer({ min: 1, max: 4 }),
          (email, numAttempts) => {
            const otp = passwordRecoveryService.generateOTP();
            passwordRecoveryService.storeOTP(email, otp);
            
            // Make several wrong attempts
            for (let i = 0; i < numAttempts; i++) {
              passwordRecoveryService.verifyOTP(email, '000000');
              
              const session = passwordRecoveryService.getOTPSession(email);
              expect(session.otpAttempts).toBe(i + 1);
            }
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 4: Session Isolation', () => {
    /**
     * Validates: Requirements 2.1, 2.2, 2.3
     * 
     * Property: Sessions for different emails don't interfere with each other.
     * Each email has its own independent OTP session.
     */
    test('Session Isolation: Different emails have independent sessions', () => {
      fc.assert(
        fc.property(
          fc.array(fc.emailAddress(), { minLength: 2, maxLength: 10, uniqueBy: (e) => e }),
          (emails) => {
            const otpMap = new Map();
            
            // Create sessions for each email
            for (const email of emails) {
              const otp = passwordRecoveryService.generateOTP();
              passwordRecoveryService.storeOTP(email, otp);
              otpMap.set(email, otp);
            }
            
            // Verify each session is independent
            for (const email of emails) {
              const session = passwordRecoveryService.getOTPSession(email);
              expect(session).not.toBeNull();
              expect(session.email).toBe(email.toLowerCase());
              expect(session.otp).toBe(otpMap.get(email));
              expect(session.otpAttempts).toBe(0);
            }
            
            // Incrementing attempts for one email shouldn't affect others
            const firstEmail = emails[0];
            const secondEmail = emails[1];
            
            const firstOtp = otpMap.get(firstEmail);
            passwordRecoveryService.verifyOTP(firstEmail, '000000');
            
            const firstSession = passwordRecoveryService.getOTPSession(firstEmail);
            const secondSession = passwordRecoveryService.getOTPSession(secondEmail);
            
            expect(firstSession.otpAttempts).toBe(1);
            expect(secondSession.otpAttempts).toBe(0);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 5: Email Normalization Idempotence', () => {
    /**
     * Validates: Requirements 2.1
     * 
     * Property: Email normalization is idempotent - normalizing twice equals normalizing once.
     * This ensures consistent session lookups regardless of email case.
     */
    test('Email Normalization: Normalization is idempotent', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const otp = passwordRecoveryService.generateOTP();
          
          // Store with original email
          passwordRecoveryService.storeOTP(email, otp);
          
          // Retrieve with different cases
          const session1 = passwordRecoveryService.getOTPSession(email);
          const session2 = passwordRecoveryService.getOTPSession(email.toUpperCase());
          const session3 = passwordRecoveryService.getOTPSession(email.toLowerCase());
          
          // All should return the same session
          expect(session1).not.toBeNull();
          expect(session2).not.toBeNull();
          expect(session3).not.toBeNull();
          
          expect(session1.email).toBe(session2.email);
          expect(session2.email).toBe(session3.email);
          expect(session1.otp).toBe(session2.otp);
          expect(session2.otp).toBe(session3.otp);
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 6: Recovery Token Uniqueness', () => {
    /**
     * Validates: Requirements 2.1, 2.2
     * 
     * Property: Each recovery session has a unique recovery token.
     * Recovery tokens should never collide across different sessions.
     */
    test('Recovery Token Uniqueness: Each session has unique token', () => {
      fc.assert(
        fc.property(
          fc.array(fc.emailAddress(), { minLength: 5, maxLength: 20, uniqueBy: (e) => e }),
          (emails) => {
            const tokens = new Set();
            
            // Create sessions and collect tokens
            for (const email of emails) {
              const otp = passwordRecoveryService.generateOTP();
              passwordRecoveryService.storeOTP(email, otp);
              
              const session = passwordRecoveryService.getOTPSession(email);
              tokens.add(session.recoveryToken);
            }
            
            // All tokens should be unique
            expect(tokens.size).toBe(emails.length);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 7: OTP Storage Consistency', () => {
    /**
     * Validates: Requirements 2.2, 2.3
     * 
     * Property: Stored OTP can be retrieved and verified correctly.
     * The stored OTP matches what was provided during storage.
     */
    test('OTP Storage Consistency: Stored OTP matches retrieved OTP', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.integer({ min: 100000, max: 999999 }).map((n) => String(n)),
          (email, otp) => {
            // Store OTP
            const storeResult = passwordRecoveryService.storeOTP(email, otp);
            expect(storeResult).toBe(true);
            
            // Retrieve and verify
            const session = passwordRecoveryService.getOTPSession(email);
            expect(session).not.toBeNull();
            expect(session.otp).toBe(otp);
            
            // Verification should succeed
            const verifyResult = passwordRecoveryService.verifyOTP(email, otp);
            expect(verifyResult.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 8: Expiration Timestamp Validity', () => {
    /**
     * Validates: Requirements 2.2, 2.3
     * 
     * Property: Expiration timestamp is always after creation timestamp.
     * The OTP expiry time must be in the future relative to creation time.
     */
    test('Expiration Timestamp: Expiry is always after creation', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.integer({ min: 1, max: 60 }),
          (email, expiryMinutes) => {
            const otp = passwordRecoveryService.generateOTP();
            passwordRecoveryService.storeOTP(email, otp, expiryMinutes);
            
            const session = passwordRecoveryService.getOTPSession(email);
            
            // Expiry should be after creation
            expect(session.otpExpiresAt.getTime()).toBeGreaterThan(
              session.otpCreatedAt.getTime()
            );
            
            // Expiry should be approximately expiryMinutes in the future
            const expectedExpiry = session.otpCreatedAt.getTime() + expiryMinutes * 60000;
            const actualExpiry = session.otpExpiresAt.getTime();
            
            // Allow 1 second tolerance for timing
            expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
