/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Password Recovery Frontend Components
 * Tests form validation, UI updates, and user interactions
 */

// Import the password recovery frontend module
require('../js/password-recovery-frontend.js');

// Get functions from window object (they're exported there)
const {
  validateEmail,
  validateOTP,
  validatePasswordStrength,
  calculatePasswordStrength,
  handleOTPInput,
  updateAttemptCounter,
  showErrorMessage,
  clearErrorMessage,
  showSuccessMessage,
  clearSuccessMessage,
  setLoadingState,
  passwordRecoveryState
} = window.passwordRecovery || {};

describe('Password Recovery Frontend', () => {
  
  // ============================================================================
  // EMAIL VALIDATION TESTS
  // ============================================================================
  
  describe('Email Validation', () => {
    test('should validate correct email format', () => {
      expect(validateEmail('student@umak.edu.ph')).toBe(true);
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email@domain.co.uk')).toBe(true);
    });
    
    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
    
    test('should reject emails with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('user@ example.com')).toBe(false);
    });
  });
  
  // ============================================================================
  // OTP VALIDATION TESTS
  // ============================================================================
  
  describe('OTP Validation', () => {
    test('should validate correct 6-digit OTP', () => {
      expect(validateOTP('123456')).toBe(true);
      expect(validateOTP('000000')).toBe(true);
      expect(validateOTP('999999')).toBe(true);
    });
    
    test('should validate OTP with spaces', () => {
      expect(validateOTP('123 456')).toBe(true);
      expect(validateOTP('000 000')).toBe(true);
    });
    
    test('should reject OTP with less than 6 digits', () => {
      expect(validateOTP('12345')).toBe(false);
      expect(validateOTP('1234')).toBe(false);
      expect(validateOTP('123')).toBe(false);
    });
    
    test('should reject OTP with more than 6 digits', () => {
      expect(validateOTP('1234567')).toBe(false);
      expect(validateOTP('12345678')).toBe(false);
    });
    
    test('should reject OTP with non-numeric characters', () => {
      expect(validateOTP('12345a')).toBe(false);
      expect(validateOTP('abcdef')).toBe(false);
      expect(validateOTP('123-456')).toBe(false);
    });
    
    test('should reject empty OTP', () => {
      expect(validateOTP('')).toBe(false);
    });
  });
  
  // ============================================================================
  // PASSWORD STRENGTH VALIDATION TESTS
  // ============================================================================
  
  describe('Password Strength Validation', () => {
    test('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
    
    test('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });
    
    test('should reject password without number', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
    
    test('should reject password without special character', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
    
    test('should accept valid strong password', () => {
      const result = validatePasswordStrength('SecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    test('should accept various valid passwords', () => {
      const validPasswords = [
        'MyPassword@123',
        'Secure#Pass2024',
        'Test$Password99',
        'Complex!Pass123'
      ];
      
      validPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      });
    });
  });
  
  // ============================================================================
  // PASSWORD STRENGTH INDICATOR TESTS
  // ============================================================================
  
  describe('Password Strength Indicator', () => {
    test('should calculate weak password strength', () => {
      const strength = calculatePasswordStrength('Pass1');
      expect(strength.score).toBeLessThanOrEqual(2);
      expect(strength.label).toBe('Fair');
    });
    
    test('should calculate fair password strength', () => {
      const strength = calculatePasswordStrength('Password1');
      expect(strength.score).toBeGreaterThanOrEqual(2);
      expect(strength.score).toBeLessThanOrEqual(3);
      expect(strength.label).toBe('Good');
    });
    
    test('should calculate good password strength', () => {
      const strength = calculatePasswordStrength('Password123');
      expect(strength.score).toBeGreaterThanOrEqual(3);
      expect(strength.score).toBeLessThanOrEqual(4);
      expect(strength.label).toBe('Good');
    });
    
    test('should calculate strong password strength', () => {
      const strength = calculatePasswordStrength('Password123!');
      expect(strength.score).toBeGreaterThanOrEqual(4);
      expect(strength.score).toBeLessThanOrEqual(5);
      expect(strength.label).toBe('Very Strong');
    });
    
    test('should calculate very strong password strength', () => {
      const strength = calculatePasswordStrength('VerySecurePassword123!@#');
      expect(strength.score).toBe(5);
      expect(strength.label).toBe('Very Strong');
    });
    
    test('should return appropriate color for strength level', () => {
      const weak = calculatePasswordStrength('Pass1');
      expect(weak.color).toBe('#f97316'); // orange for weak
      
      const strong = calculatePasswordStrength('Password123!');
      expect(strong.color).toBe('#22c55e'); // green for very strong
    });
  });
  
  // ============================================================================
  // STATE MANAGEMENT TESTS
  // ============================================================================
  
  describe('Password Recovery State', () => {
    beforeEach(() => {
      // Reset state before each test
      passwordRecoveryState.currentStep = 'forgot-password';
      passwordRecoveryState.email = '';
      passwordRecoveryState.recoveryToken = '';
      passwordRecoveryState.attemptsRemaining = 5;
      passwordRecoveryState.isLoading = false;
      passwordRecoveryState.errorMessage = '';
      passwordRecoveryState.successMessage = '';
    });
    
    test('should initialize with correct default state', () => {
      expect(passwordRecoveryState.currentStep).toBe('forgot-password');
      expect(passwordRecoveryState.email).toBe('');
      expect(passwordRecoveryState.recoveryToken).toBe('');
      expect(passwordRecoveryState.attemptsRemaining).toBe(5);
      expect(passwordRecoveryState.isLoading).toBe(false);
    });
    
    test('should update state when moving to OTP verification', () => {
      passwordRecoveryState.currentStep = 'otp-verification';
      passwordRecoveryState.email = 'test@example.com';
      passwordRecoveryState.recoveryToken = 'token123';
      
      expect(passwordRecoveryState.currentStep).toBe('otp-verification');
      expect(passwordRecoveryState.email).toBe('test@example.com');
      expect(passwordRecoveryState.recoveryToken).toBe('token123');
    });
    
    test('should update state when moving to password reset', () => {
      passwordRecoveryState.currentStep = 'password-reset';
      
      expect(passwordRecoveryState.currentStep).toBe('password-reset');
    });
    
    test('should track loading state', () => {
      passwordRecoveryState.isLoading = true;
      expect(passwordRecoveryState.isLoading).toBe(true);
      
      passwordRecoveryState.isLoading = false;
      expect(passwordRecoveryState.isLoading).toBe(false);
    });
    
    test('should track error messages', () => {
      const errorMsg = 'Invalid email address';
      passwordRecoveryState.errorMessage = errorMsg;
      expect(passwordRecoveryState.errorMessage).toBe(errorMsg);
    });
    
    test('should track success messages', () => {
      const successMsg = 'OTP sent successfully';
      passwordRecoveryState.successMessage = successMsg;
      expect(passwordRecoveryState.successMessage).toBe(successMsg);
    });
  });
  
  // ============================================================================
  // OTP INPUT FORMATTING TESTS
  // ============================================================================
  
  describe('OTP Input Formatting', () => {
    test('should format OTP with spaces', () => {
      const input = { value: '123456' };
      const event = { target: input };
      
      handleOTPInput(event);
      
      expect(input.value).toBe('123 456');
    });
    
    test('should remove non-numeric characters', () => {
      const input = { value: '12a34b56' };
      const event = { target: input };
      
      handleOTPInput(event);
      
      expect(input.value).toMatch(/^\d{3} \d{3}$/);
    });
    
    test('should limit to 6 digits', () => {
      const input = { value: '1234567890' };
      const event = { target: input };
      
      handleOTPInput(event);
      
      expect(input.value).toBe('123 456');
    });
    
    test('should handle partial input', () => {
      const input = { value: '123' };
      const event = { target: input };
      
      handleOTPInput(event);
      
      expect(input.value).toBe('123');
    });
  });
  
  // ============================================================================
  // ATTEMPT COUNTER TESTS
  // ============================================================================
  
  describe('OTP Attempt Counter', () => {
    beforeEach(() => {
      // Create mock DOM element
      document.body.innerHTML = '<div id="otp-attempts-remaining">5</div>';
    });
    
    test('should update attempt counter display', () => {
      updateAttemptCounter(4);
      const counter = document.getElementById('otp-attempts-remaining');
      expect(counter.textContent).toBe('4');
    });
    
    test('should add warning class when attempts are low', () => {
      updateAttemptCounter(2);
      const counter = document.getElementById('otp-attempts-remaining');
      expect(counter.classList.contains('text-red-400')).toBe(true);
    });
    
    test('should remove warning class when attempts are sufficient', () => {
      updateAttemptCounter(5);
      const counter = document.getElementById('otp-attempts-remaining');
      expect(counter.classList.contains('text-red-400')).toBe(false);
    });
  });
  
  // ============================================================================
  // ERROR MESSAGE TESTS
  // ============================================================================
  
  describe('Error Message Display', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="recovery-error-message" style="display: none;"></div>';
    });
    
    test('should show error message', () => {
      const errorMsg = 'Invalid email address';
      showErrorMessage(errorMsg);
      
      const element = document.getElementById('recovery-error-message');
      expect(element.style.display).toBe('block');
      expect(element.textContent).toBe(errorMsg);
    });
    
    test('should clear error message', () => {
      showErrorMessage('Test error');
      clearErrorMessage();
      
      const element = document.getElementById('recovery-error-message');
      expect(element.style.display).toBe('none');
      expect(element.textContent).toBe('');
    });
    
    test('should update state when showing error', () => {
      const errorMsg = 'Test error';
      showErrorMessage(errorMsg);
      expect(passwordRecoveryState.errorMessage).toBe(errorMsg);
    });
  });
  
  // ============================================================================
  // SUCCESS MESSAGE TESTS
  // ============================================================================
  
  describe('Success Message Display', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="recovery-success-message" style="display: none;"></div>';
    });
    
    test('should show success message', () => {
      const successMsg = 'OTP sent successfully';
      showSuccessMessage(successMsg);
      
      const element = document.getElementById('recovery-success-message');
      expect(element.style.display).toBe('block');
      expect(element.textContent).toBe(successMsg);
    });
    
    test('should clear success message', () => {
      showSuccessMessage('Test success');
      clearSuccessMessage();
      
      const element = document.getElementById('recovery-success-message');
      expect(element.style.display).toBe('none');
      expect(element.textContent).toBe('');
    });
    
    test('should update state when showing success', () => {
      const successMsg = 'Test success';
      showSuccessMessage(successMsg);
      expect(passwordRecoveryState.successMessage).toBe(successMsg);
    });
  });
  
  // ============================================================================
  // LOADING STATE TESTS
  // ============================================================================
  
  describe('Loading State', () => {
    beforeEach(() => {
      document.body.innerHTML = '<button id="test-button">Submit</button>';
    });
    
    test('should set loading state to true', () => {
      setLoadingState(true, 'test-button');
      expect(passwordRecoveryState.isLoading).toBe(true);
    });
    
    test('should set loading state to false', () => {
      setLoadingState(false, 'test-button');
      expect(passwordRecoveryState.isLoading).toBe(false);
    });
    
    test('should disable button when loading', () => {
      const button = document.getElementById('test-button');
      setLoadingState(true, 'test-button');
      expect(button.disabled).toBe(true);
    });
    
    test('should enable button when not loading', () => {
      const button = document.getElementById('test-button');
      setLoadingState(false, 'test-button');
      expect(button.disabled).toBe(false);
    });
  });
});
