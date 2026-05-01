// Admin Routes
// Handles admin dashboard and administrative operations

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const rewardsController = require('../controllers/rewardsController');
const { checkAdminAuth } = require('../middleware/adminAuth');

// ============================================
// APPLY ADMIN AUTH MIDDLEWARE TO ALL ROUTES
// ============================================
// All admin routes require authentication and admin role
router.use(checkAdminAuth);

// ============================================
// ADMIN ROUTES
// ============================================

// Admin Dashboard
router.get('/', adminController.getDashboard);

// Admin Dashboard Summary API (for fetching real-time data)
router.get('/summary', adminController.getDashboardSummary);
router.get('/sorting-overview', adminController.getSortingOverview);

// Bin Management
router.get('/bin-management', adminController.getBinManagement);
router.get('/bins', adminController.getBinManagement);  // API endpoint for frontend
router.get('/machine-sessions/:machineId/logs', adminController.getMachineSessionLogs);
router.post('/bin-management', adminController.addBin);
router.post('/bins', adminController.addBin);  // API endpoint for frontend
router.put('/bin-management/:id', adminController.updateBin);
router.put('/bins/:id', adminController.updateBin);  // API endpoint for frontend
router.delete('/bin-management/:id', adminController.deleteBin);
router.delete('/bins/:id', adminController.deleteBin);  // API endpoint for frontend

// Collection Logs
router.get('/collection-logs', adminController.getCollectionLogs);
router.post('/collection-logs', adminController.addCollectionLog);

// Website Logs
router.get('/website-logs', adminController.getWebsiteLogs);
router.get('/website-logs/', adminController.getWebsiteLogs);

// Collections (New Schema - with waste tracking and admin assignment)
router.get('/collections', adminController.getCollections);

// Rewards Management (API Endpoints)
router.get('/rewards', rewardsController.adminGetAllRewards);
router.post('/rewards', rewardsController.adminCreateReward);
router.put('/rewards/:id', rewardsController.adminUpdateReward);
router.delete('/rewards/:id', rewardsController.adminDeleteReward);

// Users (for assignee dropdowns, etc.)
router.get('/users', adminController.getAssignableUsers);

// Admin Accounts (for schedule assignments - from admin_accounts table)
router.get('/admins', adminController.getAdminAccounts);
router.get('/settings', adminController.getAdminSettings);
router.put('/settings', adminController.updateAdminSettings);
router.get('/accounts-overview', adminController.getAccountsOverview);

// Admin Accounts Archival - MUST come before /accounts/:email to avoid route conflicts
router.post('/accounts/:id/archive', adminController.archiveAdminAccount);
router.get('/accounts/archive-history', adminController.getArchiveHistory);
router.get('/accounts/archive-history/:archive_id', adminController.getArchiveSnapshot);
router.post('/accounts/archive-history/:archive_id/restore', adminController.restoreArchivedAccount);

// Generic account routes - MUST come after specific archive routes
router.get('/accounts/:email', adminController.getAccountDetails);
router.put('/accounts/:email', adminController.updateAccountDetails);
router.delete('/accounts/:email', adminController.deleteUserAccount);
router.post('/accounts/:email/convert', adminController.convertAccountType);
router.post('/accounts', adminController.createAccount);

// User Points Management
router.put('/user-points/:email', adminController.updateUserPoints);

// Schedule Management
router.get('/schedule', adminController.getSchedule);
router.post('/schedule', adminController.addSchedule);
router.put('/schedule/:id', adminController.updateSchedule);
router.delete('/schedule/:id', adminController.deleteSchedule);

// User Role Management (admin only)
router.get('/users/all', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:email', adminController.deleteUserAccount);

module.exports = router;
