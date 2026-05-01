# Profile Picture & COR Upload Debugging Guide

## Current Status
✅ Server running on port 3000  
✅ Middleware fixed to skip body parsing for multipart  
✅ COR image preview and remove functionality added  
❌ Upload still failing with HTTP 400 from Supabase

## The Error
```
HTTP 400: Upload to Supabase failed
```

This error is coming from Supabase, not from the middleware. The request is reaching the backend correctly, but Supabase is rejecting it.

## Common Causes

### 1. Supabase Buckets Don't Exist
The most common cause. You need to create these buckets in Supabase:
- `profile-pictures` - For user profile photos
- `cor-uploads` - For Class of Record documents

**How to check:**
1. Go to https://supabase.com/dashboard
2. Select your project (ykigvhwepohncfwtfzip)
3. Go to Storage → Buckets
4. Look for `profile-pictures` and `cor-uploads`

**If they don't exist, create them:**
1. Click "New Bucket"
2. Name: `profile-pictures`
3. Make it Public (so signed URLs work)
4. Click Create
5. Repeat for `cor-uploads`

### 2. Bucket Permissions Are Wrong
Even if buckets exist, they might not have the right permissions.

**Check permissions:**
1. Go to Storage → Buckets
2. Click on `profile-pictures`
3. Go to Policies tab
4. Verify there's a policy allowing uploads

**If no policy exists, create one:**
1. Click "New Policy"
2. Select "For authenticated users"
3. Choose "INSERT" operation
4. Click "Review" and "Save policy"

### 3. Service Role Key Not Working
The backend uses the service role key for uploads. If it's invalid or expired, uploads will fail.

**Check in `.env`:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If it's missing or invalid:**
1. Go to Supabase dashboard
2. Project Settings → API
3. Copy the "Service Role" key
4. Update `.env` with the new key
5. Restart server

### 4. Supabase Project URL Wrong
If the URL is incorrect, all uploads will fail.

**Check in `.env`:**
```
SUPABASE_URL=https://ykigvhwepohncfwtfzip.supabase.co
```

**If it's wrong:**
1. Go to Supabase dashboard
2. Project Settings → API
3. Copy the "Project URL"
4. Update `.env`
5. Restart server

## Debugging Steps

### Step 1: Check Server Logs
When you try to upload, check the server terminal for:

```
📥 ===== UPLOAD REQUEST RECEIVED =====
Content-Type: multipart/form-data; boundary=...
Request headers: [...]
Request file: YES
File details: {
  fieldname: 'file',
  originalname: 'photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 45230,
  buffer: 'Buffer(45230 bytes)'
}
Extracted from body - bucketName: profile-pictures, userId: k12149156
Generated unique filename: k12149156_1714521234567_abc123.jpg
📤 Uploading to Supabase bucket: profile-pictures/k12149156_1714521234567_abc123.jpg
   Buffer size: 44.17 KB
   Content-Type: image/jpeg
❌ Supabase upload error details:
   Error: [ERROR MESSAGE FROM SUPABASE]
   Full error object: {...}
```

### Step 2: Check Browser Console
Open DevTools (F12) and check Console tab:

```
📤 Starting upload: photo.jpg (45.23KB) to bucket: profile-pictures
📤 Sending to backend: /auth/upload (multipart/form-data)
Upload error: Error: HTTP 400: Upload to Supabase failed
```

### Step 3: Check Network Tab
In DevTools, go to Network tab:

1. Try to upload
2. Look for POST request to `/auth/upload`
3. Click on it
4. Go to Response tab
5. Look for the error message from Supabase

### Step 4: Test Supabase Connection
Create a test endpoint to verify Supabase is working:

```javascript
// Add this to routes/auth.js temporarily
router.get('/test-supabase', async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    
    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return res.json({
        success: false,
        message: 'Failed to list buckets',
        error: bucketsError.message
      });
    }
    
    res.json({
      success: true,
      message: 'Supabase connection OK',
      buckets: buckets.map(b => b.name)
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Error testing Supabase',
      error: error.message
    });
  }
});
```

Then visit: http://localhost:3000/auth/test-supabase

## Solutions by Error Message

### "Bucket not found"
**Solution:** Create the bucket in Supabase dashboard

### "Unauthorized"
**Solution:** Check service role key in `.env`

### "Invalid bucket name"
**Solution:** Bucket name must be lowercase, no spaces

### "File already exists"
**Solution:** This shouldn't happen (upsert: false), but if it does, the filename generation might be broken

### "Payload too large"
**Solution:** File is > 5MB, reduce file size

### "Invalid content type"
**Solution:** File type not supported, use JPG, PNG, GIF, or WebP

## Quick Checklist

- [ ] Supabase buckets exist (`profile-pictures`, `cor-uploads`)
- [ ] Buckets are public
- [ ] Bucket policies allow uploads
- [ ] Service role key is valid
- [ ] Supabase URL is correct
- [ ] `.env` file has all credentials
- [ ] Server restarted after `.env` changes
- [ ] File is < 5MB
- [ ] File is JPG, PNG, GIF, or WebP
- [ ] Browser cache cleared
- [ ] No console errors in browser

## Testing Upload

### Test 1: Simple Image
1. Go to http://localhost:3000/profile
2. Click "Edit Profile"
3. Click profile avatar
4. Select a small JPG file (< 1MB)
5. Click "Save Changes"
6. Check server logs for error

### Test 2: Check Supabase Directly
1. Go to Supabase dashboard
2. Storage → profile-pictures
3. Try to upload a file manually
4. If this works, the bucket is OK
5. If this fails, fix bucket permissions

### Test 3: Check Credentials
1. Go to Supabase dashboard
2. Project Settings → API
3. Verify Project URL matches `.env`
4. Verify Service Role key matches `.env`

## New Features Added

### COR Image Preview
- Select COR image to see preview
- Preview shows in 80x80 thumbnail
- Shows when image is selected

### COR Image Remove Button
- Red ✕ button appears on hover
- Click to remove selected image
- Only visible in edit mode
- Clears file input and preview

### COR Image Edit
- Click "Edit Profile" to enable editing
- Select new COR image
- Preview updates immediately
- Click "Save Changes" to upload
- Click "Cancel" to discard changes

## File Upload Flow (Detailed)

```
1. User selects image
   ↓
2. Frontend shows preview
   ↓
3. User clicks "Save Changes"
   ↓
4. Frontend creates FormData with:
   - file: File object
   - bucketName: 'profile-pictures' or 'cor-uploads'
   - userId: user ID
   ↓
5. Sends POST to /auth/upload
   ↓
6. Middleware detects multipart
   ↓
7. Skips body parsing
   ↓
8. Multer processes multipart
   ↓
9. File extracted to req.file
   ↓
10. uploadController.uploadFile() called
    ↓
11. Validates file (type, size)
    ↓
12. Generates unique filename
    ↓
13. Uploads to Supabase
    ↓
14. If error: Returns 400 with error details
    ↓
15. If success: Returns signed URL
    ↓
16. Frontend updates profile picture
    ↓
17. Success message displayed
```

## Server Logs to Look For

### Successful Upload
```
📥 ===== UPLOAD REQUEST RECEIVED =====
...
✓ File uploaded to Supabase successfully
✓ Public URL: https://...
✓ Upload successful!
```

### Failed Upload
```
📥 ===== UPLOAD REQUEST RECEIVED =====
...
❌ Supabase upload error details:
   Error: [ERROR MESSAGE]
   Full error object: {...}
```

## Next Steps

1. **Check Supabase buckets** - Most likely issue
2. **Verify credentials** - Second most likely
3. **Check file size** - Make sure < 5MB
4. **Check file type** - Must be JPG, PNG, GIF, WebP
5. **Clear browser cache** - Sometimes helps
6. **Restart server** - After any `.env` changes

## Support

If upload still fails after checking all above:

1. **Get the exact error message** from server logs
2. **Check Supabase dashboard** for bucket status
3. **Verify credentials** in `.env`
4. **Test with small file** (< 1MB)
5. **Check browser console** for additional errors

---

**Status:** Debugging in progress  
**Server:** Running on Port 3000  
**Next Action:** Check Supabase buckets and credentials
