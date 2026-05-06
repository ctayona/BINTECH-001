# Google OAuth Sign-In/Sign-Up Button Fix

## Problem
The Google Sign-In and Sign-Up buttons are showing errors:
- "Failed to load resource: the server responded with a status of 403"
- "The given origin is not allowed for the given client ID"
- "Form fields not found" error in console

## Root Cause
The Google Client ID in your Google Cloud Console doesn't have `http://localhost:3000` (or your current domain) added to its **Authorized JavaScript Origins**.

## Solution

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (BinTECH or similar)
3. Go to **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth 2.0 Client ID
1. Look for the OAuth 2.0 Client ID that matches: `1081673977933-hbcfruoe6kqm1ejq27jvhkt25an8iaa5.apps.googleusercontent.com`
2. Click on it to edit

### Step 3: Add Authorized Origins
In the **Authorized JavaScript origins** section, add:
- `http://localhost:3000` (for local development)
- `http://127.0.0.1:3000` (alternative localhost)
- Your production domain (e.g., `https://bintech.example.com`)

### Step 4: Add Authorized Redirect URIs
In the **Authorized redirect URIs** section, add:
- `http://localhost:3000/` (with trailing slash)
- `http://localhost:3000/dashboard`
- `http://localhost:3000/admin/dashboard`
- Your production URLs

### Step 5: Save Changes
1. Click **Save**
2. Wait 1-2 minutes for changes to propagate
3. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)

## Quick Verification

After making changes, check:
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for messages like:
   - ✅ `[Google Auth] ✓ Buttons initialized` - Success!
   - ❌ `The given origin is not allowed` - Still needs fixing

## Alternative: Disable Google Sign-In (Temporary)

If you can't access Google Cloud Console right now, you can temporarily hide the Google buttons:

### In `templates/LANDING_PAGE.HTML`:

Find the Google Sign-In button section (around line 550-600) and add `style="display:none;"`:

```html
<!-- Google Login Button -->
<div id="google-login-button" style="display:none;"></div>

<!-- Google Signup Button -->
<div id="google-signup-button" style="display:none;"></div>
```

This will hide the buttons until you fix the OAuth configuration.

## Environment Variables

Your current `.env` file has:
```
GOOGLE_CLIENT_ID=1081673977933-hbcfruoe6kqm1ejq27jvhkt25an8iaa5.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=1081673977933-hbcfruoe6kqm1ejq27jvhkt25an8iaa5.apps.googleusercontent.com
```

These are correct. The issue is in the Google Cloud Console configuration, not in your code.

## Testing After Fix

1. Restart your server: `npm start`
2. Go to http://localhost:3000
3. Click on the Sign Up button
4. You should see the Google Sign-In button without errors
5. Try signing up with Google

## Common Issues

### Issue: Still seeing 403 error after adding origins
- **Solution:** Wait 2-3 minutes for Google's servers to update
- Clear browser cache (Ctrl+Shift+Delete)
- Try in an incognito/private window

### Issue: Button appears but doesn't work
- **Solution:** Check that the callback functions exist in `public/js/auth.js`
- Verify `handleGoogleSignUp` and `handleGoogleSignIn` are defined

### Issue: "Form fields not found" error
- **Solution:** This means the signup form elements aren't loading
- Check that the form has proper IDs: `signup-email`, `signup-password`, etc.
- Verify the form is visible on the page

## Production Deployment

When deploying to production:

1. Add your production domain to Google Cloud Console:
   - Authorized Origins: `https://yourdomain.com`
   - Redirect URIs: `https://yourdomain.com/`, `https://yourdomain.com/dashboard`

2. Update `.env` with production values:
   ```
   FRONTEND_URL=https://yourdomain.com
   ```

3. Restart the server

## Need Help?

If you're still having issues:

1. Check Google Cloud Console settings are saved
2. Verify the Client ID in `.env` matches Google Cloud Console
3. Check browser console for specific error messages
4. Try in a different browser or incognito window
5. Clear all browser cache and cookies

## Related Files
- `public/js/auth.js` - Google Sign-In initialization
- `controllers/authController.js` - Backend Google OAuth handling
- `routes/auth.js` - Auth API routes
- `.env` - Environment configuration
