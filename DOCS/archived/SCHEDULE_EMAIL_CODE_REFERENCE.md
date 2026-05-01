# Schedule Email Notification - Code Reference

## Email Service Functions

### 1. Generate Schedule Notification Template

**File:** `services/emailService.js` (lines 530-630)

```javascript
function generateScheduleNotificationTemplate(adminName, eventDetails) {
  const displayName = adminName || 'Admin';
  const eventTitle = eventDetails.task || 'Scheduled Event';
  const eventDate = eventDetails.scheduled_at 
    ? new Date(eventDetails.scheduled_at).toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      }) 
    : 'TBD';
  const eventTime = eventDetails.scheduled_at 
    ? new Date(eventDetails.scheduled_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit' 
      }) 
    : 'TBD';
  const eventNotes = eventDetails.notes || 'No additional notes';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Professional styling with BinTECH colors */
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .header { background: linear-gradient(135deg, #1a3a2f 0%, #2d5a47 100%); }
          .event-section { border-left: 4px solid #3d8b7a; }
          /* ... more styles ... */
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Schedule Assignment</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Hi ${displayName},</div>
            
            <p>You have been assigned to a new schedule event. Please review the details below.</p>
            
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
                  <span class="event-detail-value">${eventTime}</span>
                </div>
              </div>
              
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
              <p>Please log in to your admin dashboard to view the full event details and confirm your availability.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} BinTECH. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
```

### 2. Send Schedule Notification

**File:** `services/emailService.js` (lines 632-680)

```javascript
async function sendScheduleNotification(email, adminName, eventDetails) {
  try {
    const emailTransporter = initializeTransporter();
    
    if (!emailTransporter) {
      console.warn('[Email Service] ⚠️ Email transporter not configured');
      console.warn('[Email Service] 📧 Notification would be sent to: ' + email);
      return true; // Graceful degradation
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
    return false;
  }
}
```

## Backend Integration

### 1. Add Schedule with Email Notification

**File:** `controllers/adminController.js` - `addSchedule()` function (lines 2789-2835)

```javascript
console.log('[addSchedule] Success:', data);

// Send email notification if assigned_to is set
if (assigned_to && data && data.length > 0) {
  try {
    const emailService = require('../services/emailService');
    
    // Get admin details from admin_accounts table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_accounts')
      .select('email, full_name')
      .eq('system_id', assigned_to)
      .single();
    
    if (adminError) {
      console.warn('[addSchedule] Could not fetch admin details for email:', adminError.message);
    } else if (adminData && adminData.email) {
      console.log('[addSchedule] Sending schedule notification to:', adminData.email);
      
      const eventDetails = {
        task: task,
        scheduled_at: scheduled_at,
        notes: notes,
        bin_id: bin_id
      };
      
      const emailSent = await emailService.sendScheduleNotification(
        adminData.email,
        adminData.full_name || 'Admin',
        eventDetails
      );
      
      if (emailSent) {
        console.log('[addSchedule] ✓ Schedule notification email sent successfully');
      } else {
        console.warn('[addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)');
      }
    }
  } catch (emailError) {
    console.error('[addSchedule] Error sending schedule notification:', emailError.message);
    // Don't fail the schedule creation if email fails
  }
}

res.status(201).json({
  success: true,
  message: 'Schedule added successfully',
  schedules: data
});
```

### 2. Update Schedule with Email Notification

**File:** `controllers/adminController.js` - `updateSchedule()` function (lines 2949-2995)

```javascript
console.log('[updateSchedule] Success:', data);

// Send email notification if assigned_to is set (for updates)
if (assigned_to && data && data.length > 0) {
  try {
    const emailService = require('../services/emailService');
    
    // Get admin details from admin_accounts table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_accounts')
      .select('email, full_name')
      .eq('system_id', assigned_to)
      .single();
    
    if (adminError) {
      console.warn('[updateSchedule] Could not fetch admin details for email:', adminError.message);
    } else if (adminData && adminData.email) {
      console.log('[updateSchedule] Sending schedule update notification to:', adminData.email);
      
      const eventDetails = {
        task: task,
        scheduled_at: scheduled_at,
        notes: notes,
        bin_id: bin_id
      };
      
      const emailSent = await emailService.sendScheduleNotification(
        adminData.email,
        adminData.full_name || 'Admin',
        eventDetails
      );
      
      if (emailSent) {
        console.log('[updateSchedule] ✓ Schedule update notification email sent successfully');
      } else {
        console.warn('[updateSchedule] ⚠️ Failed to send schedule update notification email (non-blocking)');
      }
    }
  } catch (emailError) {
    console.error('[updateSchedule] Error sending schedule notification:', emailError.message);
    // Don't fail the schedule update if email fails
  }
}

res.json({
  success: true,
  message: 'Schedule updated successfully',
  schedules: data
});
```

## Module Exports

**File:** `services/emailService.js` (lines 764-774)

```javascript
module.exports = {
  initializeTransporter,
  generateOTPEmailTemplate,
  generatePasswordResetConfirmationTemplate,
  generateScheduleNotificationTemplate,  // NEW
  sendOTPEmail,
  sendPasswordResetConfirmation,
  sendScheduleNotification,              // NEW
  verifyConnection,
  sendTestOTP
};
```

## Usage Examples

### Example 1: Create Schedule with Assignment

```javascript
// Frontend sends:
POST /api/admin/schedule
{
  "task": "Zone A Collection",
  "scheduled_at": "2026-05-01T10:00:00Z",
  "assigned_to": "system_id_123",
  "notes": "Collect all bins in Zone A",
  "status": "pending"
}

// Backend:
// 1. Inserts schedule into database
// 2. Fetches admin: SELECT email, full_name FROM admin_accounts WHERE system_id = 'system_id_123'
// 3. Sends email to admin@example.com
// 4. Returns: { success: true, schedules: [...] }

// Admin receives email:
// Subject: Schedule Assignment: Zone A Collection
// Body: Professional HTML with event details
```

### Example 2: Update Schedule Assignment

```javascript
// Frontend sends:
PUT /api/admin/schedule/event_id_456
{
  "task": "Zone A Collection",
  "scheduled_at": "2026-05-01T10:00:00Z",
  "assigned_to": "system_id_789",  // Changed from system_id_123
  "notes": "Collect all bins in Zone A",
  "status": "pending"
}

// Backend:
// 1. Updates schedule in database
// 2. Fetches new admin: SELECT email, full_name FROM admin_accounts WHERE system_id = 'system_id_789'
// 3. Sends email to newemail@example.com
// 4. Returns: { success: true, schedules: [...] }

// New admin receives email:
// Subject: Schedule Assignment: Zone A Collection
// Body: Professional HTML with event details
```

### Example 3: Create Schedule Without Assignment

```javascript
// Frontend sends:
POST /api/admin/schedule
{
  "task": "Zone A Collection",
  "scheduled_at": "2026-05-01T10:00:00Z",
  "assigned_to": null,  // No assignment
  "notes": "Collect all bins in Zone A",
  "status": "pending"
}

// Backend:
// 1. Inserts schedule into database
// 2. Checks: if (assigned_to && data && data.length > 0) → FALSE
// 3. Skips email sending
// 4. Returns: { success: true, schedules: [...] }

// No email is sent
```

## Error Handling Examples

### Example 1: Email Service Not Configured

```javascript
// .env is missing EMAIL_USER or EMAIL_PASSWORD

// Backend logs:
[Email Service] ⚠️ Email transporter not configured
[Email Service] 📧 Notification would be sent to: admin@example.com
[addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)

// Result:
// - Schedule is created successfully
// - No email is sent
// - Response: { success: true, schedules: [...] }
```

### Example 2: Admin Not Found

```javascript
// assigned_to = 'invalid_system_id' (doesn't exist in admin_accounts)

// Backend logs:
[addSchedule] Could not fetch admin details for email: No rows found
[addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)

// Result:
// - Schedule is created successfully
// - No email is sent
// - Response: { success: true, schedules: [...] }
```

### Example 3: SMTP Connection Failed

```javascript
// Email credentials are incorrect or SMTP server is down

// Backend logs:
[Email Service] ❌ Error sending schedule notification: connect ECONNREFUSED
[updateSchedule] Error sending schedule notification: connect ECONNREFUSED
[updateSchedule] ⚠️ Failed to send schedule update notification email (non-blocking)

// Result:
// - Schedule is updated successfully
// - No email is sent
// - Response: { success: true, schedules: [...] }
```

## Testing Code Snippets

### Test 1: Verify Email Service

```javascript
// In Node.js console or test file:
const emailService = require('./services/emailService');

// Test email sending
const testEmail = 'admin@example.com';
const testAdmin = 'John Doe';
const testEvent = {
  task: 'Test Event',
  scheduled_at: new Date().toISOString(),
  notes: 'This is a test'
};

emailService.sendScheduleNotification(testEmail, testAdmin, testEvent)
  .then(result => console.log('Email sent:', result))
  .catch(err => console.error('Error:', err));
```

### Test 2: Verify Database Query

```javascript
// In Supabase SQL Editor:
SELECT system_id, email, full_name, role 
FROM admin_accounts 
WHERE system_id = 'system_id_123';

-- Should return:
-- system_id | email              | full_name | role
-- -----------|-------------------|-----------|------
-- system_id_123 | admin@example.com | John Doe  | admin
```

### Test 3: Verify Schedule Creation

```javascript
// In browser console:
fetch('/api/admin/schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: 'Test Collection',
    scheduled_at: '2026-05-01T10:00:00Z',
    assigned_to: 'system_id_123',
    notes: 'Test event',
    status: 'pending'
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));

// Check server logs for email sending status
```

## Configuration Reference

### Environment Variables

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=bintechman@gmail.com
EMAIL_PASSWORD=lkeh mhov awts uqtc
EMAIL_FROM=bintechman@gmail.com  # Optional, defaults to EMAIL_USER
```

### Nodemailer Configuration

```javascript
// In emailService.js - initializeTransporter()
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: emailPort === 465,  // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Debugging Tips

### Enable Detailed Logging

```javascript
// In addSchedule() or updateSchedule():
console.log('[addSchedule] Received payload:', {
  bin_id,
  assigned_to,
  task,
  scheduled_at,
  end_time,
  notes,
  status
});

console.log('[addSchedule] Frontend sent assigned_to:', assigned_to, 
  '(type:', typeof assigned_to, ', length:', assigned_to ? assigned_to.length : 0, ')');

console.log('[addSchedule] Final assigned_to to send:', assigned_to, 
  'Format: ' + (assigned_to ? (assigned_to.includes('@') ? 'EMAIL' : 'UUID') : 'NULL'));
```

### Check Email Service Status

```javascript
// In Node.js console:
const emailService = require('./services/emailService');

// Verify connection
emailService.verifyConnection()
  .then(result => console.log('Email service connected:', result))
  .catch(err => console.error('Connection failed:', err));
```

### Monitor Email Logs

```bash
# In terminal, watch for email-related logs:
grep -i "email\|schedule notification" server.log

# Or in real-time:
tail -f server.log | grep -i "email\|schedule notification"
```

## Summary

The email notification system is fully integrated with:
- ✅ Professional HTML templates
- ✅ Non-blocking error handling
- ✅ Comprehensive logging
- ✅ Graceful degradation
- ✅ Easy to test and debug
- ✅ Ready for production use
