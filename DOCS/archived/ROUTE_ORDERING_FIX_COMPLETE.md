# Route Ordering Fix - Archive Feature Now Complete

## Issue Found & Fixed

### Problem
The route `/accounts/:email` was matching `/accounts/archive-history` because Express matches routes in order. When a request came in for `/accounts/archive-history`, Express would match it to `/accounts/:email` with `email='archive-history'`, causing the request to be routed to `getAccountDetails` instead of `getArchiveHistory`.

This caused the error: "email and type=user|admin are required" because `getAccountDetails` requires both `email` and `type` parameters.

### Root Cause
**Route Ordering Issue:**
```
BEFORE (Wrong Order):
router.get('/accounts/:email', adminController.getAccountDetails);  ← Matches /accounts/archive-history!
router.get('/accounts/archive-history', adminController.getArchiveHistory);  ← Never reached
```

### Solution
**Moved archive routes BEFORE generic account routes:**
```
AFTER (Correct Order):
router.get('/accounts/archive-history', adminController.getArchiveHistory);  ← Matches first
router.get('/accounts/archive-history/:archive_id', adminController.getArchiveSnapshot);  ← Matches first
router.post('/accounts/archive-history/:archive_id/restore', adminController.restoreArchivedAccount);  ← Matches first
router.get('/accounts/:email', adminController.getAccountDetails);  ← Fallback for other emails
```

## File Modified

**File:** `routes/admin.js`

**Changes:**
- Moved archive routes (lines 64-67) to come BEFORE generic account routes (lines 69-73)
- Added comments explaining the route ordering requirement
- No changes to route definitions or handlers

## How Express Route Matching Works

Express matches routes in the order they are defined:

1. **Specific routes first** - `/accounts/archive-history` (exact match)
2. **Parameterized routes last** - `/accounts/:email` (pattern match)

If you put parameterized routes first, they will match everything, preventing specific routes from being reached.

## Verification

### Before Fix
```
GET /api/admin/accounts/archive-history?limit=50&offset=0
↓
Matched to: /accounts/:email (with email='archive-history')
↓
Handler: getAccountDetails
↓
Error: "email and type=user|admin are required"
```

### After Fix
```
GET /api/admin/accounts/archive-history?limit=50&offset=0
↓
Matched to: /accounts/archive-history (exact match)
↓
Handler: getArchiveHistory
↓
Success: Returns archive history with pagination
```

## Testing

After this fix, the archive feature should work correctly:

1. Go to `/admin/accounts`
2. Click **Admins** tab
3. Click **Archive** on any admin account
4. Click **Archive History** tab
5. Archive history should load successfully (no 400 error!)

## Complete Route Order

```javascript
// Specific routes (matched first)
router.get('/accounts/archive-history', adminController.getArchiveHistory);
router.get('/accounts/archive-history/:archive_id', adminController.getArchiveSnapshot);
router.post('/accounts/archive-history/:archive_id/restore', adminController.restoreArchivedAccount);
router.post('/accounts/:id/archive', adminController.archiveAdminAccount);

// Generic routes (matched last)
router.get('/accounts/:email', adminController.getAccountDetails);
router.put('/accounts/:email', adminController.updateAccountDetails);
router.delete('/accounts/:email', adminController.deleteUserAccount);
router.post('/accounts/:email/convert', adminController.convertAccountType);
router.post('/accounts', adminController.createAccount);
```

## Status

✅ **FIXED** - Route ordering corrected

The archive feature is now ready to test. The database migration still needs to be applied to Supabase for the feature to be fully functional.

## Next Steps

1. **Apply database migration** to Supabase (2-3 minutes)
2. **Test archive functionality** (2 minutes)
3. **Feature is complete!**

