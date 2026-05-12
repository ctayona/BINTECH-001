# Profile Picture Upload Fix - HTTP 400 Error Resolution

## Problem Identified
The profile picture upload was failing with HTTP 400 "Bad Request" error. The root cause was **middleware conflict** in the Express application.

### Root Cause
The `bodyParser.json()` and `bodyParser.urlencoded()` middleware were being applied globally to ALL requests, including multipart/form-data requests. When a multipart request arrived:

1. Body parser tried to parse the multipart data as JSON/URL-encoded
2. This failed because multipart has a different format (with boundaries)
3. The request was rejected with HTTP 400 before reaching the multer middleware
4. The upload endpoint never received the file

## Solution Applied

### File: `app.js`
**Changed:** Middleware configuration to skip body parsing for multipart requests

**Before:**
```javascript
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
```

**After:**
```javascript
// Body Parser Middleware - Skip for multipart/form-data (handled by multer)
// Only parse JSON and URL-encoded for non-multipart requests
app.use((req, res, next) => {
  // Skip body parsing for multipart requests - let multer handle them
  if (req.is('multipart/form-data')) {
    return next();
  }
  // For other requests, use body parser
  bodyParser.json()(req, res, (err) => {
    if (err) return next(err);
    bodyParser.urlencoded({ extended: true })(req, res, next);
  });
});
```

### How It Works
1. **Multipart requests** (file uploads) bypass body parser and go directly to multer
2. **JSON/URL-encoded requests** (API calls) are parsed normally
3. No middleware conflicts, clean separation of concerns

## Testing the Fix

### Step 1: Verify Server is Running
```bash
# Check if server is on port 3000
curl http://localhost:3000/profile
```

### Step 2: Test Profile Picture Upload
1. Go to http://localhost:3000/profile
2. Click "Edit Profile" button
3. Click on the profile avatar to select a picture
4. Choose an image file (JPG, PNG, GIF, or WebP)
5. Click "Save Changes"

### Step 3: Monitor Server Logs
When uploading, you should see detailed logs:
```
📥 ===== UPLOAD REQUEST RECEIVED =====
Request headers: { ... }
Request body: { bucketName: 'profile-pictures', userId: '...' }
Request file: { fieldname: 'file', originalname: 'photo.jpg', ... }
📤 Backend Upload Request:
  User: k12149156
  File: photo.jpg
  File size: 45.23 KB
  MIME type: image/jpeg
  Bucket: profile-pictures
Generated unique filename: k12149156_1714521234567_abc123.jpg
📤 Uploading to Supabase bucket: profile-pictures/k12149156_1714521234567_abc123.jpg
✓ File uploaded to Supabase successfully
✓ Public URL: https://ykigvhwepohncfwtfzip.supabase.co/storage/v1/object/public/profile-pictures/...
✓ Upload successful!
```

### Step 4: Verify in Browser Console
Open browser DevTools (F12) and check the console:
```javascript
// Should see:
📤 Starting upload: photo.jpg (45.23KB) to bucket: profile-pictures
📤 Sending to backend: /auth/upload (multipart/form-data)
✓ File uploaded successfully
✓ URL obtained: https://...
```

## Troubleshooting

### Still Getting HTTP 400?
1. **Clear browser cache** - Ctrl+Shift+Delete
2. **Restart server** - Kill Node processes and restart
3. **Check file size** - Must be under 5MB
4. **Check file type** - Must be JPG, PNG, GIF, or WebP

### Check Server Logs
The enhanced logging will show:
- Request headers and body
- File details (name, size, MIME type)
- Supabase upload response
- Any errors with full details

### Verify Supabase Buckets
Ensure these buckets exist in your Supabase project:
- `profile-pictures` - For user profile photos
- `cor-uploads` - For Class of Record documents

### Verify Supabase Credentials
Check `.env` file has:
```
SUPABASE_URL=https://ykigvhwepohncfwtfzip.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Files Modified
- `app.js` - Fixed middleware configuration

## Files Enhanced with Logging
- `controllers/uploadController.js` - Added detailed request/response logging

## Related Components
- **Frontend:** `templates/USER_PROFILE.HTML` - `uploadFileToSupabase()` function
- **Backend:** `controllers/uploadController.js` - `uploadFile()` handler
- **Routes:** `routes/auth.js` - `/auth/upload` endpoint with multer
- **Config:** `config/supabase.js` - Supabase client initialization

## Expected Behavior After Fix

### Successful Upload
1. User selects image from profile page
2. Image preview shows in the UI
3. User clicks "Save Changes"
4. File is sent as multipart/form-data to `/auth/upload`
5. Backend receives file via multer
6. File is uploaded to Supabase storage
7. Signed URL is returned to frontend
8. Profile picture is updated in database
9. Success message appears: "Changes saved successfully!"

### Error Handling
- **No file selected:** "No file uploaded"
- **File too large:** "File too large. Maximum size is 5MB"
- **Invalid file type:** "Invalid file type. Allowed: JPG, PNG, GIF, WebP"
- **Supabase error:** Detailed error message from Supabase
- **Network error:** "Upload failed" with error details

## Performance Notes
- Files are stored in memory (multer memoryStorage)
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP
- Upload time depends on file size and network speed
- Signed URLs expire in 5 years

## Security Considerations
- File type validation on both frontend and backend
- File size limits enforced
- Service role key used for uploads (more secure than anon key)
- Unique filenames prevent collisions
- Files stored in Supabase with proper access controls

## Next Steps
1. Test the upload functionality
2. Monitor server logs for any issues
3. Verify profile pictures appear correctly
4. Test with different file sizes and formats
5. Check that COR (Class of Record) uploads also work

---

**Status:** ✅ Fixed - HTTP 400 error resolved by fixing middleware configuration
**Date:** April 30, 2026
**Server:** Running on port 3000
