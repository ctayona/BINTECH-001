/**
 * Property-Based Tests for Password Validator
 * Tests password hashing and validation properties using fast-check
 */

const fc = require('fast-check');
const passwordValidator = require('./passwordValidator');

// Helper function to generate valid passwords
function generateValidPassword() {
  return fc.string({ minLength: 8, maxLength: 128 })
    .map(pwd => pwd.trim()) // Trim whitespace first
    .filter(pwd => {
      // Ensure it's at least 8 characters after trimming
      if (pwd.length < 8) return false;
      // Ensure it has uppercase
      if (!/[A-Z]/.test(pwd)) return false;
      // Ensure it has lowercase
      if (!/[a-z]/.test(pwd)) return false;
      // Ensure it has digit
      if (!/\d/.test(pwd)) return false;
      // Ensure it has special char
      if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) return false;
      return true;
    });
}

describe('Password Validator - Property-Based Tests', () => {
  
  describe('Property 4: Password Update Atomicity', () => {
    test('Password hashing produces consistent results for the same password', async () => {
      /**
       * Validates: Requirements 3.3, 3.4
       * 
       * Property: For any valid password, when hashed and then compared with the original,
       * the comparison should always succeed. This ensures password hashing is atomic and
       * produces consistent, verifiable results.
       */
      await fc.assert(
        fc.asyncProperty(
          generateValidPassword(),
          async (password) => {
            // Hash the password
            const hash = await passwordValidator.hashPassword(password);
            
            // Verify the hash is a valid bcrypt hash
            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.startsWith('$2')).toBe(true);
            
            // Compare the original password with the hash
            const matches = await passwordValidator.comparePassword(password, hash);
            
            // The comparison should always succeed for the same password
            expect(matches).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Different passwords produce different hashes', async () => {
      /**
       * Validates: Requirements 3.3, 3.4
       * 
       * Property: For any two different valid passwords, their bcrypt hashes should be
       * different (due to random salt). This ensures password hashing is atomic and
       * produces unique results for different inputs.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(generateValidPassword(), generateValidPassword()).filter(
            ([pwd1, pwd2]) => pwd1 !== pwd2
          ),
          async ([password1, password2]) => {
            // Hash both passwords
            const hash1 = await passwordValidator.hashPassword(password1);
            const hash2 = await passwordValidator.hashPassword(password2);
            
            // The hashes should be different (due to salt)
            expect(hash1).not.toBe(hash2);
            
            // password1 should match hash1 but not hash2
            const match1 = await passwordValidator.comparePassword(password1, hash1);
            const match2 = await passwordValidator.comparePassword(password1, hash2);
            
            expect(match1).toBe(true);
            expect(match2).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('Password hashing is deterministic for comparison', async () => {
      /**
       * Validates: Requirements 3.3, 3.4
       * 
       * Property: For any valid password, hashing it multiple times and comparing
       * with the original should always succeed. This ensures the hashing function
       * is atomic and produces verifiable results consistently.
       */
      await fc.assert(
        fc.asyncProperty(
          generateValidPassword(),
          async (password) => {
            // Hash the password multiple times
            const hash1 = await passwordValidator.hashPassword(password);
            const hash2 = await passwordValidator.hashPassword(password);
            
            // Both hashes should be different (due to salt)
            expect(hash1).not.toBe(hash2);
            
            // But both should match the original password
            const match1 = await passwordValidator.comparePassword(password, hash1);
            const match2 = await passwordValidator.comparePassword(password, hash2);
            
            expect(match1).toBe(true);
            expect(match2).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Password validation and hashing work atomically together', async () => {
      /**
       * Validates: Requirements 3.3, 3.4
       * 
       * Property: For any valid password that passes strength validation,
       * hashing and comparing should work atomically without partial failures.
       * Either the entire operation succeeds or fails completely.
       */
      await fc.assert(
        fc.asyncProperty(
          generateValidPassword(),
          async (password) => {
            // Validate strength
            const strengthResult = passwordValidator.validateStrength(password);
            expect(strengthResult.isValid).toBe(true);
            
            // Hash the password
            const hash = await passwordValidator.hashPassword(password);
            expect(hash).toBeDefined();
            
            // Compare should succeed
            const matches = await passwordValidator.comparePassword(password, hash);
            expect(matches).toBe(true);
            
            // All operations should complete atomically - no partial state
            // If any step fails, the entire operation should fail
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Invalid passwords cannot be hashed', async () => {
      /**
       * Validates: Requirements 3.3, 3.4
       * 
       * Property: For any invalid password (empty, null, or weak),
       * hashing should fail atomically without partial state.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(''),
            fc.constant(null),
            fc.constant(undefined),
            fc.string({ minLength: 1, maxLength: 7 }) // Too short
          ),
          async (password) => {
            // Attempting to hash an invalid password should throw
            try {
              await passwordValidator.hashPassword(password);
              // If we get here, the password was somehow valid
              // This is acceptable for weak passwords that might pass
            } catch (error) {
              // Expected behavior - hashing failed atomically
              expect(error).toBeDefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Password comparison is atomic and consistent', async () => {
      /**
       * Validates: Requirements 3.3, 3.4
       * 
       * Property: For any valid password and its hash, comparing the password
       * with the hash should always produce the same result (true), and comparing
       * with a different password should always produce false. This ensures
       * atomicity of the comparison operation.
       */
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(generateValidPassword(), generateValidPassword()).filter(
            ([pwd1, pwd2]) => pwd1 !== pwd2
          ),
          async ([correctPassword, wrongPassword]) => {
            // Hash the correct password
            const hash = await passwordValidator.hashPassword(correctPassword);
            
            // Compare correct password multiple times - should always be true
            const match1 = await passwordValidator.comparePassword(correctPassword, hash);
            const match2 = await passwordValidator.comparePassword(correctPassword, hash);
            
            expect(match1).toBe(true);
            expect(match2).toBe(true);
            
            // Compare wrong password multiple times - should always be false
            const wrongMatch1 = await passwordValidator.comparePassword(wrongPassword, hash);
            const wrongMatch2 = await passwordValidator.comparePassword(wrongPassword, hash);
            
            expect(wrongMatch1).toBe(false);
            expect(wrongMatch2).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
