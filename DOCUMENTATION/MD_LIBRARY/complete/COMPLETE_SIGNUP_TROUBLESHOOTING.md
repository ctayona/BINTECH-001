# Complete Sign-Up Troubleshooting Guide

## Overview

This guide helps troubleshoot account creation issues in the BinTECH Sign-Up form.

## Quick Checklist

Before troubleshooting, verify:

- [ ] Email is valid format (contains @)
- [ ] Email is not already registered
- [ ] First name is filled in
- [ ] Last name is filled in
- [ ] Role is selected from dropdown
- [ ] Password is 8+ characters
- [ ] Password has uppercase letter (A-Z)
- [ ] Password has number (0-9)
- [ ] Password has special character (!@#$%^&*)
- [ ] Passwords match (password = confirm password)
- [ ] Terms checkbox is checked
- [ ] No JavaScript errors in console

## Step-by-Step Troubleshooting

### Step 1: Check Browser Console

**How to open:**
1. Press F12 (or Ctrl+Shift+I on Windows, Cmd+Option+I on Mac)
2. Click "Console" tab
3. Look for error messages

**What to look for:**
- "Signup error:" messages
- "Backend error response:" messages
- Red error icons

**Example error:**
```
Signup error: Error: Email already registered
Backend error response: {success: false, message: "Email already registered"}
```

### Step 2: Check Network Tab

**How to open:**
1. Press F12
2. Click "Network" tab
3. Click "Create Account" button
4. Look for POST request to `/auth/register`

**What to check:**
1. **Request Status:** Should be 200 (success) or 400 (validation error)
2. **Request Body:** Should contain all form data
3. **Response:** Should show success or error message

**Example request body:**
```json
{
  "email": "student@umak.edu.ph",
  "password": "MyPass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Example error response:**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Step 3: Verify Form Data

Run this in browser console:

```javascript
const form = document.querySelector('form[onsubmit="handleSignup(event)"]');
const firstName = form.querySelector('input[placeholder="First name"]').value;
const lastName = form.querySelector('input[placeholder="Last name"]').value;
const email = form.querySelector('.signup-email').value;
const role = form.querySelector('.signup-role').value;
const password = form.querySelectorAll('input[type="password"]')[0].value;

console.log({
  firstName: firstName || '(empty)',
  lastName: lastName || '(empty)',
  email: email || '(empty)',
  role: role || '(not selected)',
  passwordLength: password.length,
  hasUppercase: /[A-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  passwordsMatch: password === form.querySelectorAll('input[type="password"]')[1].value
});
```

This will show you exactly what data is being sent.

## Common Errors and Solutions

### Error 1: "Email already registered"

**Cause:** Email already exists in database

**Solution:**
- Use a different email address
- Or wait 1 hour for orphaned account cleanup

**Example:**
```
❌ test@umak.edu.ph (already registered)
✅ test2@umak.edu.ph (new email)
```

### Error 2: "Invalid role value"

**Cause:** Role is not lowercase or not valid

**Solution:**
- Make sure dropdown sends: "student", "faculty", or "staff"
- Not: "Student", "Faculty", "Staff/Others"

**Check in console:**
```javascript
document.querySelector('.signup-role').value
// Should return: "student", "faculty", or "staff"
```

### Error 3: "Invalid email format for student"

**Cause:** Student/Faculty email missing campus ID

**Solution:**
- Student/Faculty emails must have campus ID
- Format: `[ID]@umak.edu.ph`
- Example: `A12-12345@umak.edu.ph`

**Valid formats:**
```
✅ A12-12345@umak.edu.ph (student)
✅ F99-99999@umak.edu.ph (faculty)
✅ staff@example.com (staff)
❌ john@umak.edu.ph (missing campus ID)
```

### Error 4: "Password must contain..."

**Cause:** Password doesn't meet all 4 requirements

**Solution:**
- Password must have:
  - 8+ characters
  - Uppercase letter (A-Z)
  - Number (0-9)
  - Special character (!@#$%^&*)

**Valid passwords:**
```
✅ MyPass123!
✅ SecureP@ss1
✅ BinTech2024!
✅ Eco$ort#2024
❌ password (no uppercase, number, special)
❌ Pass123 (no special character)
❌ Pass! (too short, no number)
```

### Error 5: "Passwords do not match"

**Cause:** Password and confirm password are different

**Solution:**
- Make sure both password fields have the same value
- Check for typos
- Use password manager to avoid mistakes

### Error 6: "Please fill in all required fields"

**Cause:** One or more required fields are empty

**Solution:**
- Fill in all fields:
  - First Name (required)
  - Last Name (required)
  - Email (required)
  - Role (required)
  - Password (required)
  - Confirm Password (required)
  - Terms checkbox (required)

### Error 7: "Form Error: Please refresh the page"

**Cause:** Form structure is incorrect or fields not found

**Solution:**
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try in incognito/private mode
4. Try different browser

## Advanced Debugging

### Enable Detailed Logging

Run this in console before signing up:

```javascript
// Log all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('📤 FETCH REQUEST:', args[0]);
  console.log('   Headers:', args[1]?.headers);
  console.log('   Body:', args[1]?.body);
  
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('📥 RESPONSE:', response.status, response.statusText);
      return response;
    })
    .catch(error => {
      console.error('❌ FETCH ERROR:', error);
      throw error;
    });
};
```

### Test Endpoint Directly

Use curl to test the endpoint:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@umak.edu.ph",
    "password": "MyPass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {...}
}
```

## Server-Side Debugging

### Check Server Logs

Look for registration messages:

```
========== REGISTRATION START ==========
Request body received: {...}
Extracted values:
  Email: test@umak.edu.ph
  First Name: Test
  Role from request: "student" (type: string)
========================================

=== User Account Created ===
System ID: ...
Email: test@umak.edu.ph
Role: student
===========================
```

### Check Database

Verify user was created:

```sql
SELECT * FROM user_accounts WHERE email = 'test@umak.edu.ph';
```

## Browser-Specific Issues

### Chrome/Edge
- Clear cache: Ctrl+Shift+Delete
- Try incognito mode: Ctrl+Shift+N
- Check extensions (disable if needed)

### Firefox
- Clear cache: Ctrl+Shift+Delete
- Try private mode: Ctrl+Shift+P
- Check extensions (disable if needed)

### Safari
- Clear cache: Cmd+Option+E
- Try private mode: Cmd+Shift+N
- Check extensions (disable if needed)

## Network Issues

### Check Internet Connection
```javascript
navigator.onLine // Should return true
```

### Check CORS
Look for CORS errors in console:
```
Access to XMLHttpRequest at 'http://localhost:3000/auth/register' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

If you see this, check server CORS configuration.

## Database Issues

### Check Connection
- Verify Supabase credentials in .env
- Check database is accessible
- Verify tables exist

### Check Constraints
- Email unique constraint
- Role check constraint
- Required field constraints

## Final Checklist

Before contacting support:

- [ ] Checked browser console for errors
- [ ] Checked network tab for response
- [ ] Verified all form fields are filled
- [ ] Verified password meets all requirements
- [ ] Tried with different email
- [ ] Tried in different browser
- [ ] Tried in incognito/private mode
- [ ] Cleared browser cache
- [ ] Refreshed page
- [ ] Checked server logs (if accessible)

## Contact Support

If still not working, provide:

1. **Error message** from console
2. **Network response** from Network tab
3. **Form data** you were trying to use
4. **Browser** and version
5. **Steps to reproduce**
6. **Server logs** (if accessible)

---

**Last Updated:** April 30, 2026
**Version:** 1.0.0
