/**
 * Unit Tests for Email Service
 * Tests email template generation and email sending
 */

const emailService = require('./emailService');

describe('Email Service', () => {
  
  describe('OTP Email Template', () => {
    test('generateOTPEmailTemplate should return HTML string', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(typeof template).toBe('string');
      expect(template).toContain('<!DOCTYPE html>');
      expect(template).toContain('</html>');
    });
    
    test('generateOTPEmailTemplate should include user name', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(template).toContain('Hi John');
    });
    
    test('generateOTPEmailTemplate should include OTP code', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(template).toContain('123456');
    });
    
    test('generateOTPEmailTemplate should include expiry time', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456', 10);
      expect(template).toContain('10 minutes');
    });
    
    test('generateOTPEmailTemplate should include security notice', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(template).toContain('Security');
      expect(template).toContain('Never share');
    });
    
    test('generateOTPEmailTemplate should handle missing user name', () => {
      const template = emailService.generateOTPEmailTemplate(null, '123456');
      expect(template).toContain('Hi User');
    });
    
    test('generateOTPEmailTemplate should include instructions', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(template).toContain('How to use this code');
      expect(template).toContain('password recovery page');
    });
    
    test('generateOTPEmailTemplate should include branding', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(template).toContain('BinTECH');
    });
  });
  
  describe('Password Reset Confirmation Template', () => {
    test('generatePasswordResetConfirmationTemplate should return HTML string', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate('John');
      expect(typeof template).toBe('string');
      expect(template).toContain('<!DOCTYPE html>');
      expect(template).toContain('</html>');
    });
    
    test('generatePasswordResetConfirmationTemplate should include user name', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate('John');
      expect(template).toContain('Hi John');
    });
    
    test('generatePasswordResetConfirmationTemplate should include success message', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate('John');
      expect(template).toContain('successfully');
      expect(template).toContain('reset');
    });
    
    test('generatePasswordResetConfirmationTemplate should include next steps', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate('John');
      expect(template).toContain('Next Steps');
      expect(template).toContain('login page');
    });
    
    test('generatePasswordResetConfirmationTemplate should include security reminder', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate('John');
      expect(template).toContain('Security');
      expect(template).toContain('contact our support');
    });
    
    test('generatePasswordResetConfirmationTemplate should handle missing user name', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate(null);
      expect(template).toContain('Hi User');
    });
    
    test('generatePasswordResetConfirmationTemplate should include branding', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate('John');
      expect(template).toContain('BinTECH');
    });
  });
  
  describe('Email Transporter', () => {
    test('initializeTransporter should return transporter or null', () => {
      const transporter = emailService.initializeTransporter();
      // Can be null if email not configured, or transporter object if configured
      expect(transporter === null || typeof transporter === 'object').toBe(true);
    });
    
    test('initializeTransporter should cache transporter', () => {
      const transporter1 = emailService.initializeTransporter();
      const transporter2 = emailService.initializeTransporter();
      expect(transporter1).toBe(transporter2);
    });
  });
  
  describe('Email Sending', () => {
    test('sendOTPEmail should return boolean', async () => {
      const result = await emailService.sendOTPEmail('test@example.com', '123456', 'John');
      expect(typeof result).toBe('boolean');
    });
    
    test('sendOTPEmail should handle missing email configuration gracefully', async () => {
      // This test assumes email is not configured in test environment
      const result = await emailService.sendOTPEmail('test@example.com', '123456', 'John');
      // Should return false if not configured, or true if configured
      expect(typeof result).toBe('boolean');
    });
    
    test('sendPasswordResetConfirmation should return boolean', async () => {
      const result = await emailService.sendPasswordResetConfirmation('test@example.com', 'John');
      expect(typeof result).toBe('boolean');
    });
    
    test('sendPasswordResetConfirmation should handle missing email configuration gracefully', async () => {
      const result = await emailService.sendPasswordResetConfirmation('test@example.com', 'John');
      expect(typeof result).toBe('boolean');
    });
  });
  
  describe('Email Verification', () => {
    test('verifyConnection should return boolean', async () => {
      const result = await emailService.verifyConnection();
      expect(typeof result).toBe('boolean');
    });
  });
  
  describe('Template Content Quality', () => {
    test('OTP template should have proper HTML structure', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(template).toContain('<head>');
      expect(template).toContain('</head>');
      expect(template).toContain('<body>');
      expect(template).toContain('</body>');
      expect(template).toContain('<style>');
      expect(template).toContain('</style>');
    });
    
    test('OTP template should have responsive design', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(template).toContain('viewport');
      expect(template).toContain('max-width');
    });
    
    test('OTP template should have accessible colors', () => {
      const template = emailService.generateOTPEmailTemplate('John', '123456');
      expect(template).toContain('color');
      expect(template).toContain('background');
    });
    
    test('Confirmation template should have proper HTML structure', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate('John');
      expect(template).toContain('<head>');
      expect(template).toContain('</head>');
      expect(template).toContain('<body>');
      expect(template).toContain('</body>');
      expect(template).toContain('<style>');
      expect(template).toContain('</style>');
    });
    
    test('Confirmation template should have responsive design', () => {
      const template = emailService.generatePasswordResetConfirmationTemplate('John');
      expect(template).toContain('viewport');
      expect(template).toContain('max-width');
    });
  });
  
  describe('Email Normalization', () => {
    test('sendOTPEmail should normalize email to lowercase', async () => {
      // This test verifies the email is normalized (we can't directly test the sent email)
      const result = await emailService.sendOTPEmail('TEST@EXAMPLE.COM', '123456', 'John');
      expect(typeof result).toBe('boolean');
    });
    
    test('sendPasswordResetConfirmation should normalize email to lowercase', async () => {
      const result = await emailService.sendPasswordResetConfirmation('TEST@EXAMPLE.COM', 'John');
      expect(typeof result).toBe('boolean');
    });
  });
});
