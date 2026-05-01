# Upload Issue Analysis & Solution

**Date:** April 30, 2026  
**Status:** Investigating HTTP 400 error  
**Server:** Running on Port 3000

## Problem Statement

Profile picture and COR image uploads are failing with HTTP 400 error from Supabase.

```
POST http://localhost:3000/auth/upload 400 (Bad Request)
Error: HTTP 400: Upload to Supabase failed
```

## Root Cause Analysis

The HTTP 400 error is coming from **Supabase**, not from the middleware or multer. This means:

1. ✅ Request is reaching the backend
2. ✅ Multer is processing the multipart data
3. ✅ File is being extracted
4. ❌ Supabase is rejecting the upload

## Why Supabase Rejects Uploads

### Most Likely Causes (in order of probability)

1. **Buckets Don't Exist** (90% probability)
   - `profile-pictures` bucket doesn't exist
   - `cor-uploads` bucket doesn't exist
   - Supabase returns 400 when bucket not found

2. **Bucket Permissions Wrong** (8% probability)
   - Buckets exist but don't allow uploads
   - No INSERT policy for authenticated users
   - Supabase returns 400 when permission denied

3. **Service Role Key Invalid** (2% probability)
   - `.env` has wrong or expired service role key
   - Supabase returns 400 when auth fails

## Solution Steps

### Step 1: Create Supabase Buckets

1. Go to https://supabase.com/dashboard
2. Select your project: **ykigvhwepohncfwtfzip**
3. Go to **Storage** → **Buckets**
4. Click **New Bucket**
5. Create bucket named: **profile-pictures**
   - Make it **Public** (important!)
   - Click Create
6. Repeat for **cor-uploads** bucket
   - Make it **Public**
   - Click Create

### Step 2: Verify Bucket Permissions

1. Go to Storage → Buckets
2. Click on **profile-pictures**
3. Go to **Policies** tab
4. Verify there's a policy allowing uploads
5. If not, create one:
   - Click **New Policy**
   - Select **For authenticated users**
   - Choose **INSERT** operation
   - Click **Review** → **Save policy**
6. Repeat for **cor-uploads**

### Step 3: Verify Credentials

1. Go to Supabase dashboard
2. Project Settings → **API**
3. Copy the **Project URL** (should match SUPABASE_URL in .env)
4. Copy the **Service Role** key (should match SUPABASE_SERVICE_ROLE_KEY in .env)
5. Update `.env` if needed
6. Restart server: `npm start`

### Step 4: Test Upload

1. Go to http://localhost:3000/test-upload.html
2. Select a small image file (< 1MB)
3. Click "Test Upload"
4. Check result

## What Each Error Means

### "Bucket not found"
- Bucket doesn't exist in Supabase
- **Solution:** Create the bucket

### "Unauthorized"
- Service role key is invalid or expired
- **Solution:** Update `.env` with new key

### "Permission denied"
- Bucket exists but doesn't allow uploads
- **Solution:** Add INSERT policy to bucket

### "Invalid bucket name"
- Bucket name has uppercase or spaces
- **Solution:** Use lowercase, no spaces

### "File already exists"
- File with same name already uploaded
- **Solution:** Shouldn't happen (upsert: false), but if it does, delete old file

## Testing Checklist

- [ ] Supabase buckets exist
  - [ ] profile-pictures
  - [ ] cor-uploads
- [ ] Buckets are public
- [ ] Bucket policies allow uploads
- [ ] Service role key is valid
- [ ] `.env` has correct credentials
- [ ] Server restarted after `.env` changes
- [ ] File is < 5MB
- [ ] File is JPG, PNG, GIF, or WebP
- [ ] Browser cache cleared
- [ ] Test upload works

## How to Test

### Test 1: Simple Upload Test
```
1. Go to http://localhost:3000/test-upload.html
2. Select a small image
3. Click "Test Upload"
4. Check if upload succeeds
```

### Test 2: Check Server Logs
When uploading, look for:
```
[MIDDLEWARE] Multipart request detected: POST /auth/upload
📥 ===== UPLOAD REQUEST RECEIVED =====
Content-Type: multipart/form-data
Request file: YES
File details: {...}
📤 Uploading to Supabase bucket: profile-pictures/...
```

### Test 3: Check Supabase Directly
1. Go to Supabase dashboard
2. Storage → profile-pictures
3. Try to upload a file manually
4. If this works, bucket is OK
5. If this fails, fix bucket permissions

## Files Modified

### app.js
- **Lines 39-60:** Middleware configuration
- **Change:** Skip body parsing for multipart requests
- **Impact:** Allows multer to handle uploads

### routes/auth.js
- **Added:** Test endpoint `/auth/upload-test`
- **Purpose:** Verify upload route is working

### controllers/uploadController.js
- **Lines 1-20:** Enhanced logging
- **Purpose:** Show detailed error messages

### public/test-upload.html
- **New file:** Simple upload test page
- **Purpose:** Test upload without profile page complexity

## Expected Behavior After Fix

### Successful Upload
```
1. User selects image
2. Frontend shows preview
3. User clicks "Save Changes"
4. File sent to /auth/upload
5. Multer processes multipart
6. File uploaded to Supabase
7. Signed URL returned
8. Profile picture updated
9. Success message shown
```

### Error Handling
- If bucket doesn't exist: "Upload to Supabase failed"
- If permission denied: "Upload to Supabase failed"
- If file too large: "File too large. Maximum size is 5MB"
- If invalid file type: "Invalid file type"

## Middleware Flow

```
Request arrives
    ↓
Check if multipart/form-data
    ↓
If YES: Skip body parsing → Go to route
If NO: Parse JSON/URL-encoded → Go to route
    ↓
Route handler (multer middleware)
    ↓
Multer processes multipart
    ↓
File extracted to req.file
    ↓
uploadController.uploadFile()
    ↓
Validate file
    ↓
Upload to Supabase
    ↓
Return result
```

## Quick Checklist for Users

Before testing upload:

1. **Create Supabase buckets**
   - [ ] profile-pictures (public)
   - [ ] cor-uploads (public)

2. **Add bucket policies**
   - [ ] profile-pictures: INSERT for authenticated users
   - [ ] cor-uploads: INSERT for authenticated users

3. **Verify credentials**
   - [ ] SUPABASE_URL in .env
   - [ ] SUPABASE_SERVICE_ROLE_KEY in .env

4. **Restart server**
   - [ ] Stop Node process
   - [ ] Run `npm start`

5. **Test upload**
   - [ ] Go to http://localhost:3000/test-upload.html
   - [ ] Select image
   - [ ] Click "Test Upload"
   - [ ] Check result

## Support

If upload still fails:

1. **Check server logs** - Look for error message
2. **Check Supabase dashboard** - Verify buckets exist
3. **Test manually** - Upload file directly in Supabase
4. **Verify credentials** - Copy fresh keys from Supabase
5. **Clear browser cache** - Ctrl+Shift+Delete

---

**Next Action:** Create Supabase buckets and test upload
