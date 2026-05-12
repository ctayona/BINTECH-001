# Developer Quick Reference - FK Fix & Schema Alignment

## What Was Fixed

### 1. Foreign Key Constraint Error
**Problem:** `update or delete on table "user_accounts" violates foreign key constraint "fk_account_points_campus"`

**Solution:** Removed `campus_id` from update payload in backend

**File:** `controllers/adminController.js` (Line ~1905)

**Result:** ✅ campus_id is now read-only, no more FK errors

---

### 2. Student Department Data Loss
**Problem:** Student department was lost when editing because JavaScript read from wrong field

**Solution:** Fixed JavaScript to read from correct field based on role

**Files:** `templates/ADMIN_ACCOUNTS.html` (Lines ~1520, ~1610)

**Result:** ✅ Student department now saves correctly

---

## Quick Code Changes

### Backend Change
```javascript
// BEFORE (Line ~1905)
const updates = {
  campus_id: cleanNullableString(payload.campus_id),  // ❌ REMOVED
  role: payload.role ?? 'student',
  google_id: cleanNullableString(payload.google_id),
  updated_at: new Date().toISOString()
};

// AFTER
const updates = {
  role: payload.role ?? 'student',
  google_id: cleanNullableString(payload.google_id),
  updated_at: new Date().toISOString()
};
```

### Frontend Change 1 - Load Department
```javascript
// BEFORE (Line ~1520)
document.getElementById('editDepartment').value = account.department || '';

// AFTER
const role = String(account.role || '').trim().toLowerCase();
if (role === 'student') {
  document.getElementById('editStudentDepartment').value = account.department || '';
} else if (role === 'faculty') {
  document.getElementById('editDepartment').value = account.department || '';
}
```

### Frontend Change 2 - Save Department
```javascript
// BEFORE (Line ~1610)
payload.department = String(document.getElementById('editDepartment')?.value || '').trim();

// AFTER
if (role === 'student') {
  payload.department = String(document.getElementById('editStudentDepartment')?.value || '').trim();
} else if (role === 'faculty') {
  payload.department = String(document.getElementById('editDepartment')?.value || '').trim();
}
```

---

## Field Mapping Reference

### Department Fields
| Role | Add Modal | Edit Modal | Database |
|------|-----------|-----------|----------|
| Student | `addStudentDepartment` | `editStudentDepartment` | student_accounts.department |
| Faculty | `addDepartment` | `editDepartment` | faculty_accounts.department |

### Read-Only Fields (Never Update)
- `campus_id` - Set at creation, never modified
- `email` - Unique, cannot change
- `system_id` - Primary key
- `created_at` - Auto-managed
- `updated_at` - Auto-managed by trigger
- `qr_code` - Auto-generated
- `qr_value` - Auto-generated

### Editable Fields
- `role` - Can change (moves to different table)
- `password` - Optional in edit mode
- `google_id` - Optional
- `profile_picture` - File upload
- All role-specific fields (name, ID, etc.)

---

## Testing Checklist

### Quick Test
```bash
# 1. Create student account
- Fill form with student role
- Select department from dropdown
- Submit
- Verify: No FK errors, department saved

# 2. Edit student account
- Open existing student account
- Change department
- Save
- Verify: Department updated, no FK errors

# 3. Create faculty account
- Fill form with faculty role
- Select department from dropdown
- Submit
- Verify: No FK errors, department saved

# 4. Edit faculty account
- Open existing faculty account
- Change department
- Save
- Verify: Department updated, no FK errors
```

---

## Common Issues & Solutions

### Issue: "campus_id cannot be changed"
**Cause:** Trying to update campus_id
**Solution:** campus_id is read-only, don't send it in updates
**Status:** ✅ Fixed in backend

### Issue: "Student department not saving"
**Cause:** Reading from wrong field (editDepartment instead of editStudentDepartment)
**Solution:** Use role-based field selection
**Status:** ✅ Fixed in frontend

### Issue: "FK constraint violation"
**Cause:** Trying to update campus_id when account_points records exist
**Solution:** Never update campus_id
**Status:** ✅ Fixed in backend

---

## Database Schema Quick Reference

### user_accounts
```
system_id (UUID) - PK
campus_id (VARCHAR) - UNIQUE, READ-ONLY
role (VARCHAR) - student/faculty/other
email (VARCHAR) - UNIQUE, READ-ONLY
password (TEXT) - EDITABLE
google_id (TEXT) - UNIQUE, EDITABLE
created_at (TIMESTAMP) - READ-ONLY
updated_at (TIMESTAMP) - READ-ONLY
```

### student_accounts
```
system_id (UUID) - PK, FK to user_accounts
email (VARCHAR) - UNIQUE
student_id (VARCHAR) - UNIQUE
first_name, middle_name, last_name
program
year_level
department ← NOW CORRECTLY HANDLED
birthdate
sex
cor
profile_picture
qr_code, qr_value
created_at, updated_at
```

### faculty_accounts
```
system_id (UUID) - PK, FK to user_accounts
email (VARCHAR) - UNIQUE
faculty_id (VARCHAR) - UNIQUE
first_name, middle_name, last_name
department
position
birthdate
sex
profile_picture
qr_code, qr_value
created_at, updated_at
```

### other_accounts
```
system_id (UUID) - PK, FK to user_accounts
email (VARCHAR) - UNIQUE
account_id (VARCHAR) - UNIQUE
first_name, middle_name, last_name
designation
affiliation
birthdate
sex
points (DEFAULT 0)
profile_picture
qr_code, qr_value
created_at, updated_at
```

---

## API Endpoints

### Create User
```
POST /api/admin/accounts
Body: {
  email, type, role, password, ...roleSpecificFields
}
```

### Update User
```
PUT /api/admin/accounts/:email?type=user|admin
Body: {
  role, password, ...roleSpecificFields
  // NOTE: campus_id is NOT included
}
```

### Get User
```
GET /api/admin/accounts/:email?type=user|admin
```

### Delete User
```
DELETE /api/admin/accounts/:email?type=user|admin
```

---

## Form IDs Reference

### Add Modal
- `addEmail`, `addType`, `addRole`
- `addPassword`, `addConfirmPassword`
- `addGoogleId`, `addProfileFile`
- Student: `addStudentId`, `addProgram`, `addYearLevel`, `addStudentDepartment`, `addCor`
- Faculty: `addFacultyId`, `addDepartment`, `addPosition`
- Other: `addAccountId`, `addDesignation`, `addAffiliation`, `addPoints`

### Edit Modal
- `editEmail`, `editType`, `editRole`
- `editPassword`, `editConfirmPassword`
- `editGoogleId`, `editProfileFile`
- Student: `editStudentId`, `editProgram`, `editYearLevel`, `editStudentDepartment`, `editCorFile`
- Faculty: `editFacultyId`, `editDepartment`, `editPosition`
- Other: `editAccountId`, `editDesignation`, `editAffiliation`, `editPoints`

---

## Debugging Tips

### Check Department Field
```javascript
// In browser console
console.log('Student Dept:', document.getElementById('editStudentDepartment').value);
console.log('Faculty Dept:', document.getElementById('editDepartment').value);
```

### Check Payload
```javascript
// Add this in handleEditAccount before fetch
console.log('Payload:', payload);
// Verify department is included
// Verify campus_id is NOT included
```

### Check Response
```javascript
// In browser console after update
console.log('Response:', data);
// Verify account.department is updated
// Verify no error message
```

---

## Performance Notes

- No database queries changed
- No new indexes needed
- No migration required
- Minimal code changes
- No performance impact

---

## Rollback Instructions

If issues occur:

1. Revert `controllers/adminController.js` to previous version
2. Revert `templates/ADMIN_ACCOUNTS.html` to previous version
3. No database cleanup needed
4. No data recovery needed
5. Existing accounts continue to work

---

## Related Documentation

- `FK_CONSTRAINT_FIX_COMPLETE.md` - Detailed fix explanation
- `MODAL_SCHEMA_ALIGNMENT_REFERENCE.md` - Complete field mapping
- `DATABASE_SCHEMA_ALIGNMENT_PLAN.md` - Schema overview
- `COMPLETE_FIX_SUMMARY_FINAL.md` - Executive summary

---

**Last Updated:** April 30, 2026
**Status:** ✅ READY FOR DEPLOYMENT
