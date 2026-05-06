# Schedule Email Notification - Testing Instructions

## ✅ Implementation Status

Email notifications for schedule assignments are **fully implemented** and ready to test.

---

## Prerequisites

### 1. Email Configuration
✅ Already configured in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=bintechman@gmail.com
EMAIL_PASSWORD=lkeh mhov awts uqtc
```

### 2. Admin Accounts
Verify admin accounts exist in the database:
```sql
SELECT system_id, email, full_name, role FROM admin_accounts LIMIT 5;
```

**Example output:**
```
system_id              | email              | full_name | role
-----------------------|-------------------|-----------|------
550e8400-e29b-41d4-a716-446655440000 | admin@example.com | John Doe  | admin
550e8400-e29b-41d4-a716-446655440001 | head@example.com  | Jane Smith | head
```

### 3. Server Running
Make sure the server is running:
```bash
npm start
# or
node app.js
```

---

## Step-by-Step Testing

### Test 1: Create Schedule with Admin Assignment

**Steps:**

1. **Navigate to Schedule Module**
   - Go to `/admin/schedule`
   - You should see the calendar view

2. **Create New Event**
   - Click "New Event" button (top right)
   - Modal should open

3. **Fill in Event Details**
   - **Event Title:** "Zone A Collection"
   - **Type:** "Collection"
   - **Date:** Tomorrow's date (or any future date)
   - **Start Time:** "09:00"
   - **End Time:** "11:00"
   - **Assigned To:** Select an admin from dropdown (e.g., "John Doe (admin@example.com)")
   - **Notes:** "Please collect all bins in Zone A"

4. **Save Event**
   - Click "Save Event" button
   - Modal should close
   - Event should appear in calendar

5. **Check Server Logs**
   - Look for these log messages:
   ```
   [addSchedule] Sending schedule notification to: admin@example.com
   [Email Service] 📤 Sending schedule notification to admin@example.com
   [Email Service] Event: Zone A Collection
   [Email Service] ✓ Schedule notification sent successfully to admin@example.com
   [addSchedule] ✓ Schedule notification email sent successfully
   ```

6. **Check Admin's Email**
   - Log in to the assigned admin's email account
   - Check inbox for email from `bintechman@gmail.com`
   - **Subject:** "Schedule Assignment: Zone A Collection"
   - **Content should include:**
     - Admin's full name in greeting
     - Event title: "Zone A Collection"
     - Date: Tomorrow's date
     - Time: "9:00 AM"
     - Notes: "Please collect all bins in Zone A"

---

### Test 2: Update Schedule Assignment

**Steps:**

1. **Navigate to Schedule Module**
   - Go to `/admin/schedule`

2. **Click on Existing Event**
   - Click on an event in the calendar
   - Event detail popup should appear

3. **Edit Event**
   - Click "Edit" button in the popup
   - Modal should open with event details

4. **Change Assignment**
   - Change "Assigned To" to a different admin
   - Keep other details the same

5. **Save Event**
   - Click "Save Event" button
   - Modal should close

6. **Check Server Logs**
   - Look for these log messages:
   ```
   [updateSchedule] Sending schedule update notification to: newemail@example.com
   [Email Service] 📤 Sending schedule notification to newemail@example.com
   [Email Service] ✓ Schedule notification sent successfully to newemail@example.com
   [updateSchedule] ✓ Schedule update notification email sent successfully
   ```

7. **Check New Admin's Email**
   - Log in to the newly assigned admin's email
   - Check inbox for email from `bintechman@gmail.com`
   - Email should contain updated event details

---

### Test 3: Create Schedule Without Assignment

**Steps:**

1. **Navigate to Schedule Module**
   - Go to `/admin/schedule`

2. **Create New Event**
   - Click "New Event" button

3. **Fill in Event Details**
   - **Event Title:** "Maintenance Check"
   - **Type:** "Maintenance"
   - **Date:** Tomorrow's date
   - **Start Time:** "14:00"
   - **End Time:** "15:00"
   - **Assigned To:** Leave as "— Unassigned —"
   - **Notes:** "Routine maintenance"

4. **Save Event**
   - Click "Save Event" button

5. **Check Server Logs**
   - Should NOT see any email-related logs
   - Should see:
   ```
   [addSchedule] Success: [event data]
   [addSchedule] Final assigned_to to send: null
   ```
   - No email logs should appear

6. **Verify No Email Sent**
   - No email should be sent to any admin

---

### Test 4: Email Service Not Configured

**Steps:**

1. **Temporarily Disable Email**
   - Edit `.env` file
   - Comment out or remove `EMAIL_USER` and `EMAIL_PASSWORD`
   - Save file
   - Restart server

2. **Create Schedule with Assignment**
   - Go to `/admin/schedule`
   - Create new event with admin assigned
   - Click "Save Event"

3. **Check Server Logs**
   - Should see warning logs:
   ```
   [Email Service] ⚠️ Email transporter not configured
   [Email Service] 📧 Notification would be sent to: admin@example.com
   [addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)
   ```

4. **Verify Schedule Created**
   - Event should still be created successfully
   - No email is sent (graceful degradation)

5. **Re-enable Email**
   - Restore `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
   - Restart server

---

## Expected Results

### ✅ Test 1: Create with Assignment
- Event is created
- Email is sent to assigned admin
- Email contains correct event details
- No errors in server logs

### ✅ Test 2: Update Assignment
- Event is updated
- Email is sent to newly assigned admin
- Email contains updated event details
- No errors in server logs

### ✅ Test 3: Create Without Assignment
- Event is created
- NO email is sent
- No email-related logs appear

### ✅ Test 4: Email Service Disabled
- Event is created successfully
- No email is sent
- Warning logs appear
- Schedule creation is not blocked

---

## Email Content Verification

### Email Should Contain:

✅ **Subject:** `Schedule Assignment: [Event Title]`

✅ **From:** `BinTECH <bintechman@gmail.com>`

✅ **To:** `[assigned_admin_email]`

✅ **Body:**
- Professional header with BinTECH branding
- Personalized greeting: "Hi [Admin Full Name],"
- Event title
- Date (formatted: "Monday, April 30, 2026")
- Time (formatted: "2:30 PM")
- Notes
- Action section with next steps
- Professional footer

### Email Should NOT Contain:

❌ Errors or stack traces
❌ Sensitive information
❌ Unformatted data
❌ Broken HTML

---

## Debugging

### Check Email Credentials

```bash
# Verify .env file has email configuration
grep EMAIL .env

# Output should show:
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=bintechman@gmail.com
# EMAIL_PASSWORD=lkeh mhov awts uqtc
```

### Check Admin Accounts

```sql
-- Verify admin exists with email
SELECT system_id, email, full_name FROM admin_accounts 
WHERE system_id = '[assigned_to_value]';

-- Should return one row with email address
```

### Check Server Logs

```bash
# Watch for email-related logs
tail -f server.log | grep -i "email\|schedule notification"

# Or search for specific patterns
grep -i "sendScheduleNotification\|Email Service" server.log
```

### Check Browser Console

```javascript
// In browser console, check the API response
// After saving event, check Network tab for /api/admin/schedule request
// Response should show: { success: true, schedules: [...] }
```

---

## Common Issues & Solutions

### Issue 1: Email Not Received

**Symptoms:**
- Event is created
- Server logs show email sent
- Email not in inbox

**Solutions:**
1. Check spam/junk folder
2. Verify email address in database is correct
3. Check email credentials in `.env`
4. Verify SMTP server connectivity
5. Check email provider's security settings

**Debug:**
```sql
SELECT email FROM admin_accounts WHERE system_id = '[assigned_to_value]';
```

### Issue 2: "Email transporter not configured"

**Symptoms:**
- Server logs show: "Email transporter not configured"
- No email is sent

**Solutions:**
1. Verify `EMAIL_USER` is set in `.env`
2. Verify `EMAIL_PASSWORD` is set in `.env`
3. Restart server after updating `.env`
4. Check for typos in environment variable names

**Debug:**
```bash
# Check .env file
cat .env | grep EMAIL

# Should show all EMAIL_* variables
```

### Issue 3: "Could not fetch admin details for email"

**Symptoms:**
- Server logs show: "Could not fetch admin details for email"
- No email is sent

**Solutions:**
1. Verify `assigned_to` value matches a `system_id` in database
2. Verify admin account has `email` field populated
3. Verify admin account has `full_name` field populated

**Debug:**
```sql
-- Check if admin exists
SELECT * FROM admin_accounts WHERE system_id = '[assigned_to_value]';

-- Should return one row with email and full_name
```

### Issue 4: "connect ECONNREFUSED"

**Symptoms:**
- Server logs show: "connect ECONNREFUSED"
- Email fails to send

**Solutions:**
1. Check SMTP server is accessible
2. Verify email credentials are correct
3. Check firewall/network settings
4. Verify EMAIL_HOST and EMAIL_PORT are correct

**Debug:**
```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Should connect successfully
```

### Issue 5: Schedule Not Created

**Symptoms:**
- Event modal doesn't close
- Error message appears
- Event not in calendar

**Solutions:**
1. Check browser console for errors
2. Check server logs for error messages
3. Verify all required fields are filled
4. Verify assigned_to value is valid

**Debug:**
```javascript
// In browser console
// Check Network tab for /api/admin/schedule request
// Look for error response
```

---

## Server Log Examples

### Successful Email Send

```
[addSchedule] Received payload: {
  bin_id: null,
  assigned_to: '550e8400-e29b-41d4-a716-446655440000',
  task: 'Zone A Collection',
  scheduled_at: '2026-05-01T09:00:00Z',
  end_time: '2026-05-01T11:00:00Z',
  notes: 'Please collect all bins in Zone A',
  status: 'pending'
}

[addSchedule] Final assigned_to to send: 550e8400-e29b-41d4-a716-446655440000

[addSchedule] Success: [{ id: 123, task: 'Zone A Collection', ... }]

[addSchedule] Sending schedule notification to: admin@example.com

[Email Service] 📤 Sending schedule notification to admin@example.com
[Email Service] Event: Zone A Collection

[Email Service] ✓ Schedule notification sent successfully to admin@example.com
[Email Service] Message ID: <message_id@gmail.com>

[addSchedule] ✓ Schedule notification email sent successfully
```

### Email Service Not Configured

```
[addSchedule] Success: [{ id: 123, task: 'Zone A Collection', ... }]

[Email Service] ⚠️ Email transporter not configured, skipping schedule notification
[Email Service] 📧 Notification would be sent to: admin@example.com
[Email Service] 📧 Event: Zone A Collection

[addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)
```

### Admin Not Found

```
[addSchedule] Success: [{ id: 123, task: 'Zone A Collection', ... }]

[addSchedule] Could not fetch admin details for email: No rows found

[addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)
```

---

## Success Criteria

✅ All tests pass when:
1. Email is received by assigned admin
2. Email contains correct event details
3. Email is professionally formatted
4. Schedule is created/updated successfully
5. No errors appear in server logs
6. Graceful degradation works when email service is unavailable

---

## Next Steps

1. **Run all 4 tests** following the steps above
2. **Verify email content** matches expected format
3. **Check server logs** for any issues
4. **Document results** for your records
5. **Deploy to production** when all tests pass

---

## Support

If you encounter issues:
1. Check the "Common Issues & Solutions" section
2. Review server logs for error messages
3. Verify email credentials in `.env`
4. Verify admin accounts exist in database
5. Check email client spam folder

---

**Status:** ✅ Ready for Testing
**Implementation Date:** April 30, 2026
**Last Updated:** April 30, 2026
