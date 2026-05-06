# Schedule Email Notification - Test Checklist

## Pre-Test Verification

- [ ] Server is running (`npm start` or `node app.js`)
- [ ] Email credentials are in `.env`:
  - [ ] `EMAIL_HOST=smtp.gmail.com`
  - [ ] `EMAIL_PORT=587`
  - [ ] `EMAIL_USER=bintechman@gmail.com`
  - [ ] `EMAIL_PASSWORD=lkeh mhov awts uqtc`
- [ ] Admin accounts exist in database with emails
- [ ] Browser console is open (F12)
- [ ] Server logs are visible

---

## Test 1: Create Schedule with Admin Assignment

### Setup
- [ ] Navigate to `/admin/schedule`
- [ ] Click "New Event" button
- [ ] Modal opens successfully

### Fill Form
- [ ] Event Title: "Zone A Collection"
- [ ] Type: "Collection"
- [ ] Date: Tomorrow's date
- [ ] Start Time: "09:00"
- [ ] End Time: "11:00"
- [ ] Assigned To: Select an admin (e.g., "John Doe")
- [ ] Notes: "Please collect all bins in Zone A"

### Save & Verify
- [ ] Click "Save Event"
- [ ] Modal closes
- [ ] Event appears in calendar
- [ ] No error messages in browser console

### Check Server Logs
- [ ] `[addSchedule] Sending schedule notification to: [email]`
- [ ] `[Email Service] 📤 Sending schedule notification to [email]`
- [ ] `[Email Service] ✓ Schedule notification sent successfully`
- [ ] `[addSchedule] ✓ Schedule notification email sent successfully`

### Check Email
- [ ] Email received in assigned admin's inbox
- [ ] Subject: "Schedule Assignment: Zone A Collection"
- [ ] From: "BinTECH <bintechman@gmail.com>"
- [ ] Contains admin's full name in greeting
- [ ] Contains event title
- [ ] Contains date (formatted)
- [ ] Contains time (formatted)
- [ ] Contains notes
- [ ] Professional formatting

### Result
- [ ] **PASS** - All checks passed
- [ ] **FAIL** - Some checks failed (note which ones)

---

## Test 2: Update Schedule Assignment

### Setup
- [ ] Navigate to `/admin/schedule`
- [ ] Click on an existing event
- [ ] Event detail popup appears

### Edit Event
- [ ] Click "Edit" button
- [ ] Modal opens with event details
- [ ] Change "Assigned To" to a different admin
- [ ] Keep other details the same

### Save & Verify
- [ ] Click "Save Event"
- [ ] Modal closes
- [ ] Event still appears in calendar
- [ ] No error messages in browser console

### Check Server Logs
- [ ] `[updateSchedule] Sending schedule update notification to: [email]`
- [ ] `[Email Service] 📤 Sending schedule notification to [email]`
- [ ] `[Email Service] ✓ Schedule notification sent successfully`
- [ ] `[updateSchedule] ✓ Schedule update notification email sent successfully`

### Check Email
- [ ] Email received in newly assigned admin's inbox
- [ ] Subject: "Schedule Assignment: [Event Title]"
- [ ] Contains updated event details
- [ ] Professional formatting

### Result
- [ ] **PASS** - All checks passed
- [ ] **FAIL** - Some checks failed (note which ones)

---

## Test 3: Create Schedule Without Assignment

### Setup
- [ ] Navigate to `/admin/schedule`
- [ ] Click "New Event" button
- [ ] Modal opens successfully

### Fill Form
- [ ] Event Title: "Maintenance Check"
- [ ] Type: "Maintenance"
- [ ] Date: Tomorrow's date
- [ ] Start Time: "14:00"
- [ ] End Time: "15:00"
- [ ] Assigned To: Leave as "— Unassigned —"
- [ ] Notes: "Routine maintenance"

### Save & Verify
- [ ] Click "Save Event"
- [ ] Modal closes
- [ ] Event appears in calendar
- [ ] No error messages in browser console

### Check Server Logs
- [ ] `[addSchedule] Success: [event data]`
- [ ] `[addSchedule] Final assigned_to to send: null`
- [ ] **NO email-related logs should appear**

### Verify No Email Sent
- [ ] No email sent to any admin
- [ ] No email in any admin's inbox

### Result
- [ ] **PASS** - All checks passed
- [ ] **FAIL** - Some checks failed (note which ones)

---

## Test 4: Email Service Disabled (Optional)

### Setup
- [ ] Edit `.env` file
- [ ] Comment out `EMAIL_USER` and `EMAIL_PASSWORD`
- [ ] Save file
- [ ] Restart server

### Create Schedule with Assignment
- [ ] Navigate to `/admin/schedule`
- [ ] Create new event with admin assigned
- [ ] Click "Save Event"

### Check Server Logs
- [ ] `[Email Service] ⚠️ Email transporter not configured`
- [ ] `[Email Service] 📧 Notification would be sent to: [email]`
- [ ] `[addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)`

### Verify Schedule Created
- [ ] Event is created successfully
- [ ] Event appears in calendar
- [ ] No error messages in browser console

### Cleanup
- [ ] Restore `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- [ ] Restart server

### Result
- [ ] **PASS** - All checks passed
- [ ] **FAIL** - Some checks failed (note which ones)

---

## Overall Results

### Test 1: Create with Assignment
- [ ] **PASS**
- [ ] **FAIL**

### Test 2: Update Assignment
- [ ] **PASS**
- [ ] **FAIL**

### Test 3: Create Without Assignment
- [ ] **PASS**
- [ ] **FAIL**

### Test 4: Email Service Disabled
- [ ] **PASS**
- [ ] **FAIL**
- [ ] **SKIPPED**

---

## Issues Found

### Issue 1
- **Test:** [Test number]
- **Description:** [What went wrong]
- **Server Logs:** [Relevant log messages]
- **Solution Attempted:** [What you tried]
- **Result:** [Did it work?]

### Issue 2
- **Test:** [Test number]
- **Description:** [What went wrong]
- **Server Logs:** [Relevant log messages]
- **Solution Attempted:** [What you tried]
- **Result:** [Did it work?]

---

## Sign-Off

- [ ] All tests completed
- [ ] All tests passed
- [ ] Issues documented
- [ ] Ready for production deployment

**Tested By:** ___________________

**Date:** ___________________

**Notes:** 
```
[Add any additional notes here]
```

---

## Quick Reference

### Email Credentials
```
EMAIL_HOST: smtp.gmail.com
EMAIL_PORT: 587
EMAIL_USER: bintechman@gmail.com
EMAIL_PASSWORD: lkeh mhov awts uqtc
```

### Test Event Details
```
Event Title: Zone A Collection
Type: Collection
Date: Tomorrow
Start Time: 09:00
End Time: 11:00
Notes: Please collect all bins in Zone A
```

### Expected Log Messages
```
[addSchedule] Sending schedule notification to: [email]
[Email Service] 📤 Sending schedule notification to [email]
[Email Service] ✓ Schedule notification sent successfully
[addSchedule] ✓ Schedule notification email sent successfully
```

### Expected Email
```
Subject: Schedule Assignment: Zone A Collection
From: BinTECH <bintechman@gmail.com>
To: [assigned_admin_email]

Contains:
- Admin's full name
- Event title
- Date (formatted)
- Time (formatted)
- Notes
- Professional formatting
```

---

## Support

If tests fail:
1. Check server logs for error messages
2. Verify email credentials in `.env`
3. Verify admin accounts exist in database
4. Check email client spam folder
5. Review `SCHEDULE_EMAIL_TESTING_INSTRUCTIONS.md` for detailed debugging

---

**Status:** Ready for Testing ✅
