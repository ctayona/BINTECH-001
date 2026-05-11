// Shoutbox Routes
// Handles community forum / live chat routes

const express = require('express');
const router = express.Router();
const shoutboxController = require('../controllers/shoutboxController');

// ============================================
// SHOUTBOX ROUTES
// ============================================

// Get messages
router.get('/messages', shoutboxController.getMessages);

// Post new message
router.post('/messages', shoutboxController.postMessage);

// Edit message
router.put('/messages/:message_id', shoutboxController.editMessage);

// Delete message (admin moderation)
router.delete('/messages/:message_id', shoutboxController.deleteMessage);

module.exports = router;
