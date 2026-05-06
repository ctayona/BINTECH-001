# Faculty External Email Support - Implementation Complete

**Date**: May 3, 2026  
**Status**: ✅ IMPLEMENTED AND TESTED

---

## Overview

The system has been updated to allow **faculty members to sign up with external email addresses** (Gmail, Yahoo, etc.) in addition to UMak institutional emails.

---

## What Changed

### Previous Behavior
- ❌ **Faculty members were required to use UMak email** (format: `firstname.lastname@umak.edu.ph`)
- ❌ **External emails (Gmail, Yahoo, etc.) were rejected** with error: "Invalid email format for faculty. Could not extract campus ID."
- ✅ Only staff members could use external emails

### New Behavior
- ✅ **Faculty can now use UMak email** (format: `firstname.lastname@umak.edu.ph`)
- ✅ **Faculty can now use external emails** (Gmail, Yahoo, Outlook, etc.)
- ✅ **Students still require UMak email** with K-number or A-number (e.g., `name.k12345@umak.edu.ph`)
- ✅ **Staff can use any email** (no change)

---

## Technical Implementation

### 1. Backend Validation Updated

**File**: `controllers/authController.js`

**Changes**:
- Removed strict campus ID requirement for faculty
- Added automatic account ID generation for faculty with external emails
- Updated validation to only require UMak email for students

**Before**:
```javascript
// Rejected faculty with external emails
if ((userRole === 'student' || userRole === 'faculty') && !campusId) {
  return res.status(400).json({
    success: false,
    message: `Invalid email format for ${userRole}. Could not extract campus ID.`
  });
}
```

**After**:
```javascript
// Only students require UMak email
if (userRole === 'student' && !campusId) {
  return res.status(400).json({
    success: false,
    message: `Invalid email format for ${userRole}. Students must use UMak email with K-number or A-number (e.g., name.k12345@umak.edu.ph).`
  });
}
```

### 2. Account ID Generation for External Faculty

**File**: `controllers/authController.js`

**Added Logic**:
```javascript
// For faculty with external email (non-UMak): generate staff account_id
if (userRole === 'faculty' && !campusId) {
  staffAccountId = await generateStaffAccountId();
  console.log(`✓ Generated account_id for external faculty email: ${staffAccountId}`);
}
```

### 3. Database Insertion Logic Updated

**File**: `controllers/authController.js`

**Changes**:
- Faculty with UMak email: Use `faculty_id` extracted from email
- Faculty with external email: Use generated `account_id` (OTH+numbers format)

**Updated Logic**:
```javascript
if (userRole === 'faculty') {
  if (campusId) {
    // UMak faculty email
    roleSpecificData[idColumnName] = campusId;
  } else {
    // External faculty email - use generated account_id
    roleSpecificData.account_id = staffAccountId;
  }
}
```

### 4. Frontend Signup Form Fixed

**File**: `public/js/auth.js`

**Issue Fixed**: Password fields not found when user toggled visibility

**Before**:
```javascript
const passwordInputs = form.querySelectorAll('input[type="password"]');
// Failed when password was toggled to type="text"
```

**After**:
```javascript
const passwordInput = document.getElementById('signup-password');
const confirmPasswordInput = document.getElementById('signup-confirm-password');
// Works regardless of password visibility
```

---

## Email Format Requirements

### Students (Strict)
- ✅ **Required**: UMak email with K-number or A-number
- ✅ **Format**: `firstname.k12345@umak.edu.ph` or `firstname.a12345@umak.edu.ph`
- ❌ **External emails NOT allowed**

### Faculty (Flexible)
- ✅ **Option 1**: UMak email (format: `firstname.lastname@umak.edu.ph`)
  - Uses `faculty_id` extracted from email (e.g., "firstname.lastname")
- ✅ **Option 2**: External email (Gmail, Yahoo, Outlook, etc.)
  - Uses generated `account_id` (format: OTH+numbers, e.g., "OTH001")

### Staff (Flexible)
- ✅ **Any email allowed** (UMak or external)
- ✅ Uses generated `account_id` (format: OTH+numbers)

---

## Database Schema

### Faculty Accounts Table

**Table**: `faculty_accounts`

**ID Columns**:
- `faculty_id` (Text) - For UMak faculty emails (e.g., "firstname.lastname")
- `account_id` (Text) - For external faculty emails (e.g., "OTH001")

**Note**: Faculty records will have either `faculty_id` OR `account_id`, not both.

---

## Example Scenarios

### Scenario 1: Faculty with UMak Email
```
Email: lilibeth.arcalas@umak.edu.ph
Role: faculty
Result: ✅ Success
faculty_id: "lilibeth.arcalas"
account_id: NULL
```

### Scenario 2: Faculty with Gmail
```
Email: juliemaybillones19@gmail.com
Role: faculty
Result: ✅ Success
faculty_id: NULL
account_id: "OTH001" (auto-generated)
```

### Scenario 3: Student with UMak Email
```
Email: john.k12345@umak.edu.ph
Role: student
Result: ✅ Success
student_id: "k12345"
```

### Scenario 4: Student with Gmail
```
Email: student@gmail.com
Role: student
Result: ❌ Error
Message: "Students must use UMak email with K-number or A-number"
```

---

## Testing

### Test Case 1: Faculty with External Email
```bash
POST /auth/register
{
  "email": "juliemaybillones19@gmail.com",
  "password": "Campkrame0_",
  "firstName": "Julia",
  "middleName": "Maye",
  "lastName": "Millones",
  "role": "faculty"
}

Expected: ✅ 201 Created
Response: {
  "success": true,
  "message": "Account created successfully",
  "user": {
    "email": "juliemaybillones19@gmail.com",
    "role": "faculty",
    "account_id": "OTH001"
  }
}
```

### Test Case 2: Faculty with UMak Email
```bash
POST /auth/register
{
  "email": "john.doe@umak.edu.ph",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "faculty"
}

Expected: ✅ 201 Created
Response: {
  "success": true,
  "message": "Account created successfully",
  "user": {
    "email": "john.doe@umak.edu.ph",
    "role": "faculty",
    "faculty_id": "john.doe"
  }
}
```

---

## Migration Notes

### Existing Faculty Accounts
- ✅ **No migration needed** - Existing faculty accounts with UMak emails continue to work
- ✅ **New faculty can use external emails** - System automatically handles both types

### Database Compatibility
- ✅ **Backward compatible** - Existing queries work without modification
- ✅ **No schema changes required** - Uses existing `account_id` column

---

## Files Modified

1. **controllers/authController.js**
   - Updated email validation logic (lines ~327-333)
   - Added account ID generation for external faculty (lines ~308-312)
   - Updated roleSpecificData creation for manual signup (lines ~485-500)
   - Updated roleSpecificData creation for Google signup (lines ~1088-1105)
   - Updated Google login flow to handle external faculty (lines ~975-982)

2. **public/js/auth.js**
   - Fixed password field detection in signup form (lines ~510-550)
   - Changed from type selector to ID selector for password inputs

---

## Benefits

1. ✅ **Increased Accessibility** - Faculty can sign up with any email
2. ✅ **Better User Experience** - No need to remember institutional email
3. ✅ **Flexibility** - Supports visiting faculty, adjuncts, and external collaborators
4. ✅ **Backward Compatible** - Existing faculty accounts continue to work
5. ✅ **Consistent with Staff** - Same flexibility as staff accounts

---

## Conclusion

Faculty members can now sign up with **any email address** (UMak or external), making the system more accessible and user-friendly while maintaining data integrity and security.

**Status**: ✅ Ready for production use

