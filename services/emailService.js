// Email Service for BinTECH
// Handles sending confirmation emails, password reset emails, etc.

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter only when SMTP credentials are provided
let transporter = null;
function createTransporterIfConfigured() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) {
    console.warn('[Email Service] ⚠️ SMTP credentials not set - email sending disabled');
    return null;
  }

  try {
    const t = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: { user, pass }
    });

    t.verify((error) => {
      if (error) console.error('[Email Service] ❌ Transporter verify failed:', error && error.message ? error.message : error);
      else console.log('[Email Service] ✅ Email transporter ready');
    });

    return t;
  } catch (err) {
    console.error('[Email Service] ❌ Failed to create transporter:', err && err.message ? err.message : err);
    return null;
  }
}

transporter = createTransporterIfConfigured();

/**
 * Send simple welcome email after signup
 * @param {string} email - User's email address
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - Success status
 */
async function sendSignupWelcomeEmail(email, firstName) {
  try {
    const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    
    const mailOptions = {
      from: `BinTECH <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to BinTECH - Thank You for Signing Up!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to BinTECH!</h1>
              </div>
              
              <div class="content">
                <p>Hi <strong>${firstName}</strong>,</p>
                
                <p>Thank you for signing up for BinTECH - the Smart Waste Sorting & Rewards Platform!</p>
                
                <p>Your account has been created successfully and you're ready to start earning EcoPoints by sorting waste responsibly.</p>
                
                <div style="text-align: center;">
                  <a href="${dashboardLink}" class="button">Go to Dashboard</a>
                </div>
                
                <div class="features">
                  <h3>🌱 What You Can Do Now:</h3>
                  
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
                      Monitor your environmental contribution
                    </div>
                  </div>
                </div>
                
                <p>If you have any questions or need help, don't hesitate to contact our support team.</p>
                
                <p>Happy sorting!<br><strong>The BinTECH Team</strong></p>
              </div>
              
              <div class="footer">
                <p>© 2024 BinTECH - University of Makati. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
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
      `
    };
    
    if (!transporter) {
      console.warn('[Email Service] ⚠️ SMTP not configured; skipping welcome email to', email);
      return true;
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to', email);
      console.log('   Message ID:', info && info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email to', email, '-', error && error.message ? error.message : error);
      console.error(error && error.stack ? error.stack : 'No stack available');
      return false;
    }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} firstName - User's first name
 * @param {string} resetToken - Password reset token
 * @returns {Promise<boolean>} - Success status
 */
async function sendPasswordResetEmail(email, firstName, resetToken) {
  try {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `BinTECH <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your BinTECH Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0f3b2e 0%, #1f4f3b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #d4e157; color: #0f3b2e; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
              .button:hover { background: #e8f5a8; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px; color: #721c24; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              
              <div class="content">
                <p>Hi <strong>${firstName}</strong>,</p>
                
                <p>We received a request to reset your BinTECH password. Click the button below to create a new password:</p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                
                <p style="text-align: center; color: #666; font-size: 12px;">
                  Or copy and paste this link in your browser:<br>
                  <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; word-break: break-all;">
                    ${resetLink}
                  </code>
                </p>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </div>
                
                <p>For security reasons, we never send passwords via email. If you need further assistance, please contact our support team.</p>
                
                <p>Best regards,<br><strong>The BinTECH Team</strong></p>
              </div>
              
              <div class="footer">
                <p>© 2024 BinTECH - University of Makati. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Password Reset Request

Hi ${firstName},

We received a request to reset your BinTECH password. Click the link below to create a new password:

${resetLink}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
The BinTECH Team
      `
    };
    
    if (!transporter) {
      console.warn('[Email Service] ⚠️ SMTP not configured; skipping password reset email to', email);
      return true;
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent to', email);
      console.log('   Message ID:', info && info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email to', email, '-', error && error.message ? error.message : error);
      console.error(error && error.stack ? error.stack : 'No stack available');
      return false;
    }
}

/**
 * Send welcome email after email verification
 * @param {string} email - User's email address
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - Success status
 */
async function sendWelcomeEmail(email, firstName) {
  try {
    const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    
    const mailOptions = {
      from: `BinTECH <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to BinTECH - Start Earning EcoPoints!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to BinTECH!</h1>
              </div>
              
              <div class="content">
                <p>Hi <strong>${firstName}</strong>,</p>
                
                <p>Your email has been verified! Your BinTECH account is now fully activated and ready to use.</p>
                
                <div style="text-align: center;">
                  <a href="${dashboardLink}" class="button">Go to Dashboard</a>
                </div>
                
                <div class="features">
                  <h3>🌱 What You Can Do Now:</h3>
                  
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
                      Monitor your environmental contribution
                    </div>
                  </div>
                </div>
                
                <p>If you have any questions or need help, don't hesitate to contact our support team.</p>
                
                <p>Happy sorting!<br><strong>The BinTECH Team</strong></p>
              </div>
              
              <div class="footer">
                <p>© 2024 BinTECH - University of Makati. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to BinTECH!

Hi ${firstName},

Your email has been verified! Your BinTECH account is now fully activated.

Go to your dashboard: ${dashboardLink}

What You Can Do Now:
• Sort Waste - Use our smart kiosks to sort waste
• Earn EcoPoints - Collect points for every item you sort correctly
• Redeem Rewards - Exchange your EcoPoints for exciting rewards
• Track Impact - Monitor your environmental contribution

Happy sorting!
The BinTECH Team
      `
    };
    
    if (!transporter) {
      console.warn('[Email Service] ⚠️ SMTP not configured; skipping welcome email to', email);
      return true;
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to', email);
      console.log('   Message ID:', info && info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email to', email, '-', error && error.message ? error.message : error);
      console.error(error && error.stack ? error.stack : 'No stack available');
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
    // If transporter not configured, log OTP for debugging and return success
    if (!transporter) {
      console.warn('[Email Service] ⚠️ SMTP not configured; skipping OTP send');
      console.warn('[Email Service] 📧 OTP for testing purposes:', otp);
      console.warn('[Email Service] 📧 Would be sent to:', email);
      return true;
    }

    const mailOptions = {
      from: `BinTECH <${process.env.EMAIL_USER}>`,
      to: String(email).trim().toLowerCase(),
      subject: 'Your BinTECH Password Recovery Code',
      html: generateOTPEmailTemplate(firstName, otp),
      text: `Your OTP is: ${otp}. This code expires in 10 minutes.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent to', email);
    console.log('   Message ID:', info && info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email to', email, '-', error && error.message ? error.message : error);
    console.error(error && error.stack ? error.stack : 'No stack available');
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
    
    const mailOptions = {
      from: `BinTECH <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your BinTECH Password Has Been Reset Successfully',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0f3b2e 0%, #1f4f3b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
              .success-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; color: #155724; }
              .button { display: inline-block; background: #d4e157; color: #0f3b2e; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
              .button:hover { background: #e8f5a8; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .info-box { background: white; border-left: 4px solid #d4e157; padding: 15px; margin: 20px 0; border-radius: 4px; }
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
                  <a href="${loginLink}" class="button">Go to Login</a>
                </div>
                
                <div class="info-box">
                  <strong>📝 What's Next?</strong>
                  <ul>
                    <li>Log in with your new password</li>
                    <li>Start sorting waste and earning EcoPoints</li>
                    <li>Redeem your rewards</li>
                  </ul>
                </div>
                
                <p><strong>Security Tip:</strong> Keep your password secure and never share it with anyone. If you didn't reset your password, please contact our support team immediately.</p>
                
                <p>Thank you for using BinTECH!<br><strong>The BinTECH Team</strong></p>
              </div>
              
              <div class="footer">
                <p>© 2024 BinTECH - University of Makati. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Password Reset Successful

Hi ${firstName},

Your password has been reset successfully!

You can now log in to your BinTECH account with your new password.

Go to login: ${loginLink}

What's Next?
• Log in with your new password
• Start sorting waste and earning EcoPoints
• Redeem your rewards

Security Tip: Keep your password secure and never share it with anyone.

Thank you for using BinTECH!
The BinTECH Team
      `
    };
    
    if (!transporter) {
      console.warn('[Email Service] ⚠️ SMTP not configured; skipping password reset confirmation to', email);
      return true;
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset confirmation email sent to', email);
      console.log('   Message ID:', info && info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset confirmation email to', email, '-', error && error.message ? error.message : error);
      console.error(error && error.stack ? error.stack : 'No stack available');
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
  try {
    const mailOptions = {
      from: `BinTECH <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text
    };
    
    if (!transporter) {
      console.warn('[Email Service] ⚠️ SMTP not configured; skipping generic email to', to);
      return true;
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent to', to);
      console.log('   Message ID:', info && info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email to', to, '-', error && error.message ? error.message : error);
      console.error(error && error.stack ? error.stack : 'No stack available');
      return false;
    }
}

module.exports = {
  sendSignupWelcomeEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
  sendPasswordResetConfirmation,
  sendEmail,
  transporter
};
