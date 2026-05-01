// QR Code Routes
// Handles QR code scanning and point crediting

const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');

// ============================================
// QR CODE ROUTES
// ============================================

// Process QR code scan and credit points
router.post('/scan', qrController.processQRScan);

// Get QR scan history
router.get('/history', qrController.getScanHistory);

// Verify QR code validity
router.post('/verify', qrController.verifyQRCode);

module.exports = router;
