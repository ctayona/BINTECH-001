// User Dashboard Routes
// Handles user dashboard, waste tracking, and personal data

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// ============================================
// USER DASHBOARD ROUTES
// ============================================

// User Dashboard View
router.get('/', dashboardController.getDashboard);

// Get user stats (points, waste disposed, etc.)
router.get('/stats', dashboardController.getUserStats);

// Get waste disposal history
router.get('/history', dashboardController.getDisposalHistory);

// Get user transaction history (peer transfers, admin adjustments, etc.)
router.get('/transaction-history', dashboardController.getTransactionHistory);

// Get combined user activity overview (redemptions, sessions, transfers, totals)
router.get('/activity-overview', dashboardController.getActivityOverview);

// Get user leaderboard position
router.get('/leaderboard', dashboardController.getLeaderboardPosition);

// Get user points
router.get('/points', dashboardController.getUserPoints);

module.exports = router;
