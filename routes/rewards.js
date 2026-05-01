// Rewards Routes
// Handles rewards management, listing, and redemption

const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewardsController');
const nodemailer = require('nodemailer');

// ============================================
// REWARDS ROUTES
// ============================================

// Get all available rewards (View Page)
router.get('/', rewardsController.getAllRewards);

// Get all available rewards (API)
router.get('/list', rewardsController.getRewardsAPI);

// Get rewards by category
router.get('/category/:category', rewardsController.getRewardsByCategory);

// Get reward details
router.get('/:id', rewardsController.getRewardDetails);

// Redeem a reward (user)
router.post('/:id/redeem', rewardsController.redeemReward);

// Get user redemption history
router.get('/user/history', rewardsController.getRedemptionHistory);

// Peer transfer - Share EcoPoints
router.post('/transfer/peer', rewardsController.transferEcoPoints);

// Send coupon email
router.post('/send-coupon', async (req, res) => {
  try {
    const { email, couponCode, rewardName, expiryDate } = req.body;

    // Validate inputs
    if (!email || !couponCode || !rewardName || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });

    // Email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0F3B2E; font-family: 'Playfair Display', serif; margin-bottom: 20px;">BinTECH Reward Coupon</h1>
          
          <p style="color: #0F3B2E; font-size: 16px; margin-bottom: 20px;">Congratulations! Your reward coupon has been generated.</p>
          
          <div style="background-color: #E8ECEB; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 2px dashed #5DAE60;">
            <p style="color: #0F3B2E; margin: 0 0 10px 0; font-weight: bold;">Reward:</p>
            <p style="color: #0F3B2E; font-size: 24px; margin: 0 0 20px 0; font-weight: bold;">${rewardName}</p>
            
            <p style="color: #0F3B2E; margin: 0 0 5px 0; font-weight: bold;">Coupon Code:</p>
            <p style="color: #5DAE60; font-size: 28px; margin: 0 0 20px 0; font-family: monospace; font-weight: bold;">${couponCode}</p>
            
            <p style="color: #0F3B2E; margin: 0; font-size: 14px;">Expires: ${expiryDate}</p>
          </div>
          
          <div style="background-color: #f0f8f0; border-left: 4px solid #5DAE60; padding: 15px; margin-bottom: 20px;">
            <p style="color: #0F3B2E; margin: 0;">Please use this coupon code to claim your reward. Keep this email for your records.</p>
          </div>
          
          <p style="color: #0F3B2E; font-size: 14px; margin-bottom: 30px;">Thank you for using BinTECH! Keep contributing to a greener planet.</p>
          
          <p style="color: #0F3B2E; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@bintech.com',
      to: email,
      subject: `Your BinTECH Reward Coupon: ${couponCode}`,
      html: htmlContent
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: 'Coupon email sent successfully',
      couponCode: couponCode 
    });

  } catch (error) {
    console.error('Error sending coupon email:', error);
    res.status(500).json({ 
      error: 'Failed to send coupon email',
      details: error.message 
    });
  }
});

// ============================================
// Comprehensive redemption - Process full redemption with points, inventory, and email
// ============================================

// Diagnostic endpoint to verify server is running latest code
router.post('/process-redemption-test', (req, res) => {
  console.log('[DIAGNOSTIC] Testing process-redemption endpoint');
  console.log('[DIAGNOSTIC] Request body:', JSON.stringify(req.body, null, 2));
  res.json({
    success: true,
    message: 'Diagnostic test successful',
    receivedBody: req.body,
    receivedFields: Object.keys(req.body)
  });
});

router.post('/process-redemption', (req, res, next) => {
  console.log('[REWARDS API] POST /process-redemption');
  console.log('[REWARDS API] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[REWARDS API] Request headers:', req.headers);
  next();
}, rewardsController.processRedemption);

module.exports = router;
