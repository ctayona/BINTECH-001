// Waste Sorter Routes
// Handles ESP32 hardware session management and point transfers

const express = require('express');
const router = express.Router();
const wasteSorterController = require('../controllers/wasteSorterController');

// ============================================
// SESSION MANAGEMENT ROUTES
// ============================================

// Start a new session with ESP32 hardware
router.post('/session/start', wasteSorterController.startSession);

// Get session status and real-time updates
router.get('/session/:sessionId/status', wasteSorterController.getSessionStatus);

// Transfer points from session to user account
router.post('/session/transfer', wasteSorterController.transferPoints);

// End active session
router.post('/session/end', wasteSorterController.endSession);

// Get user's session history
router.get('/user/:userId/sessions', wasteSorterController.getUserSessions);

// ============================================
// HARDWARE API ROUTES (Called by ESP32)
// ============================================

// Update points earned in active session (called by ESP32)
router.post('/api/session/update', wasteSorterController.updateSessionPoints);

// Get active session info by device ID (called by ESP32)
router.get('/api/device/:deviceId/session', wasteSorterController.getDeviceSession);

// Notify session about bin full (warning from hardware)
router.post('/api/bin-warning', wasteSorterController.binFullWarning);

// Push live bin capacity percentages from ESP32 ultrasonic sensors
router.post('/api/bin-capacity', wasteSorterController.updateBinCapacityTelemetry);

// Aggregate sorting totals for admin analytics
router.get('/analytics/overview', wasteSorterController.getSortingOverview);

module.exports = router;
