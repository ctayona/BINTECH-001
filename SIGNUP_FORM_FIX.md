# Sign-Up Form and Google OAuth Button Fix

## Issues Identified

1. **Google OAuth 403 Error** - Origin not allowed in Google Cloud Console
2. **"Form fields not found" Error** - Form elements not loading properly
3. **Google button loading failures** - Multiple 403 errors for button resources

## Root Causes

### Issue 1: Google OAuth 403 Error
The Google Client ID doesn't have `http://localhost:3000` in its authorized origins.

**Fix:** See `GOOGLE_OAUTH_FIX.md` for detailed instructions.

### Issue 2: Form Fields Not Found
The form validation is looking for specific input placeholders, but they might not be loading in time.

**Fix:** Ensure form is fully loaded before validation.

### Issue 3: Google Button Resource Failures
Google's button library is being blocked by CORS or origin restrictions.

**Fix:** Update Google Cloud Console configuration.

## Quick Fix Steps

### Step 1: Update Google Cloud Console (REQUIRED)

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Add to **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
6. Add to **Authorized redirect URIs**:
   - `http://localhost:3000/`
   - `http://localhost:3000/dashboard`
7. Click **Save**
8. Wait 1-2 minutes for changes to propagate

### Step 2: Clear Browser Cache

1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Select "All time"
3. Check: Cookies, Cached images and files
4. Click **Clear data**

### Step 3: Restart Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
```

### Step 4: Test Sign-Up

1. Go to http://localhost:3000
2. Click "Sign In" button
3. You should see the signup form without errors
4. The Google Sign-Up button should appear without 403 errors

## Verification Checklist

After applying fixes, verify:

- [ ] No 403 errors in browser console
- [ ] No "The given origin is not allowed" message
- [ ] Google Sign-Up button appears and is clickable
- [ ] Form fields load properly
- [ ] "Form fields not found" error is gone
- [ ] Can submit signup form with email/password
- [ ] Can sign up with Google

## Browser Console Debugging

Open DevTools (F12) and check the Console tab:

### Expected Messages (✅ Good)
```
[Google Auth] Initializing Google Sign-In buttons
[Google Auth] Rendering signup button
[Google Auth] ✓ Buttons initialized
```

### Error Messages (❌ Bad)
```
The given origin is not allowed for the given client ID
Failed to load resource: the server responded with a status of 403
Form fields not found
```

## If Google OAuth Still Doesn't Work

### Temporary Workaround: Disable Google Sign-In

Edit `templates/LANDING_PAGE.HTML` and find the Google button sections (around line 707):

**Before:**
```html
<div id="google-signup-button" class="w-full flex justify-center"></div>
```

**After:**
```html
<div id="google-signup-button" class="w-full flex justify-center" style="display:none;"></div>
```

This hides the Google button while you fix the OAuth configuration.

## Form Fields Reference

The signup form expects these input fields:

| Field | Placeholder | Type | Required |
|-------|-------------|------|----------|
| First Name | "First name" | text | Yes |
| Middle Name | "Middle name (optional)" | text | No |
| Last Name | "Last name" | text | Yes |
| Email | (class: signup-email) | email | Yes |
| Role | (class: signup-role) | select | Yes |
| Password | (id: signup-password) | password | Yes |
| Confirm Password | (id: signup-confirm-password) | password | Yes |
| Terms | (type: checkbox) | checkbox | Yes |

## Environment Configuration

Your `.env` file is correctly configured:
```
GOOGLE_CLIENT_ID=1081673977933-hbcfruoe6kqm1ejq27jvhkt25an8iaa5.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=1081673977933-hbcfruoe6kqm1ejq27jvhkt25an8iaa5.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
```

The issue is in the Google Cloud Console, not in your code.

## Testing Different Scenarios

### Scenario 1: Email/Password Sign-Up
1. Fill in all form fields
2. Click "Sign Up" button
3. Should see success modal

### Scenario 2: Google Sign-Up
1. Click Google Sign-Up button
2. Should open Google login popup
3. After login, should create account

### Scenario 3: Form Validation
1. Leave fields empty
2. Click "Sign Up"
3. Should show validation errors

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| 403 error persists | Wait 2-3 minutes, clear cache, restart server |
| Google button doesn't appear | Check browser console for errors, verify Client ID |
| "Form fields not found" | Refresh page, check HTML form structure |
| Can't sign up with email | Check password requirements, verify email format |
| Google popup doesn't open | Check browser popup blocker settings |

## Production Deployment

When deploying to production:

1. Update Google Cloud Console with production domain
2. Update `.env` with production URL
3. Update `FRONTEND_URL` in `.env`
4. Restart server
5. Test all sign-up methods

## Related Documentation

- `GOOGLE_OAUTH_FIX.md` - Detailed Google OAuth configuration
- `PASSWORD_RECOVERY_FIX_COMPLETE.md` - Password recovery fixes
- `public/js/auth.js` - Authentication JavaScript
- `controllers/authController.js` - Backend authentication

## Need More Help?

1. Check browser console (F12) for specific error messages
2. Verify Google Cloud Console settings are saved
3. Try in incognito/private window
4. Try in a different browser
5. Check that server is running on port 3000
