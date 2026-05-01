# Password Recovery Feature - Changes Summary

## Overview
Fixed a critical database query issue in the password recovery feature that was preventing OTP emails from being sent. The feature is now fully functional and production-ready.

---

## Root Cause Analysis

### Problem
The password recovery controller was attempting to query `first_name`, `middle_name`, and `last_name` columns from the `user_accounts` table, but these columns don't exist in that table.

### Database Schema
- **user_accounts table**: Contains `system_id`, `role`, `email`, `password`, `created_at`, `updated_at`, `google_id`
- **student_accounts table**: Contains `first_name`, `middle_name`, `last_name`, `student_id`, `email`
- **faculty_accounts table**: Contains `first_name`, `middle_name`, `last_name`, `faculty_id`, `email`
- **staff_accounts table**: Contains `first_name`, `middle_name`, `last_name`, `account_id`, `email`

### Error Message
```
column user_accounts.first_name does not exist
```

---

## Changes Made

### File 1: `controllers/passwordRecoveryController.js`

#### Change 1.1: Fixed `forgotPassword()` function - User Query
**Location**: Lines 73-85

**Before**:
```javascript
const { data: user, error: queryError } = await supabase
  .from('user_accounts')
  .select('system_id, first_name, email')
  .eq('email', normalizedEmail)
  .single();
```

**After**:
```javascript
console.log(`[Password Recovery] Querying user_accounts for email: ${normalizedEmail}`);
const { data: userAccount, error: queryError } = await supabase
  .from('user_accounts')
  .select('system_id, role, email')
  .eq('email', normalizedEmail)
  .single();

if (queryError) {
  console.error(`[Password Recovery] Query error for ${normalizedEmail}:`, queryError.message);
  console.error(`[Password Recovery] Error details:`, queryError);
}

if (queryError || !userAccount) {
  console.log(`[Password Recovery] User not found: ${normalizedEmail}`);
  console.log(`[Password Recovery] Query error: ${queryError ? queryError.message : 'No error, but user is null'}`);
  auditLogger.recordFailedAttempt(normalizedEmail, 'User not found', ipAddress, userAgent);
```

**Reason**: Query only the columns that exist in `user_accounts` table. Added detailed logging for debugging.

#### Change 1.2: Fixed `forgotPassword()` function - Get First Name from Role Table
**Location**: Lines 106-125

**Before**:
```javascript
const emailSent = await emailService.sendOTPEmail(normalizedEmail, otp, user.first_name);
```

**After**:
```javascript
// Get user's first name from role-specific table for personalization
let firstName = 'User';
const roleTable = userAccount.role === 'student' ? 'student_accounts' 
                : userAccount.role === 'faculty' ? 'faculty_accounts'
                : userAccount.role === 'staff' ? 'staff_accounts'
                : null;

if (roleTable) {
  const { data: roleProfile } = await supabase
    .from(roleTable)
    .select('first_name')
    .eq('email', normalizedEmail)
    .single();
  
  if (roleProfile && roleProfile.first_name) {
    firstName = roleProfile.first_name;
  }
}

const emailSent = await emailService.sendOTPEmail(normalizedEmail, otp, firstName);
```

**Reason**: Query `first_name` from the appropriate role-specific table based on the user's role. Use default "User" if not found.

#### Change 1.3: Fixed `resetPassword()` function - User Query
**Location**: Lines 234-250

**Before**:
```javascript
const { data: user, error: queryError } = await supabase
  .from('user_accounts')
  .select('system_id, password, first_name, email')
  .eq('email', normalizedEmail)
  .single();

if (queryError || !user) {
  console.log(`[Password Recovery] User not found for: ${normalizedEmail}`);
  auditLogger.recordPasswordReset(normalizedEmail, false, 'User not found', ipAddress, userAgent);
  
  return res.status(400).json({
    success: false,
    message: 'User not found'
  });
}
```

**After**:
```javascript
const { data: userAccount, error: queryError } = await supabase
  .from('user_accounts')
  .select('system_id, password, role, email')
  .eq('email', normalizedEmail)
  .single();

if (queryError || !userAccount) {
  console.log(`[Password Recovery] User not found for: ${normalizedEmail}`);
  auditLogger.recordPasswordReset(normalizedEmail, false, 'User not found', ipAddress, userAgent);
  
  return res.status(400).json({
    success: false,
    message: 'User not found'
  });
}

// Get user's first name from role-specific table for confirmation email
let firstName = 'User';
const roleTable = userAccount.role === 'student' ? 'student_accounts' 
                : userAccount.role === 'faculty' ? 'faculty_accounts'
                : userAccount.role === 'staff' ? 'staff_accounts'
                : null;

if (roleTable) {
  const { data: roleProfile } = await supabase
    .from(roleTable)
    .select('first_name')
    .eq('email', normalizedEmail)
    .single();
  
  if (roleProfile && roleProfile.first_name) {
    firstName = roleProfile.first_name;
  }
}
```

**Reason**: Query only the columns that exist in `user_accounts` table. Query `first_name` from role-specific table.

#### Change 1.4: Fixed `resetPassword()` function - Use userAccount Variable
**Location**: Lines 280-320

**Before**:
```javascript
const isDifferent = await passwordValidator.isDifferentFromOld(newPassword, user.password);
// ... validation code ...
const { error: updateError } = await supabase
  .from('user_accounts')
  .update({
    password: hashedPassword,
    updated_at: new Date().toISOString()
  })
  .eq('system_id', user.system_id);
// ... more code ...
await emailService.sendPasswordResetConfirmation(normalizedEmail, user.first_name);
```

**After**:
```javascript
const isDifferent = await passwordValidator.isDifferentFromOld(newPassword, userAccount.password);
// ... validation code ...
const { error: updateError } = await supabase
  .from('user_accounts')
  .update({
    password: hashedPassword,
    updated_at: new Date().toISOString()
  })
  .eq('system_id', userAccount.system_id);
// ... more code ...
await emailService.sendPasswordResetConfirmation(normalizedEmail, firstName);
```

**Reason**: Use the correct variable names (`userAccount` instead of `user`, `firstName` instead of `user.first_name`).

---

### File 2: `controllers/passwordRecoveryController.test.js`

#### Change 2.1: Updated `forgotPassword` test - Mock Both Queries
**Location**: Test "should send OTP for valid email with existing user"

**Before**:
```javascript
supabase.from.mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({
    data: {
      system_id: 'user-123',
      first_name: 'John',
      email: 'student@umak.edu.ph'
    },
    error: null
  })
});
```

**After**:
```javascript
supabase.from.mockImplementation((table) => {
  if (table === 'user_accounts') {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          system_id: 'user-123',
          role: 'student',
          email: 'student@umak.edu.ph'
        },
        error: null
      })
    };
  } else if (table === 'student_accounts') {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          first_name: 'John'
        },
        error: null
      })
    };
  }
});
```

**Reason**: Mock both the `user_accounts` query and the `student_accounts` query to match the new implementation.

#### Change 2.2: Updated Rate Limiting Test
**Location**: Test "should enforce rate limiting (3 requests per hour)"

**Changes**: Updated to mock both `user_accounts` and `student_accounts` queries.

#### Change 2.3: Updated Email Failure Test
**Location**: Test "should return error if email sending fails"

**Changes**: Updated to mock both `user_accounts` and `student_accounts` queries.

#### Change 2.4: Updated OTP Storage Failure Test
**Location**: Test "should return error if OTP storage fails"

**Changes**: Updated to mock both `user_accounts` and `student_accounts` queries.

#### Change 2.5: Updated Reset Password Test
**Location**: Test "should reset password with valid session and strong password"

**Changes**: Updated to mock both `user_accounts` and `student_accounts` queries, and use `role` field.

#### Change 2.6: Updated Password Same as Old Test
**Location**: Test "should reject password same as old password"

**Changes**: Updated to mock both `user_accounts` and `student_accounts` queries.

---

## Test Results

### Before Changes
```
Test Suites: 2 failed, 6 passed, 8 total
Tests:       6 failed, 193 passed, 199 total
```

### After Changes
```
Test Suites: 1 failed, 7 passed, 8 total
Tests:       5 failed, 194 passed, 199 total
```

### Password Recovery Controller Tests
```
Test Suites: 1 passed
Tests:       27 passed (100%)
```

---

## Verification

### End-to-End Test
✅ Password recovery flow tested successfully:
1. Initiate recovery → OTP generated and sent
2. Verify OTP → OTP verified successfully
3. Reset password → Password updated and confirmation email sent

### Email Delivery
✅ OTP emails sent successfully via Gmail SMTP:
- Message ID: `<832b9d65-2798-635a-64f3-a207075b9c7a@gmail.com>`
- SMTP Response: `250 2.0.0 OK` (success)

### Database Queries
✅ Queries now work correctly:
- `user_accounts` query returns: `system_id`, `role`, `email`
- Role-specific table query returns: `first_name`

---

## Impact Analysis

### What Changed
- Database query logic in password recovery controller
- Test mocks to match new query structure
- Added detailed logging for debugging

### What Didn't Change
- API endpoints (same URLs and request/response formats)
- Email templates (same professional HTML)
- Security features (same OTP, rate limiting, audit logging)
- Frontend UI (same forms and user experience)
- Database schema (no migrations needed)

### Backward Compatibility
✅ Fully backward compatible - no breaking changes

---

## Deployment Notes

### No Database Migrations Required
The fix doesn't require any database schema changes. The `user_accounts` table already has the `role` column, and the role-specific tables already have the `first_name` column.

### Environment Variables
No new environment variables required. Existing Gmail SMTP configuration continues to work.

### Testing
Run tests to verify: `npm test`

### Rollback Plan
If needed, revert the changes to `controllers/passwordRecoveryController.js` and `controllers/passwordRecoveryController.test.js`.

---

## Summary

This fix resolves the critical issue preventing OTP emails from being sent. The password recovery feature is now fully functional and ready for production use.

**Key Changes**:
1. Fixed database queries to use correct table columns
2. Added role-based lookup for user's first name
3. Updated tests to mock both queries
4. Added detailed logging for debugging

**Result**: 
- ✅ All 27 password recovery tests passing
- ✅ OTP emails sent successfully
- ✅ Complete password recovery flow working end-to-end
- ✅ Production-ready
