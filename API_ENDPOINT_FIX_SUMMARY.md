# API Endpoint Fix - Archive Feature

## Issue Found
The frontend was calling API endpoints with incorrect paths, causing 404 errors.

**Error in browser console:**
```
GET http://localhost:3000/admin/accounts/archive-history?limit=50&offset=0 404 (Not Found)
Load archive history error: Error: Page not found
```

## Root Cause
The backend routes are registered at `/api/admin/*` but the frontend was calling `/admin/accounts/*` (missing the `/api` prefix).

## Routes Configuration
In `app.js`, routes are registered as:
```javascript
app.use('/api/admin', adminRoutes);
```

This means all admin routes must be prefixed with `/api/admin/`.

## Fixes Applied

### File: `templates/ADMIN_ACCOUNTS.html`

#### Fix 1: Archive Account Endpoint
**Before:**
```javascript
const response = await fetch(`/admin/accounts/${encodeURIComponent(adminId)}/archive`, {
```

**After:**
```javascript
const response = await fetch(`/api/admin/accounts/${encodeURIComponent(adminId)}/archive`, {
```
**Line:** 2464

#### Fix 2: Get Archive History Endpoint
**Before:**
```javascript
const response = await fetch('/admin/accounts/archive-history?limit=50&offset=0', {
```

**After:**
```javascript
const response = await fetch('/api/admin/accounts/archive-history?limit=50&offset=0', {
```
**Line:** 2499

#### Fix 3: Get Archive Snapshot Endpoint
**Before:**
```javascript
const response = await fetch(`/admin/accounts/archive-history/${encodeURIComponent(archiveId)}`, {
```

**After:**
```javascript
const response = await fetch(`/api/admin/accounts/archive-history/${encodeURIComponent(archiveId)}`, {
```
**Line:** 2554

#### Fix 4: Restore Archived Account Endpoint
**Before:**
```javascript
const response = await fetch(`/admin/accounts/archive-history/${encodeURIComponent(archiveId)}/restore`, {
```

**After:**
```javascript
const response = await fetch(`/api/admin/accounts/archive-history/${encodeURIComponent(archiveId)}/restore`, {
```
**Line:** 2681

## Verification

All archive-related API calls now use the correct `/api/admin/` prefix:

✅ `POST /api/admin/accounts/:id/archive`
✅ `GET /api/admin/accounts/archive-history`
✅ `GET /api/admin/accounts/archive-history/:archive_id`
✅ `POST /api/admin/accounts/archive-history/:archive_id/restore`

## Testing

After this fix, the archive feature should work correctly:

1. Go to `/admin/accounts`
2. Click **Admins** tab
3. Click **Archive** on any admin account
4. Confirm archive action
5. Click **Archive History** tab
6. Archive history should load successfully (no 404 error)
7. Test View Snapshot
8. Test Restore

## Status

✅ **FIXED** - All API endpoints now use correct paths

The feature is now ready to test. The database migration still needs to be applied to Supabase for the feature to be fully functional.

