# Fix Profile Picture Upload

## Status
✅ COR upload working  
❌ Profile picture upload not working  
✅ Error card double-showing fixed  
✅ Save function consolidated

## What Was Fixed

### 1. Error Card Double-Showing ✅
**Problem:** Error messages were showing twice
**Solution:** Consolidated error handling in handleSaveProfile function
- Removed nested try-catch blocks for file uploads
- All errors now caught in single outer catch block
- Only one error message shown per error

### 2. Save Function Improved ✅
**Changes:**
- Removed early returns that prevented proper error handling
- Added status messages for each step (Uploading COR, Uploading profile picture, Saving profile)
- Better error messages
- Proper button state management

## Profile Picture Upload Issue

### Why It's Not Working
The `profile-pictures` bucket likely doesn't have the same permissions as `cor-uploads`.

### How to Fix

**Step 1: Go to Supabase Dashboard**
1. https://supabase.com/dashboard
2. Select project: `ykigvhwepohncfwtfzip`
3. Go to **Storage** → **Buckets**

**Step 2: Check profile-pictures Bucket**
1. Click on **profile-pictures** bucket
2. Go to **Policies** tab
3. Check if there are any policies

**Step 3: Add INSERT Policy (if missing)**
1. Click **New Policy**
2. Select **For authenticated users**
3. Choose **INSERT** operation
4. Click **Review** → **Save policy**

**Step 4: Verify Permissions**
Make sure the policy allows:
- ✅ INSERT (upload files)
- ✅ SELECT (read files)
- ✅ UPDATE (update files)
- ✅ DELETE (delete files)

**Step 5: Test Upload**
1. Go to http://localhost:3000/profile
2. Click "Edit Profile"
3. Click profile avatar
4. Select an image
5. Click "Save Changes"
6. Should work now!

## Files Modified

### templates/USER_PROFILE.HTML
- **handleSaveProfile function:** Consolidated error handling
- **Removed:** Nested try-catch blocks
- **Added:** Better status messages
- **Result:** No more double error messages

## Testing

### Test 1: Profile Picture Upload
```
1. Go to http://localhost:3000/profile
2. Click "Edit Profile"
3. Click profile avatar
4. Select image
5. Click "Save Changes"
6. Should see: "Profile updated successfully! ✓"
```

### Test 2: COR Upload (Already Working)
```
1. Go to http://localhost:3000/profile
2. Click "Edit Profile"
3. Scroll to COR section
4. Select image
5. Click "Save Changes"
6. Should see: "Profile updated successfully! ✓"
```

### Test 3: Both Uploads Together
```
1. Go to http://localhost:3000/profile
2. Click "Edit Profile"
3. Select profile picture
4. Select COR image
5. Click "Save Changes"
6. Should see: "Profile updated successfully! ✓"
```

## Error Messages

### If Profile Picture Upload Fails
You'll see: `Profile picture upload failed: [error message]`

Common errors:
- "Bucket not found" → Create profile-pictures bucket
- "Permission denied" → Add INSERT policy
- "Unauthorized" → Check service role key

### If COR Upload Fails
You'll see: `COR upload failed: [error message]`

### If Save Fails
You'll see: `[error message]`

## Server Logs

When uploading, check server terminal for:
```
📤 Uploading profile picture...
📥 ===== UPLOAD REQUEST RECEIVED =====
Content-Type: multipart/form-data
Request file: YES
📤 Uploading to Supabase bucket: profile-pictures/...
```

If error:
```
❌ Supabase upload error details:
   Error message: [ERROR]
   Error status: [STATUS]
```

## Quick Checklist

- [ ] profile-pictures bucket exists
- [ ] profile-pictures bucket is PUBLIC
- [ ] profile-pictures has INSERT policy
- [ ] cor-uploads bucket exists
- [ ] cor-uploads bucket is PUBLIC
- [ ] cor-uploads has INSERT policy
- [ ] Server restarted
- [ ] Browser cache cleared
- [ ] Test upload works

## Next Steps

1. **Add INSERT policy to profile-pictures bucket** (if missing)
2. **Restart server** (if you made changes)
3. **Test profile picture upload**
4. **Test both uploads together**

---

**Status:** Ready to test after adding profile-pictures policy
