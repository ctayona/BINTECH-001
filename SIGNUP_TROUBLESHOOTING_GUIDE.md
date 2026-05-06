# Sign-Up Issues - Complete Troubleshooting Guide

## Quick Diagnosis

### Step 1: Open Browser Console
1. Press **F12** to open Developer Tools
2. Click the **Console** tab
3. Look for error messages

### Step 2: Check for These Errors

#### Error 1: "The given origin is not allowed for the given client ID"
**Cause:** Google OAuth configuration issue
**Solution:** See "Google OAuth 403 Error" section below

#### Error 2: "Form fields not found"
**Cause:** Form elements not loading properly
**Solution:** See "Form Fields Not Found" section below

#### Error 3: "Failed to load resource: 403"
**Cause:** Google button resources blocked
**Solution:** See "Google Button 403 Error" section below

---

## Issue 1: Google OAuth 403 Error

### Symptoms
- Console shows: "The given origin is not allowed for the given client ID"
- Google Sign-In button doesn't work
- Multiple 403 errors in Network tab

### Root Cause
The Google Client ID doesn't have your current origin in its authorized list.

### Solution

#### Option A: Fix Google Cloud Console (Recommended)

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find and click your OAuth 2.0 Client ID
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/`
   - `http://localhost:3000/dashboard`
7. Click **Save**
8. Wait 1-2 minutes for changes to propagate
9. Refresh browser (Ctrl+F5)

#### Option B: Temporary Workaround

If you can't access Google Cloud Console right now:

1. Open `templates/LANDING_PAGE.HTML`
2. Find line ~707 with `<div id="google-signup-button"`
3. Add `style="display:none;"` to hide the button:
   ```html
   <div id="google-signup-button" class="w-full flex justify-center" style="display:none;"></div>
   ```
4. Save and refresh the page
5. Users can still sign up with email/password

### Verification
After fixing, check console for:
```
✓ [Google Auth] ✓ Signup button rendered successfully
```

---

## Issue 2: Form Fields Not Found

### Symptoms
- Error message: "Form Error: Please refresh the page and try again."
- Console shows: "Form fields not found"
- Can't submit signup form

### Root Cause
Form elements aren't being detected by the JavaScript.

### Debugging Steps

1. **Open Browser Console (F12)**
2. **Look for this debug output:**
   ```
   [Signup] Form submission detected
   [Signup] Field detection: {
     firstNameInput: true,
     lastNameInput: true,
     emailInput: true,
     roleSelect: true,
     passwordInputs: 2,
     termsCheckbox: true
   }
   ```

3. **If any field shows `false`:**
   - That field is missing or has wrong selector
   - Check the HTML form structure

### Solution

#### Step 1: Verify Form Structure
Check that `templates/LANDING_PAGE.HTML` has these inputs:

```html
<!-- First Name -->
<input placeholder="First name" ...>

<!-- Middle Name (optional) -->
<input placeholder="Middle name (optional)" ...>

<!-- Last Name -->
<input placeholder="Last name" ...>

<!-- Email -->
<input class="signup-email" ...>

<!-- Role -->
<select class="signup-role" ...>

<!-- Password -->
<input id="signup-password" type="password" ...>

<!-- Confirm Password -->
<input id="signup-confirm-password" type="password" ...>

<!-- Terms Checkbox -->
<input type="checkbox" ...>
```

#### Step 2: Refresh Page
1. Press **Ctrl+F5** (hard refresh)
2. Try submitting the form again

#### Step 3: Check Browser Cache
1. Press **Ctrl+Shift+Delete**
2. Select "All time"
3. Check: Cookies, Cached images and files
4. Click **Clear data**
5. Refresh page

#### Step 4: Try Different Browser
- Try Chrome, Firefox, Safari, or Edge
- Try incognito/private window
- This helps isolate browser-specific issues

### Advanced Debugging

If the issue persists, add this to browser console:

```javascript
// Check if form exists
const form = document.querySelector('form[onsubmit="handleSignup(event)"]');
console.log('Form found:', !!form);

// Check all inputs
const inputs = form.querySelectorAll('input');
console.log('Total inputs:', inputs.length);
inputs.forEach((input, i) => {
  console.log(`Input ${i}:`, {
    type: input.type,
    placeholder: input.placeholder,
    class: input.className,
    id: input.id,
    value: input.value
  });
});

// Check select
const select = form.querySelector('select');
console.log('Select found:', !!select);
```

---

## Issue 3: Google Button 403 Error

### Symptoms
- Multiple "Failed to load resource: 403" errors
- Google button doesn't appear
- Console shows resource loading failures

### Root Cause
Google's button library resources are being blocked.

### Solution

1. **Clear Browser Cache**
   - Press Ctrl+Shift+Delete
   - Clear all cache and cookies
   - Refresh page

2. **Check Google Cloud Console**
   - Verify Client ID is correct
   - Verify authorized origins are set
   - Wait 2-3 minutes for changes to propagate

3. **Try Different Network**
   - Try on a different WiFi/network
   - Try with VPN disabled
   - Try on mobile hotspot

4. **Check Firewall/Proxy**
   - Disable VPN if using one
   - Check corporate firewall settings
   - Try from a different network

---

## Issue 4: Can't Submit Form

### Symptoms
- Form submits but nothing happens
- No error message
- Page doesn't respond

### Debugging

1. **Check Console for Errors**
   - Press F12
   - Look for red error messages
   - Note the exact error

2. **Check Network Tab**
   - Press F12 → Network tab
   - Try submitting form
   - Look for failed requests
   - Check response status and message

3. **Common Validation Errors**
   - Password too short (must be 8+ characters)
   - Password missing uppercase letter
   - Password missing number
   - Password missing special character
   - Passwords don't match
   - Terms not checked
   - Email already registered

### Solution

**Check Password Requirements:**
- At least 8 characters
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

**Example valid password:** `MyPassword123!`

---

## Issue 5: Email Already Registered

### Symptoms
- Error: "Email already registered"
- Can't create account with that email

### Solution

1. **Use Different Email**
   - Try with a different email address
   - Example: `firstname.lastname@umak.edu.ph`

2. **Reset Password Instead**
   - If you forgot your password, click "Forgot Password?"
   - Follow password recovery flow

3. **Contact Support**
   - If you think this is an error
   - Provide your email address
   - Ask to reset your account

---

## Issue 6: Google Sign-Up Not Working

### Symptoms
- Click Google button
- Nothing happens
- No popup appears

### Debugging

1. **Check Popup Blocker**
   - Browser might be blocking popup
   - Check browser's popup blocker settings
   - Allow popups for localhost:3000

2. **Check Console**
   - Press F12
   - Look for Google-related errors
   - Check if buttons initialized successfully

3. **Verify Google Account**
   - Make sure you're logged into Google
   - Try logging out and back in
   - Try different Google account

### Solution

1. **Allow Popups**
   - Chrome: Click popup blocker icon → Allow
   - Firefox: Click notification bar → Allow
   - Safari: Preferences → Security → Allow popups

2. **Try Email/Password Sign-Up Instead**
   - Fill in form manually
   - Click "Sign Up" button
   - This doesn't require Google

---

## Complete Verification Checklist

After applying fixes, verify all of these:

- [ ] No 403 errors in console
- [ ] No "origin not allowed" message
- [ ] Google button appears (if not hidden)
- [ ] Form fields load properly
- [ ] Can fill in all form fields
- [ ] Can submit form with email/password
- [ ] Can sign up with Google (if OAuth fixed)
- [ ] Success modal appears after signup
- [ ] Can log in with new account
- [ ] Dashboard loads after login

---

## Getting Help

If you're still having issues:

1. **Collect Information**
   - Screenshot of error message
   - Browser console output (F12)
   - Network tab errors (F12 → Network)
   - Your current URL (http://localhost:3000)

2. **Check These Files**
   - `.env` - Verify GOOGLE_CLIENT_ID is set
   - `templates/LANDING_PAGE.HTML` - Check form structure
   - `public/js/auth.js` - Check for JavaScript errors

3. **Try These Steps**
   - Restart server: `npm start`
   - Clear browser cache: Ctrl+Shift+Delete
   - Try different browser
   - Try incognito/private window
   - Try different network

4. **Contact Support**
   - Provide error messages
   - Provide browser console output
   - Provide steps to reproduce
   - Provide your environment (OS, browser, etc.)

---

## Related Documentation

- `GOOGLE_OAUTH_FIX.md` - Google OAuth configuration
- `SIGNUP_FORM_FIX.md` - Form and OAuth fixes
- `PASSWORD_RECOVERY_FIX_COMPLETE.md` - Password recovery
- `public/js/auth.js` - Authentication code
- `.env` - Environment configuration
