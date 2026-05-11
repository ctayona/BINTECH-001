// Authentication Routes
// Handles user registration, login, and logout

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const uploadController = require('../controllers/uploadController');
const passwordRecoveryController = require('../controllers/passwordRecoveryController');

// Configure multer for in-memory file storage (no disk I/O)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// User Registration
router.post('/register', authController.register);

// User Login
router.post('/login', authController.login);

// User Logout
router.post('/logout', authController.logout);

// Google OAuth Login
router.post('/google-login', authController.googleLogin);

// Get User Profile Data (for profile page)
router.post('/get-profile', authController.getProfile);

// Update User Profile (for profile page)
router.post('/update-profile', authController.updateProfile);

// Upload File to Supabase Storage (multipart/form-data)
router.post('/upload', upload.single('file'), uploadController.uploadFile);

// Test endpoint to verify upload route is working
router.post('/upload-test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload route is working',
    headers: req.headers,
    body: req.body,
    file: req.file ? 'File received' : 'No file'
  });
});

// ============================================
// PASSWORD RECOVERY ROUTES
// ============================================

// Initiate password recovery (send OTP to email)
router.post('/forgot-password', passwordRecoveryController.forgotPassword);

// Verify OTP code
router.post('/verify-otp', passwordRecoveryController.verifyOTP);

// Reset password after OTP verification
router.post('/reset-password', passwordRecoveryController.resetPassword);

// DEBUG: Check all emails in database
router.get('/debug/check-emails', async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    const { data: allEmails, error } = await supabase
      .from('user_accounts')
      .select('email, system_id, created_at, role');
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    console.log('DEBUG: All emails in database:');
    console.log(allEmails);
    
    res.json({
      total: allEmails.length,
      emails: allEmails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Test email service
router.get('/debug/test-email', async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    
    console.log('[DEBUG] Testing email service...');
    
    // Test connection
    const connectionOk = await emailService.verifyConnection();
    
    if (!connectionOk) {
      return res.status(500).json({
        success: false,
        message: 'Email service connection failed',
        details: 'Check console logs for details'
      });
    }
    
    // Send test OTP
    const testEmail = req.query.email || 'test@example.com';
    const emailSent = await emailService.sendTestOTP(testEmail);
    
    res.json({
      success: emailSent,
      message: emailSent ? 'Test email sent successfully' : 'Failed to send test email',
      testEmail: testEmail,
      details: 'Check console logs for details'
    });
  } catch (error) {
    console.error('[DEBUG] Error testing email:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email service',
      error: error.message
    });
  }
});

module.exports = router;
