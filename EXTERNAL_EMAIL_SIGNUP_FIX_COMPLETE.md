# External Email Signup - Fix Complete

**Date**: May 3, 2026  
**Status**: ✅ FIXED (Database migration required)

---

## Issues Fixed

### 1. ✅ Database Schema Error
**Error**: `Could not find the 'account_id' column of 'faculty_accounts' in the schema cache`

**Cause**: The `faculty_accounts` table was missing the `account_id` column needed for external email support.

**Solution**: Created SQL migration to add `account_id` column to `faculty_accounts` table.

### 2. ✅ UX Issue - Student Option Visible for External Emails
**Problem**: Users with external emails could select "Student" role, which would then be rejected by the backend.

**Solution**: Updated frontend to hide "Student" option when external email is detected.

---

## What Changed

### Frontend Changes

**File**: `templates/LANDING_PAGE.HTML`

**Updated**: `classifyEmailRole()` function

**New Behavior**:
- ✅ **UMak student email** (e.g., `name.k12345@umak.edu.ph`)
  - Shows: "Student" option
  - Auto-selects: Student
  - Locks: Role dropdown 🔒

- ✅ **UMak faculty email** (e.g., `name@umak.edu.ph`)
  - Hides: "Student" option
  - Auto-selects: Faculty
  - Locks: Role dropdown 🔒

- ✅ **External email** (e.g., `name@gmail.com`)
  - Hides: "Student" option
  - Shows: Only "Faculty" and "Staff/Others"
  - Unlocks: Role dropdown 🔓
  - Message: "⚠️ Select Faculty or Staff/Others (students must use UMak email)"

### Database Changes

**File**: `migrations/add_account_id_to_faculty_accounts.sql`

**Changes**:
```sql
-- Add account_id column to faculty_accounts
ALTER TABLE public.faculty_accounts 
ADD COLUMN IF NOT EXISTS account_id text NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_faculty_accounts_account_id 
ON public.faculty_accounts USING btree (account_id);
```

**Impact**:
- Faculty with UMak emails: Use `faculty_id` column
- Faculty with external emails: Use `account_id` column

---

## How It Works Now

### Signup Flow for Different Email Types

#### 1. Student with UMak Email ✅
```
Email: john.k12345@umak.edu.ph
Role: Student (auto-selected, locked)
Result: ✅ Success
```

#### 2. Student with External Email ❌
```
Email: john@gmail.com
Role: Student option is HIDDEN
Result: Cannot select Student role
```

#### 3. Faculty with UMak Email ✅
```
Email: john.doe@umak.edu.ph
Role: Faculty (auto-selected, locked)
Result: ✅ Success
Uses: faculty_id = "john.doe"
```

#### 4. Faculty with External Email ✅
```
Email: john@gmail.com
Role: Faculty (manually selected)
Result: ✅ Success (after migration)
Uses: account_id = "OTH001"
```

#### 5. Staff with Any Email ✅
```
Email: staff@gmail.com or staff@umak.edu.ph
Role: Staff/Others (manually selected)
Result: ✅ Success
Uses: account_id = "OTH001"
```

---

## Required Action: Apply Database Migration

**⚠️ IMPORTANT**: You must apply the SQL migration before faculty can sign up with external emails.

### Quick Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run Migration**
   - Copy SQL from `migrations/add_account_id_to_faculty_accounts.sql`
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - Should see: "Success. No rows returned"
   - Run verification query:
     ```sql
     SELECT column_name FROM information_schema.columns
     WHERE table_name = 'faculty_accounts' AND column_name = 'account_id';
     ```
   - Should return: `account_id`

**Detailed Instructions**: See `APPLY_FACULTY_ACCOUNT_ID_MIGRATION.md`

---

## Testing Checklist

After applying the migration, test these scenarios:

- [ ] **Student with UMak email** (e.g., `name.k12345@umak.edu.ph`)
  - Role auto-selected to "Student"
  - Signup succeeds

- [ ] **Student with external email** (e.g., `name@gmail.com`)
  - "Student" option is hidden
  - Cannot select Student role

- [ ] **Faculty with UMak email** (e.g., `name@umak.edu.ph`)
  - Role auto-selected to "Faculty"
  - Signup succeeds
  - Uses `faculty_id`

- [ ] **Faculty with external email** (e.g., `name@gmail.com`)
  - "Student" option is hidden
  - Can select "Faculty"
  - Signup succeeds
  - Uses `account_id`

- [ ] **Staff with external email** (e.g., `name@gmail.com`)
  - "Student" option is hidden
  - Can select "Staff/Others"
  - Signup succeeds
  - Uses `account_id`

---

## User Experience Improvements

### Before Fix
```
User enters: john@gmail.com
Dropdown shows: [Student] [Faculty] [Staff/Others]
User selects: Student
Result: ❌ Error - "Invalid email format for student"
```

### After Fix
```
User enters: john@gmail.com
Dropdown shows: [Faculty] [Staff/Others]
Message: "⚠️ Select Faculty or Staff/Others (students must use UMak email)"
User selects: Faculty or Staff/Others
Result: ✅ Success
```

---

## Files Modified

1. **templates/LANDING_PAGE.HTML**
   - Updated `classifyEmailRole()` function
   - Hides "Student" option for external emails
   - Shows helpful message

2. **migrations/add_account_id_to_faculty_accounts.sql** (NEW)
   - Adds `account_id` column to `faculty_accounts` table
   - Creates index for performance

3. **APPLY_FACULTY_ACCOUNT_ID_MIGRATION.md** (NEW)
   - Step-by-step migration instructions

4. **EXTERNAL_EMAIL_SIGNUP_FIX_COMPLETE.md** (NEW)
   - This summary document

---

## Summary

✅ **Frontend**: Student option now hidden for external emails  
✅ **Backend**: Already supports external faculty emails  
⚠️ **Database**: Migration required (see instructions above)  
✅ **Documentation**: Complete guides created

**Next Step**: Apply the database migration to enable faculty signup with external emails.

---

## Support

If you encounter issues:
1. Check that migration was applied successfully
2. Verify `account_id` column exists in `faculty_accounts` table
3. Check browser console for JavaScript errors
4. Check server logs for backend errors

