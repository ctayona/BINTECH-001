// BinTECH: Intelligent Waste Segregation and Incentive Platform
// Main Express Application Server

const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Helper: Inject Auth Scripts into Template
// ============================================
function serveTemplateWithAuth(templatePath) {
  return (req, res) => {
    let html = fs.readFileSync(path.join(__dirname, 'templates', templatePath), 'utf-8');
    
    // Inject Google Client ID into window
    const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
    const googleScript = `<script>window.GOOGLE_CLIENT_ID = '${googleClientId}';</script>`;
    const authScript = `<script src="/js/auth.js"></script>`;
    
    // Add scripts before closing body tag
    html = html.replace('</body>', `${googleScript}\n${authScript}\n</body>`);
    
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  };
}

// ============================================
// Middleware Configuration
// ============================================

// CORS Middleware
app.use(cors());

// Body Parser Middleware - ONLY for JSON and URL-encoded
// DO NOT apply to routes that handle multipart/form-data
// The key is to NOT parse the request body for multipart requests
// Multer will handle the parsing for those routes

// For JSON requests
app.use((req, res, next) => {
  // Skip if multipart
  if (req.is('multipart/form-data')) {
    return next();
  }
  express.json()(req, res, next);
});

// For URL-encoded requests
app.use((req, res, next) => {
  // Skip if multipart
  if (req.is('multipart/form-data')) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

// Avoid noisy 404 logs for favicon in development.
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Static Files - Serve CSS, JS, Images from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve Templates folder as static HTML UI
app.use(express.static(path.join(__dirname, 'templates')));

// ============================================
// Route Imports (Backend API Routes)
// ============================================

const authRoutes = require('./routes/auth');
const userDashboardRoutes = require('./routes/dashboard');
const rewardsRoutes = require('./routes/rewards');
const adminRoutes = require('./routes/admin');
const qrRoutes = require('./routes/qr');
const wasteSorterRoutes = require('./routes/waste-sorter');

// ============================================
// Route Registration
// ============================================

// Frontend Routes - Serve Template HTML files with Auth Integration
app.get('/', serveTemplateWithAuth('LANDING_PAGE.HTML'));

app.get('/how-it-works', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'HOW_IT_WORKS.HTML'));
});

app.get('/rewards', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'REWARDS.HTML'));
});

// Login Page
app.get('/login', (req, res) => {
  res.redirect('/');
});

// User Dashboard - with auth injection
app.get('/dashboard', serveTemplateWithAuth('USER_DASHBOARD.HTML'));

// User History - with auth injection
app.get('/history', serveTemplateWithAuth('USER_HISTORY.HTML'));

// User Profile - with auth injection
app.get('/profile', serveTemplateWithAuth('USER_PROFILE.HTML'));

// ESP32 Hardware QR Code Scanner - with auth injection
app.get('/qr-scanner', serveTemplateWithAuth('USER_QR_CODE.HTML'));
app.get('/transfer-points', serveTemplateWithAuth('USER_QR_CODE.HTML'));

// Admin Dashboards - HTML pages (frontend JS will protect)
app.get('/admin/dashboard', serveTemplateWithAuth('ADMIN_DASHBOARD.html'));

app.get('/admin/binmanage', serveTemplateWithAuth('ADMIN_BINMANAGE.html'));

app.get('/admin/collection', serveTemplateWithAuth('ADMIN_COLLECTION.html'));

app.get('/admin/rewards', serveTemplateWithAuth('ADMIN_REWARDS.html'));

app.get('/admin/website-logs', serveTemplateWithAuth('ADMIN_WEBSITE_LOGS.html'));
app.get('/admin/website-logs/', serveTemplateWithAuth('ADMIN_WEBSITE_LOGS.html'));
app.get('/admin/website-logs.html', serveTemplateWithAuth('ADMIN_WEBSITE_LOGS.html'));

app.get('/admin/schedule', serveTemplateWithAuth('ADMIN_SCHEDULE.html'));

// Admin Settings
app.get('/admin/settings', serveTemplateWithAuth('ADMIN_SETTINGS.html'));

// Admin Routes Management
app.get('/admin/routes', serveTemplateWithAuth('ADMIN_ROUTES.html'));

// Account Management (head-only policy is enforced in shared frontend guard)
app.get('/admin/accounts', serveTemplateWithAuth('ADMIN_ACCOUNTS.html'));
app.get('/admin/account-management', (req, res) => res.redirect('/admin/accounts'));

// Legacy admin template URLs -> canonical admin routes
app.get('/admin/ADMIN_DASHBOARD.html', (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/ADMIN_REWARDS.html', (req, res) => res.redirect('/admin/rewards'));
app.get('/admin/ADMIN_WEBSITE_LOGS.html', (req, res) => res.redirect('/admin/website-logs'));
app.get('/admin/ADMIN_BINMANAGE.html', (req, res) => res.redirect('/admin/binmanage'));
app.get('/admin/ADMIN_COLLECTION.html', (req, res) => res.redirect('/admin/collection'));
app.get('/admin/ADMIN_SCHEDULE.html', (req, res) => res.redirect('/admin/schedule'));
app.get('/admin/ADMIN_ACCOUNTS.html', (req, res) => res.redirect('/admin/accounts'));
app.get('/admin/ADMIN_SETTINGS.html', (req, res) => res.redirect('/admin/settings'));

// ============================================
// Multer Configuration for File Uploads
// ============================================
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${validTypes.join(', ')}`));
    }
  }
});

// ============================================
// Upload Endpoint for Reward Images
// ============================================
app.post('/api/admin/upload-reward-image', upload.single('file'), async (req, res) => {
  try {
    const supabase = require('./config/supabase');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const adminId = req.body.adminId || 'admin';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueFileName = `reward_${timestamp}_${randomString}.${fileExtension}`;
    
    console.log(`📤 Uploading reward image: ${uniqueFileName}`);
    console.log(`   File size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`   MIME type: ${req.file.mimetype}`);

    // Validate file size one more time
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(413).json({
        success: false,
        message: `File too large. Maximum size is 5MB, but file is ${(req.file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Try multiple bucket names for compatibility
    // Using buckets that are known to exist and have proper permissions
    // PRIMARY: cor-uploads (proven working bucket)
    const bucketNames = ['cor-uploads', 'reward-images', 'profile-pictures', 'rewards'];
    let uploadError = null;
    let uploadResult = null;
    let bucketUsed = null;

    for (const bucketName of bucketNames) {
      try {
        console.log(`Attempting upload to bucket: ${bucketName}`);
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(`rewards/${uniqueFileName}`, req.file.buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: req.file.mimetype
          });

        if (!error) {
          uploadResult = data;
          bucketUsed = bucketName;
          console.log(`✓ Upload successful to bucket: ${bucketName}`);
          break;
        } else {
          uploadError = error;
          console.log(`✗ Bucket ${bucketName} failed:`, error.message);
        }
      } catch (e) {
        console.log(`✗ Bucket ${bucketName} exception:`, e.message);
        uploadError = e;
      }
    }

    if (!uploadResult) {
      console.error('❌ All upload attempts failed:', uploadError?.message);
      return res.status(400).json({
        success: false,
        message: 'Upload failed: ' + (uploadError?.message || 'No available storage buckets'),
        error: uploadError?.message
      });
    }

    // Get public URL (must include the full path with rewards/ folder)
    const { data: publicUrlData } = supabase.storage
      .from(bucketUsed)
      .getPublicUrl(`rewards/${uniqueFileName}`);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`✓ Reward image uploaded: ${publicUrl}`);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      image_url: publicUrl,
      file: {
        name: uniqueFileName,
        size: req.file.size,
        url: publicUrl,
        bucket: bucketUsed
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload: ' + error.message,
      error: error.message
    });
  }
});

// ============================================
// Backend API Routes
// ============================================
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', userDashboardRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/waste-sorter', wasteSorterRoutes);

// ============================================
// 404 Error Handler
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
    status: 404
  });
});

// ============================================
// Error Handler Middleware
// ============================================

// Multer error handler
app.use((err, req, res, next) => {
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer error:', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts in form data'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Handle custom file filter errors
  if (err.message && err.message.includes('Invalid file type')) {
    console.error('❌ File type error:', err.message);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Handle other errors
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║          🌱 BinTECH Server Started Successfully! 🌱               ║
║          Intelligent Waste Segregation & Incentive Platform      ║
║                                                                   ║
║  Server running at: http://0.0.0.0:${PORT}                             ║
║  Network accessible at: http://192.168.254.104:${PORT}                 ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
