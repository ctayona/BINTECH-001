# Sign-Up Account Creation - Debugging Guide

## Issue: Account Creation Failing

### What We Know
- Form validation passes
- Password requirements are met
- Form is sending data to backend
- Backend is returning an error

### How to Debug

## Step 1: Check Browser Console

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check for "Signup error:" messages
5. Look for "Backend error response:" messages

### Common Console Errors

**Error 1: "Email already registered"**
```
Backend error response: {
  success: false,
  message: 'Email already registered'
}
```
**Solution:** Use a different email address

**Error 2: "Invalid role value"**
```
Backend error response: {
  success: false,
  message: 'Invalid role. Must be one of: student, faculty, staff',
  receivedRole: 'Staff/Others'
}
```
**Solution:** Role must be lowercase. Check dropdown is sending correct value.

**Error 3: "Invalid email format"**
```
Backend error response: {
  success: false,
  message: 'Invalid email format for student. Could not extract campus ID.'
}
```
**Solution:** For students/faculty, email must contain campus ID (e.g., A12-12345@umak.edu.ph)

**Error 4: "Password must be at least 8 characters"**
```
Backend error response: {
  success: false,
  message: 'Password must contain: at least 8 characters, one uppercase letter (A-Z), one number (0-9), and one special character (!@#$%^&*)'
}
```
**Solution:** Password must meet all 4 requirements

## Step 2: Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Click "Create Account"
4. Look for POST request to `/auth/register`
5. Click on the request
6. Check "Request" tab to see what data was sent
7. Check "Response" tab to see what error was returned

### What to Look For

**Request Headers:**
```
POST /auth/register HTTP/1.1
Content-Type: application/json
```

**Request Body (should look like):**
```json
{
  "email": "student@umak.edu.ph",
  "password": "MyPass123!",
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "role": "student"
}
```

**Response (if error):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Step 3: Verify Form Data

Add this to browser console to check what data is being sent:

```javascript
// Get the form
const form = document.querySelector('form[onsubmit="handleSignup(event)"]');

// Get all values
const firstName = form.querySelector('input[placeholder="First name"]').value;
const lastName = form.querySelector('input[placeholder="Last name"]').value;
const email = form.querySelector('.signup-email').value;
const role = form.querySelector('.signup-role').value;
const password = form.querySelectorAll('input[type="password"]')[0].value;

// Log them
console.log({
  firstName,
  lastName,
  email,
  role,
  password,
  passwordLength: password.length,
  hasUppercase: /[A-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
});
```

## Step 4: Test with Valid Data

### For Student Role
```
Email: A12-12345@umak.edu.ph
First Name: John
Last Name: Doe
Password: MyPass123!
Role: Student
```

### For Faculty Role
```
Email: F99-99999@umak.edu.ph
First Name: Jane
Last Name: Smith
Password: SecureP@ss1
Role: Faculty
```

### For Staff Role
```
Email: staff@example.com
First Name: Bob
Last Name: Johnson
Password: BinTech2024!
Role: Staff/Others
```

## Step 5: Check Backend Logs

If you have access to server logs, look for:

```
========== REGISTRATION START ==========
Request body received: {...}
Extracted values:
  Email: ...
  First Name: ...
  Role from request: "..." (type: ...)
========================================
```

This shows what the backend received.

## Common Issues and Solutions

### Issue 1: Role is "Staff/Others" instead of "staff"

**Problem:**
```
Role from request: "Staff/Others" (type: string)
❌ Invalid role value: "Staff/Others"
```

**Solution:**
- Check that dropdown is sending lowercase value
- Verify dropdown option value is "staff" not "Staff/Others"

**Fix in HTML:**
```html
<option value="staff">Staff/Others</option>
```

### Issue 2: Email format incorrect

**Problem:**
```
Invalid email format for student. Could not extract campus ID.
```

**Solution:**
- Student/Faculty emails must have campus ID
- Format: `[ID]@umak.edu.ph`
- Example: `A12-12345@umak.edu.ph`

### Issue 3: Password doesn't meet requirements

**Problem:**
```
Password must contain: at least 8 characters, one uppercase letter (A-Z), one number (0-9), and one special character (!@#$%^&*)
```

**Solution:**
- Check all 4 requirements are met
- Use password like: `MyPass123!`

### Issue 4: Email already exists

**Problem:**
```
Email already registered
```

**Solution:**
- Use a different email address
- Or wait 1 hour for orphaned account cleanup

## Step 6: Enable Detailed Logging

Add this to the browser console before signing up:

```javascript
// Override fetch to log all requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('FETCH:', args[0], args[1]);
  return originalFetch.apply(this, args).then(response => {
    console.log('RESPONSE:', response.status, response.statusText);
    return response;
  });
};
```

## Step 7: Test Endpoint Directly

Use curl or Postman to test the endpoint:

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

## Checklist Before Signup

- [ ] Email is valid format
- [ ] Email is not already registered
- [ ] First name is filled in
- [ ] Last name is filled in
- [ ] Role is selected
- [ ] Password is 8+ characters
- [ ] Password has uppercase letter
- [ ] Password has number
- [ ] Password has special character
- [ ] Passwords match
- [ ] Terms checkbox is checked
- [ ] No JavaScript errors in console

## If Still Not Working

1. **Check server is running**
   ```bash
   curl http://localhost:3000
   ```

2. **Check database connection**
   - Look for database connection errors in server logs
   - Verify Supabase credentials in .env

3. **Check network connectivity**
   - Verify frontend can reach backend
   - Check for CORS errors

4. **Check logs**
   - Look at server console output
   - Check for detailed error messages

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Optional technical error details",
  "code": "Optional error code"
}
```

## Success Response Format

Successful signup returns:

```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "system_id": "...",
    "email": "...",
    "role": "...",
    "first_name": "...",
    "last_name": "..."
  }
}
```

## Next Steps

1. Check console for specific error message
2. Verify form data matches requirements
3. Try with different email/password
4. Check server logs for backend errors
5. Contact support with error message

---

**Last Updated:** April 30, 2026
