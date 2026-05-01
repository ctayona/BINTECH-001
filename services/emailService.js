/**
 * Email Service
 * Handles OTP email delivery and password reset confirmation emails
 * Implements the Email Service Interface from design specifications
 */

const nodemailer = require('nodemailer');

// Initialize email transporter
let transporter = null;

/**
 * Initialize email transporter with SMTP configuration
 * @returns {object} Configured transporter or null if configuration fails
 */
function initializeTransporter() {
  try {
    if (transporter) {
      return transporter;
    }
    
    // Get email configuration from environment variables
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM || emailUser;
    
    console.log('[Email Service] Initializing transporter...');
    console.log(`[Email Service] Host: ${emailHost}`);
    console.log(`[Email Service] Port: ${emailPort}`);
    console.log(`[Email Service] User: ${emailUser ? emailUser.substring(0, 5) + '***' : 'NOT SET'}`);
    
    if (!emailUser || !emailPassword) {
      console.warn('[Email Service] ❌ Email credentials not configured in environment variables');
      console.warn('[Email Service] Set EMAIL_USER and EMAIL_PASSWORD to enable email delivery');
      return null;
    }
    
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });
    
    console.log(`[Email Service] ✓ Transporter initialized for ${emailUser}`);
    return transporter;
  } catch (error) {
    console.error('[Email Service] ❌ Error initializing transporter:', error.message);
    return null;
  }
}

/**
 * Generate OTP email HTML template
 * @param {string} userName - User's first name
 * @param {string} otp - OTP code to display
 * @param {number} expiryMinutes - Minutes until OTP expires
 * @returns {string} HTML email template
 */
function generateOTPEmailTemplate(userName, otp, expiryMinutes = 10) {
  const displayName = userName || 'User';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px 20px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
          }
          .otp-section {
            background-color: #f9f9f9;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .otp-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 4px;
            text-align: center;
            font-family: 'Courier New', monospace;
            margin: 15px 0;
          }
          .otp-expiry {
            font-size: 13px;
            color: #e74c3c;
            text-align: center;
            margin-top: 10px;
          }
          .instructions {
            background-color: #e8f4f8;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
          }
          .instructions li {
            margin: 8px 0;
          }
          .security-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #856404;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
          .footer-link {
            color: #667eea;
            text-decoration: none;
          }
          .footer-link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Recovery</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hi ${displayName},
            </div>
            
            <p>
              We received a request to reset your password. Use the One-Time Password (OTP) below to verify your identity and proceed with resetting your password.
            </p>
            
            <div class="otp-section">
              <div class="otp-label">Your One-Time Password</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">
                ⏱️ This code expires in ${expiryMinutes} minutes
              </div>
            </div>
            
            <div class="instructions">
              <strong>How to use this code:</strong>
              <ol>
                <li>Go to the password recovery page</li>
                <li>Enter your email address</li>
                <li>Paste the OTP code above</li>
                <li>Create a new password</li>
                <li>Confirm your new password</li>
              </ol>
            </div>
            
            <div class="security-note">
              <strong>🔒 Security Notice:</strong> Never share this code with anyone. We will never ask for this code via email or phone. If you didn't request a password reset, please ignore this email and your account will remain secure.
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} BinTECH. All rights reserved.
            </p>
            <p style="margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate password reset confirmation email HTML template
 * @param {string} userName - User's first name
 * @returns {string} HTML email template
 */
function generatePasswordResetConfirmationTemplate(userName) {
  const displayName = userName || 'User';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px 20px;
          }
          .success-icon {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
          }
          .success-message {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #155724;
            text-align: center;
            font-weight: 500;
          }
          .next-steps {
            background-color: #e8f4f8;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
          }
          .next-steps strong {
            display: block;
            margin-bottom: 10px;
          }
          .security-info {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #856404;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
          .footer-link {
            color: #27ae60;
            text-decoration: none;
          }
          .footer-link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Successful</h1>
          </div>
          
          <div class="content">
            <div class="success-icon">✅</div>
            
            <div class="success-message">
              Your password has been successfully reset!
            </div>
            
            <p>
              Hi ${displayName},
            </p>
            
            <p>
              Your password has been successfully updated. You can now log in to your account using your new password.
            </p>
            
            <div class="next-steps">
              <strong>Next Steps:</strong>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Go to the login page</li>
                <li>Enter your email address</li>
                <li>Enter your new password</li>
                <li>Click "Login"</li>
              </ol>
            </div>
            
            <div class="security-info">
              <strong>🔒 Security Reminder:</strong> If you did not request this password reset, please contact our support team immediately. Your account security is important to us.
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} BinTECH. All rights reserved.
            </p>
            <p style="margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @param {string} userName - User's first name (optional)
 * @returns {Promise<boolean>} True if email sent successfully
 */
async function sendOTPEmail(email, otp, userName = null) {
  try {
    const emailTransporter = initializeTransporter();
    
    if (!emailTransporter) {
      console.warn('[Email Service] ⚠️ Email transporter not configured');
      console.warn('[Email Service] 📧 OTP for testing purposes: ' + otp);
      console.warn('[Email Service] 📧 Would be sent to: ' + email);
      // Return true to allow frontend to proceed (for testing without email)
      return true;
    }
    
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const htmlContent = generateOTPEmailTemplate(userName, otp);
    
    const mailOptions = {
      from: emailFrom,
      to: String(email).trim().toLowerCase(),
      subject: 'Password Recovery - One-Time Password (OTP)',
      html: htmlContent,
      text: `Your OTP is: ${otp}. This code expires in 10 minutes.`
    };
    
    console.log(`[Email Service] 📤 Sending OTP email to ${email}`);
    console.log(`[Email Service] From: ${emailFrom}`);
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log(`[Email Service] ✓ OTP email sent successfully to ${email}`);
    console.log(`[Email Service] Message ID: ${info.messageId}`);
    console.log(`[Email Service] Response: ${info.response}`);
    
    return true;
  } catch (error) {
    console.error('[Email Service] ❌ Error sending OTP email:', error.message);
    console.error('[Email Service] Error details:', error);
    return false;
  }
}

/**
 * Send password reset confirmation email
 * @param {string} email - Recipient email address
 * @param {string} userName - User's first name (optional)
 * @returns {Promise<boolean>} True if email sent successfully
 */
async function sendPasswordResetConfirmation(email, userName = null) {
  try {
    const emailTransporter = initializeTransporter();
    
    if (!emailTransporter) {
      console.warn('[Email Service] ⚠️ Email transporter not configured, skipping confirmation email');
      console.warn('[Email Service] 📧 Confirmation would be sent to: ' + email);
      return true; // Return true to allow process to complete
    }
    
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const htmlContent = generatePasswordResetConfirmationTemplate(userName);
    
    const mailOptions = {
      from: emailFrom,
      to: String(email).trim().toLowerCase(),
      subject: 'Password Reset Successful',
      html: htmlContent,
      text: 'Your password has been successfully reset. You can now log in with your new password.'
    };
    
    console.log(`[Email Service] 📤 Sending password reset confirmation to ${email}`);
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log(`[Email Service] ✓ Confirmation email sent successfully to ${email}`);
    console.log(`[Email Service] Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('[Email Service] ❌ Error sending confirmation email:', error.message);
    console.error('[Email Service] Error details:', error);
    return false;
  }
}

/**
 * Verify email transporter connection (for testing)
 * @returns {Promise<boolean>} True if connection is successful
 */
async function verifyConnection() {
  try {
    const emailTransporter = initializeTransporter();
    
    if (!emailTransporter) {
      console.warn('[Email Service] ⚠️ Email transporter not configured');
      return false;
    }
    
    console.log('[Email Service] 🔍 Testing email connection...');
    await emailTransporter.verify();
    console.log('[Email Service] ✓ Email transporter connection verified successfully');
    return true;
  } catch (error) {
    console.error('[Email Service] ❌ Email transporter connection failed:', error.message);
    console.error('[Email Service] Error details:', error);
    return false;
  }
}

/**
 * Generate schedule assignment notification email HTML template
 * @param {string} adminName - Admin's full name
 * @param {object} eventDetails - Event details object
 * @returns {string} HTML email template
 */
function generateScheduleNotificationTemplate(adminName, eventDetails) {
  const displayName = adminName || 'Admin';
  const eventTitle = eventDetails.task || 'Scheduled Event';
  const eventDate = eventDetails.scheduled_at ? new Date(eventDetails.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD';
  const eventStartTime = eventDetails.scheduled_at ? new Date(eventDetails.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD';
  const eventEndTime = eventDetails.end_time ? new Date(eventDetails.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD';
  const eventType = eventDetails.type || 'Collection';
  const eventNotes = eventDetails.notes || 'No additional notes';
  
  // Get bin information if available and type is not "Meeting"
  let binInfo = '';
  if (eventDetails.bin_id && eventType !== 'Meeting') {
    binInfo = eventDetails.bin_label || eventDetails.bin_id || 'N/A';
  }
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #1a3a2f 0%, #2d5a47 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px 20px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
          }
          .event-section {
            background-color: #f9f9f9;
            border-left: 4px solid #3d8b7a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .event-title {
            font-size: 20px;
            font-weight: bold;
            color: #1a3a2f;
            margin-bottom: 15px;
          }
          .event-detail {
            display: flex;
            align-items: flex-start;
            margin: 12px 0;
            font-size: 14px;
          }
          .event-detail-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            flex-shrink: 0;
            text-align: center;
            line-height: 24px;
          }
          .event-detail-content {
            flex: 1;
          }
          .event-detail-label {
            font-weight: 600;
            color: #1a3a2f;
            display: block;
            margin-bottom: 2px;
          }
          .event-detail-value {
            color: #555;
          }
          .action-section {
            background-color: #e8f4f8;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
          }
          .action-section strong {
            display: block;
            margin-bottom: 8px;
            color: #1a3a2f;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
          .footer-link {
            color: #3d8b7a;
            text-decoration: none;
          }
          .footer-link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Schedule Assignment</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hi ${displayName},
            </div>
            
            <p>
              You have been assigned to a new schedule event. Please review the details below.
            </p>
            
            <div class="event-section">
              <div class="event-title">${eventTitle}</div>
              
              <div class="event-detail">
                <div class="event-detail-icon">📅</div>
                <div class="event-detail-content">
                  <span class="event-detail-label">Date</span>
                  <span class="event-detail-value">${eventDate}</span>
                </div>
              </div>
              
              <div class="event-detail">
                <div class="event-detail-icon">🕐</div>
                <div class="event-detail-content">
                  <span class="event-detail-label">Time</span>
                  <span class="event-detail-value">${eventStartTime} - ${eventEndTime}</span>
                </div>
              </div>
              
              <div class="event-detail">
                <div class="event-detail-icon">🏷️</div>
                <div class="event-detail-content">
                  <span class="event-detail-label">Type</span>
                  <span class="event-detail-value">${eventType}</span>
                </div>
              </div>
              
              ${binInfo ? `
              <div class="event-detail">
                <div class="event-detail-icon">📦</div>
                <div class="event-detail-content">
                  <span class="event-detail-label">Bin</span>
                  <span class="event-detail-value">${binInfo}</span>
                </div>
              </div>
              ` : ''}
              
              <div class="event-detail">
                <div class="event-detail-icon">📝</div>
                <div class="event-detail-content">
                  <span class="event-detail-label">Notes</span>
                  <span class="event-detail-value">${eventNotes}</span>
                </div>
              </div>
            </div>
            
            <div class="action-section">
              <strong>What's Next?</strong>
              <p style="margin: 8px 0;">
                Please log in to your admin dashboard to view the full event details and confirm your availability. If you have any questions or conflicts, please contact your administrator.
              </p>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} BinTECH. All rights reserved.
            </p>
            <p style="margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send schedule assignment notification email
 * @param {string} email - Recipient email address
 * @param {string} adminName - Admin's full name
 * @param {object} eventDetails - Event details object
 * @returns {Promise<boolean>} True if email sent successfully
 */
async function sendScheduleNotification(email, adminName, eventDetails) {
  try {
    const emailTransporter = initializeTransporter();
    
    if (!emailTransporter) {
      console.warn('[Email Service] ⚠️ Email transporter not configured, skipping schedule notification');
      console.warn('[Email Service] 📧 Notification would be sent to: ' + email);
      console.warn('[Email Service] 📧 Event: ' + (eventDetails.task || 'Unknown'));
      return true; // Return true to allow process to complete
    }
    
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const htmlContent = generateScheduleNotificationTemplate(adminName, eventDetails);
    
    const mailOptions = {
      from: emailFrom,
      to: String(email).trim().toLowerCase(),
      subject: `Schedule Assignment: ${eventDetails.task || 'New Event'}`,
      html: htmlContent,
      text: `You have been assigned to: ${eventDetails.task || 'New Event'} on ${new Date(eventDetails.scheduled_at).toLocaleDateString()}`
    };
    
    console.log(`[Email Service] 📤 Sending schedule notification to ${email}`);
    console.log(`[Email Service] Event: ${eventDetails.task}`);
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log(`[Email Service] ✓ Schedule notification sent successfully to ${email}`);
    console.log(`[Email Service] Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('[Email Service] ❌ Error sending schedule notification:', error.message);
    console.error('[Email Service] Error details:', error);
    return false;
  }
}

/**
 * Test send an OTP email (for debugging)
 * @param {string} testEmail - Email to send test OTP to
 * @returns {Promise<boolean>} True if test email sent successfully
 */
async function sendTestOTP(testEmail) {
  try {
    console.log('[Email Service] 📧 Sending test OTP to:', testEmail);
    const testOTP = '123456';
    const result = await sendOTPEmail(testEmail, testOTP, 'Test User');
    
    if (result) {
      console.log('[Email Service] ✓ Test OTP sent successfully');
    } else {
      console.log('[Email Service] ❌ Test OTP failed to send');
    }
    
    return result;
  } catch (error) {
    console.error('[Email Service] ❌ Error sending test OTP:', error.message);
    return false;
  }
}

// Export all functions
module.exports = {
  initializeTransporter,
  generateOTPEmailTemplate,
  generatePasswordResetConfirmationTemplate,
  generateScheduleNotificationTemplate,
  sendOTPEmail,
  sendPasswordResetConfirmation,
  sendScheduleNotification,
  verifyConnection,
  sendTestOTP
};
