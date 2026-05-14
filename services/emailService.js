// Email Service for BinTECH using SendGrid
// Handles sending confirmation emails, password reset emails, OTP, etc.
// Works for both umak.edu.ph and regular Gmail users

const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// SendGrid Configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'bintechman@gmail.com';
const SENDER_NAME = process.env.SENDER_NAME || 'BinTECH';

console.log('[Email Service] SendGrid Configuration:');
console.log('  SENDGRID_API_KEY:', SENDGRID_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('  SENDER_EMAIL:', SENDER_EMAIL);
console.log('  SENDER_NAME:', SENDER_NAME);

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[Email Service] ✅ SendGrid initialized successfully');
} else {
  console.warn('[Email Service] ⚠️ SENDGRID_API_KEY not set - email sending disabled');
}

/**
 * Send email using SendGrid
 * @param {string} to - Recipient email (supports both umak.edu.ph and gmail)
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @param {string} text - Plain text email body
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmailViaSendGrid(to, subject, html, text) {
  if (!SENDGRID_API_KEY) {
    console.warn('[Email Service] ⚠️ SendGrid not configured; skipping email to', to);
    return false;
  }

  try {
    const msg = {
      to: String(to).trim().toLowerCase(),
      from: {
        email: SENDER_EMAIL,
        name: SENDER_NAME
      },
      subject,
      html,
      text,
      mailSettings: {
        sandboxMode: {
          enable: false // Set to true for testing without sending
        }
      },
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: false
        }
      }
    };

    console.log(`[Email Service] 📧 Sending email to ${to} via SendGrid...`);
    const response = await sgMail.send(msg);
    
    console.log(`[Email Service] ✅ Email sent successfully to ${to}`);
    console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] ❌ Failed to send email to ${to}:`, error && error.message ? error.message : error);
    if (error.response) {
      console.error('[Email Service] SendGrid Response:', error.response.body);
    }
    return false;
  }
}

/**
 * Generate OTP email HTML template (works for all users)
 * @param {string} firstName - User's first name
 * @param {string} otp - One-time password
 * @returns {string} - HTML email template
 */
function generateOTPEmailTemplate(firstName, otp) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0f3b2e 0%, #1f4f3b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; border: 3px solid #d4e157; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; }
          .otp-code { font-size: 48px; letter-spacing: 8px; font-weight: bold; color: #0f3b2e; font-family: 'Courier New', monospace; }
          .otp-label { color: #666; font-size: 14px; margin-top: 10px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; color: #856404; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .divider { border: 0; border-top: 1px solid #ddd; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Recovery Code</h1>
          </div>
          
          <div class="content">
            <p>Hi <strong>${firstName}</strong>,</p>
            
            <p>We received a request to reset your BinTECH password. Here's your one-time password (OTP):</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-label">Valid for 10 minutes</div>
            </div>
            
            <p>Enter this code in the password recovery form to proceed with resetting your password.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you didn't request this password reset, please ignore this email or contact our support team immediately.
            </div>
            
            <p style="color: #666; font-size: 12px;">
              This OTP will expire in 10 minutes for security reasons. Do not share this code with anyone.
            </p>
            
            <p>If you have any questions, feel free to reach out to our support team.<br><strong>The BinTECH Team</strong></p>
            
            <hr class="divider">
            
            <p style="font-size: 11px; color: #999;">
              BinTECH - Smart Waste Sorting & Rewards Platform<br>
              University of Makati | <a href="https://bintech.umak.edu.ph" style="color: #0f3b2e; text-decoration: none;">bintech.umak.edu.ph</a>
            </p>
            
            <p style="font-size: 10px; color: #ccc; text-align: center; margin-top: 20px;">
              💡 <strong>Missing this email?</strong> If this email landed in your spam or promotions folder, please mark it as "Not Spam" or "Move to Inbox" to ensure you receive important BinTECH updates.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2024 BinTECH - University of Makati. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateSignupOTPEmailTemplate(firstName, otp) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0f3b2e 0%, #1f4f3b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; border: 3px solid #d4e157; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; }
          .otp-code { font-size: 48px; letter-spacing: 8px; font-weight: bold; color: #0f3b2e; font-family: 'Courier New', monospace; }
          .otp-label { color: #666; font-size: 14px; margin-top: 10px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; color: #856404; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .divider { border: 0; border-top: 1px solid #ddd; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Verify Your BinTECH Account</h1>
          </div>

          <div class="content">
            <p>Hi <strong>${firstName}</strong>,</p>

            <p>Use this one-time password (OTP) to verify your email before your BinTECH account is created:</p>

            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-label">Valid for 10 minutes</div>
            </div>

            <p>Enter this code in the signup verification form to finish creating your account.</p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you did not request this signup verification, you can ignore this email.
            </div>

            <p style="color: #666; font-size: 12px;">
              This OTP will expire in 10 minutes for security reasons. Do not share this code with anyone.
            </p>

            <p>If you have any questions, feel free to reach out to our support team.<br><strong>The BinTECH Team</strong></p>

            <hr class="divider">

            <p style="font-size: 11px; color: #999;">
              BinTECH - Smart Waste Sorting & Rewards Platform<br>
              University of Makati | <a href="https://bintech.umak.edu.ph" style="color: #0f3b2e; text-decoration: none;">bintech.umak.edu.ph</a>
            </p>
          </div>

          <div class="footer">
            <p>© 2024 BinTECH - University of Makati. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send welcome email after signup
 * @param {string} email - User's email address (umak.edu.ph or gmail)
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - Success status
 */
async function sendSignupWelcomeEmail(email, firstName) {
  try {
    const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0f3b2e 0%, #1f4f3b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #d4e157; color: #0f3b2e; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #e8f5a8; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .features { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .feature-item { display: flex; align-items: center; margin: 15px 0; }
            .feature-icon { font-size: 24px; margin-right: 15px; }
            .feature-text { flex: 1; }
            .divider { border: 0; border-top: 1px solid #ddd; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to BinTECH!</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${firstName}</strong>,</p>
              
              <p>Thank you for signing up for <strong>BinTECH</strong> - the Smart Waste Sorting & Rewards Platform!</p>
              
              <p>Your account has been created successfully and you're ready to start earning <strong>EcoPoints</strong> by sorting waste responsibly.</p>
              
              <div style="text-align: center;">
                <a href="${dashboardLink}" class="button">🚀 Go to Dashboard</a>
              </div>
              
              <div class="features">
                <h3 style="color: #0f3b2e;">🌱 What You Can Do Now:</h3>
                
                <div class="feature-item">
                  <div class="feature-icon">♻️</div>
                  <div class="feature-text">
                    <strong>Sort Waste</strong><br>
                    Use our smart kiosks to sort waste and get instant feedback
                  </div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">⭐</div>
                  <div class="feature-text">
                    <strong>Earn EcoPoints</strong><br>
                    Collect points for every item you sort correctly
                  </div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">🎁</div>
                  <div class="feature-text">
                    <strong>Redeem Rewards</strong><br>
                    Exchange your EcoPoints for exciting rewards
                  </div>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">📊</div>
                  <div class="feature-text">
                    <strong>Track Impact</strong><br>
                    Monitor your environmental contribution and rankings
                  </div>
                </div>
              </div>
              
              <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
              
              <p>Happy sorting and thank you for helping us create a more sustainable future!<br><strong>The BinTECH Team</strong></p>
              
              <hr class="divider">
              
              <p style="font-size: 11px; color: #999;">
                BinTECH - Smart Waste Sorting & Rewards Platform<br>
                University of Makati | <a href="https://bintech.umak.edu.ph" style="color: #0f3b2e; text-decoration: none;">bintech.umak.edu.ph</a>
              </p>
              
              <p style="font-size: 10px; color: #ccc; text-align: center; margin-top: 20px;">
                💡 <strong>Missing this email?</strong> If this email landed in your spam or promotions folder, please mark it as "Not Spam" or "Move to Inbox" to ensure you receive important BinTECH updates.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 BinTECH - University of Makati. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Welcome to BinTECH!

Hi ${firstName},

Thank you for signing up for BinTECH - the Smart Waste Sorting & Rewards Platform!

Your account has been created successfully and you're ready to start earning EcoPoints.

Go to your dashboard: ${dashboardLink}

What You Can Do Now:
• Sort Waste - Use our smart kiosks to sort waste
• Earn EcoPoints - Collect points for every item you sort correctly
• Redeem Rewards - Exchange your EcoPoints for exciting rewards
• Track Impact - Monitor your environmental contribution

Happy sorting!
The BinTECH Team

---
BinTECH - University of Makati
    `;

    return await sendEmailViaSendGrid(email, '🎉 Welcome to BinTECH - Your Account is Ready!', htmlContent, textContent);
  } catch (error) {
    console.error('❌ Error in sendSignupWelcomeEmail:', error && error.message ? error.message : error);
    return false;
  }
}

/**
 * Send OTP email for password recovery
 * @param {string} email - User's email address
 * @param {string} otp - One-time password (6 digits)
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - Success status
 */
async function sendOTPEmail(email, otp, firstName) {
  try {
    const htmlContent = generateOTPEmailTemplate(firstName, otp);
    const textContent = `Your OTP is: ${otp}. This code expires in 10 minutes. Do not share this with anyone.`;

    return await sendEmailViaSendGrid(email, '🔐 Your BinTECH Password Recovery Code', htmlContent, textContent);
  } catch (error) {
    console.error('❌ Error in sendOTPEmail:', error && error.message ? error.message : error);
    return false;
  }
}

async function sendSignupOTPEmail(email, otp, firstName) {
  try {
    const htmlContent = generateSignupOTPEmailTemplate(firstName, otp);
    const textContent = `Your signup verification code is: ${otp}. This code expires in 10 minutes. Do not share this with anyone.`;

    return await sendEmailViaSendGrid(email, '🔐 Verify Your BinTECH Account', htmlContent, textContent);
  } catch (error) {
    console.error('❌ Error in sendSignupOTPEmail:', error && error.message ? error.message : error);
    return false;
  }
}

/**
 * Send password reset confirmation email
 * @param {string} email - User's email address
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - Success status
 */
async function sendPasswordResetConfirmation(email, firstName) {
  try {
    const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0f3b2e 0%, #1f4f3b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; color: #155724; }
            .button { display: inline-block; background: #d4e157; color: #0f3b2e; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #e8f5a8; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .info-box { background: white; border-left: 4px solid #d4e157; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .divider { border: 0; border-top: 1px solid #ddd; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Reset Successful</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${firstName}</strong>,</p>
              
              <div class="success-box">
                <strong>Your password has been reset successfully!</strong>
              </div>
              
              <p>You can now log in to your BinTECH account with your new password.</p>
              
              <div style="text-align: center;">
                <a href="${loginLink}" class="button">🔐 Go to Login</a>
              </div>
              
              <div class="info-box">
                <p><strong>ℹ️ Important:</strong></p>
                <p>If you didn't reset your password, please change it immediately and contact our support team.</p>
              </div>
              
              <p style="color: #666; font-size: 12px;">
                For security reasons, do not share your password with anyone, including our support staff.
              </p>
              
              <p>If you need further assistance, please contact us.<br><strong>The BinTECH Team</strong></p>
              
              <hr class="divider">
              
              <p style="font-size: 11px; color: #999;">
                BinTECH - Smart Waste Sorting & Rewards Platform<br>
                University of Makati | <a href="https://bintech.umak.edu.ph" style="color: #0f3b2e; text-decoration: none;">bintech.umak.edu.ph</a>
              </p>
              
              <p style="font-size: 10px; color: #ccc; text-align: center; margin-top: 20px;">
                💡 <strong>Missing this email?</strong> If this email landed in your spam or promotions folder, please mark it as "Not Spam" or "Move to Inbox" to ensure you receive important BinTECH updates.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 BinTECH - University of Makati. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Password Reset Successful

Hi ${firstName},

Your password has been reset successfully! You can now log in to your BinTECH account with your new password.

Go to Login: ${loginLink}

Important: If you didn't reset your password, please change it immediately and contact our support team.

The BinTECH Team

---
BinTECH - University of Makati
    `;

    return await sendEmailViaSendGrid(email, '✅ Your BinTECH Password Has Been Reset', htmlContent, textContent);
  } catch (error) {
    console.error('❌ Error in sendPasswordResetConfirmation:', error && error.message ? error.message : error);
    return false;
  }
}

/**
 * Send generic email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmail(to, subject, html, text) {
  return await sendEmailViaSendGrid(to, subject, html, text);
}

/**
 * Wrapper for welcome email (legacy)
 */
async function sendWelcomeEmail(email, firstName) {
  return sendSignupWelcomeEmail(email, firstName);
}

module.exports = {
  sendEmailViaSendGrid,
  sendSignupWelcomeEmail,
  sendOTPEmail,
  sendSignupOTPEmail,
  sendPasswordResetConfirmation,
  sendEmail,
  sendWelcomeEmail
};
