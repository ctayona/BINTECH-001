# Schedule Email Notification - Testing Guide

## Quick Start

### Prerequisites:
- ✅ Email credentials configured in `.env` (already done)
- ✅ Admin accounts exist in `admin_accounts` table
- ✅ Server is running

## Testing Scenarios

### Scenario 1: Create Schedule with Assignment ✅

**Steps:**
1. Navigate to `/admin/schedule`
2. Click "New Event" button
3. Fill in form:
   - **Event Title**: "Zone A Collection"
   - **Type**: "Collection"
   - **Date**: Tomorrow's date
   - **Start Time**: "09:00"
   - **End Time**: "11:00"
   - **Assigned To**: Select an admin from dropdown
   - **Notes**: "Please collect all bins in Zone A"
4. Click "Save Event"

**Expected Results:**
- ✅ Event is created and appears in calendar
- ✅ Email is sent to assigned admin
- ✅ Email contains:
  - Event title: "Zone A Collection"
  - Date: Tomorrow's date
  - Time: "9:00 AM"
  - Notes: "Please collect all bins in Zone A"
  - Admin's full name in greeting

**Server Logs to Check:**
```
[addSchedule] Sending schedule notification to: admin@example.com
[Email Service] 📤 Sending schedule notification to admin@example.com
[Email Service] ✓ Schedule notification sent successfully to admin@example.com
[addSchedule] ✓ Schedule notification email sent successfully
```

---

### Scenario 2: Update Schedule Assignment ✅

**Steps:**
1. Navigate to `/admin/schedule`
2. Click on an existing event
3. Change "Assigned To" to a different admin
4. Click "Save Event"

**Expected Results:**
- ✅ Event is updated
- ✅ Email is sent to newly assigned admin
- ✅ Email contains updated event details

**Server Logs to Check:**
```
[updateSchedule] Sending schedule update notification to: newemail@example.com
[Email Service] 📤 Sending schedule notification to newemail@example.com
[Email Service] ✓ Schedule notification sent successfully to newemail@example.com
[updateSchedule] ✓ Schedule update notification email sent successfully
```

---

### Scenario 3: Create Schedule Without Assignment ✅

**Steps:**
1. Navigate to `/admin/schedule`
2. Click "New Event" button
3. Fill in form (same as Scenario 1)
4. **Leave "Assigned To" as "— Unassigned —"**
5. Click "Save Event"

**Expected Results:**
- ✅ Event is created
- ✅ **NO email is sent** (this is correct behavior)
- ✅ No email-related logs appear

**Server Logs to Check:**
```
[addSchedule] Success: [event data]
[addSchedule] Final assigned_to to send: null
// No email logs should appear
```

---

### Scenario 4: Update Schedule Without Assignment ✅

**Steps:**
1. Navigate to `/admin/schedule`
2. Click on an event that has an assignment
3. Change "Assigned To" to "— Unassigned —"
4. Click "Save Event"

**Expected Results:**
- ✅ Event is updated
- ✅ **NO email is sent** (assignment was removed)
- ✅ No email-related logs appear

---

### Scenario 5: Email Service Not Configured ✅

**Steps:**
1. Temporarily comment out email credentials in `.env`
2. Restart server
3. Create a schedule with assignment

**Expected Results:**
- ✅ Event is created successfully
- ✅ Email is NOT sent (graceful degradation)
- ✅ Warning logs appear

**Server Logs to Check:**
```
[Email Service] ⚠️ Email transporter not configured
[Email Service] 📧 Notification would be sent to: admin@example.com
[addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)
```

---

## Checking Email Delivery

### Gmail (if using Gmail SMTP):
1. Log in to the admin email account
2. Check Inbox for email from `bintechman@gmail.com`
3. Subject should be: `Schedule Assignment: [Event Title]`
4. Email should contain event details

### Email Content Verification:
- ✅ Professional header with BinTECH branding
- ✅ Admin's full name in greeting
- ✅ Event title displayed prominently
- ✅ Date formatted as "Monday, April 30, 2026"
- ✅ Time formatted as "2:30 PM"
- ✅ Notes section with event notes
- ✅ Action section with next steps
- ✅ Professional footer with copyright

---

## Debugging

### Enable Detailed Logging:
Check browser console and server logs for:

**Frontend (Browser Console):**
```javascript
[saveEvent] Creating new schedule
[saveEvent] Payload: { ... }
[saveEvent] ✅ SUCCESS - Saved event with admin assigned to: John Doe
```

**Backend (Server Console):**
```
[addSchedule] Received payload: { ... }
[addSchedule] Final assigned_to to send: [system_id]
[addSchedule] Success: [event data]
[addSchedule] Sending schedule notification to: admin@example.com
[Email Service] 📤 Sending schedule notification to admin@example.com
[Email Service] ✓ Schedule notification sent successfully to admin@example.com
[addSchedule] ✓ Schedule notification email sent successfully
```

### Common Issues:

**Issue: Email not received**
- Check `.env` file for correct email credentials
- Verify admin email exists in `admin_accounts` table
- Check server logs for error messages
- Check spam/junk folder in email client

**Issue: "Email transporter not configured"**
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Restart server after updating `.env`
- Check for typos in environment variable names

**Issue: "Could not fetch admin details for email"**
- Verify `assigned_to` value matches a `system_id` in `admin_accounts` table
- Check that admin account has `email` and `full_name` fields populated

**Issue: Schedule created but email not sent**
- Check server logs for error messages
- Verify email service is initialized
- Check network connectivity to SMTP server

---

## Test Data

### Sample Admin Accounts:
```sql
SELECT system_id, email, full_name, role FROM admin_accounts LIMIT 5;
```

### Sample Schedule Event:
```sql
INSERT INTO schedules (task, scheduled_at, assigned_to, notes, status)
VALUES (
  'Test Collection Event',
  '2026-05-01T10:00:00Z',
  '[admin_system_id]',
  'This is a test event',
  'pending'
);
```

---

## Success Criteria

✅ **All tests pass when:**
1. Email is received by assigned admin
2. Email contains correct event details
3. Email is professionally formatted
4. Schedule is created/updated successfully
5. No errors appear in server logs
6. Graceful degradation works when email service is unavailable

---

## Rollback Plan

If issues occur:
1. Email notifications are non-blocking
2. Schedules will still be created/updated even if email fails
3. To disable email notifications temporarily:
   - Comment out email sending code in `addSchedule` and `updateSchedule`
   - Or remove email credentials from `.env`
4. No database changes needed to rollback

---

## Next Steps

After successful testing:
1. ✅ Verify all test scenarios pass
2. ✅ Check email formatting and content
3. ✅ Verify logging is working correctly
4. ✅ Test with multiple admins
5. ✅ Test with different event types
6. ✅ Deploy to production

---

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify email credentials in `.env`
3. Verify admin accounts exist in database
4. Check email client spam folder
5. Review implementation in `SCHEDULE_EMAIL_NOTIFICATION_IMPLEMENTATION.md`
