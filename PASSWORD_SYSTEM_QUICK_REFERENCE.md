# Password System - Quick Reference Guide

## Overview
Comprehensive secure password system with real-time validation, eye toggle visibility, and bcrypt hashing.

---

## Quick Start

### For Users:

**Adding a New Account:**
1. Click "Add User" button
2. Fill in basic information
3. Enter password (8+ chars, uppercase, lowercase, number, special char)
4. See real-time feedback for each requirement
5. Click eye icon to show/hide password
6. Enter confirm password
7. See real-time feedback for password match
8. Click "Add User" to submit

**Editing an Account:**
1. Click edit icon on account row
2. Modify account details as needed
3. (Optional) Enter new password in "New Password" field
4. If changing password:
   - See real-time feedback for each requirement
   - Click eye icon to show/hide password
   - Enter confirm password
   - See real-time feedback for password match
5. Click "Save Changes" to submit

**Viewing an Account:**
1. Click view icon on account row
2. See all account details
3. Password shows as "********" (masked)
4. No password input fields

---

## Password Requirements

```
✓ Minimum 8 characters
✓ At least 1 uppercase letter (A-Z)
✓ At least 1 lowercase letter (a-z)
✓ At least 1 number (0-9)
✓ At least 1 special character (@$!%*?&)
```

---

## Frontend Implementation

### JavaScript Functions

**`validatePasswordStrength(passwordFieldId, feedbackContainerId)`**
- Validates password strength in real-time
- Updates feedback with ✓ (green) and ✗ (red)
- Called on every keystroke

**`validatePasswordMatch(passwordFieldId, confirmFieldId, feedbackContainerId)`**
- Validates password match in real-time
- Updates feedback with ✓ (green) and ✗ (red)
- Called on every keystroke

**`togglePasswordVisibility(fieldId)`**
- Toggles password visibility (show/hide)
- Changes icon to indicate current state
- Works for all password fields

### HTML Elements

**Add Modal:**
- `addPassword` - Password input
- `addPasswordEye` - Eye toggle
- `addConfirmPassword` - Confirm password input
- `addConfirmPasswordEye` - Eye toggle
- `addPasswordFeedback` - Feedback container
- `addPasswordLength`, `addPasswordUpper`, `addPasswordLower`, `addPasswordNumber`, `addPasswordSpecial` - Individual requirements
- `addPasswordMatch` - Match feedback container
- `addPasswordMatchText` - Match status

**Edit Modal:**
- `editPassword` - Password input
- `editPasswordEye` - Eye toggle
- `editConfirmPassword` - Confirm password input
- `editConfirmPasswordEye` - Eye toggle
- `editPasswordFeedback` - Feedback container
- `editPasswordLength`, `editPasswordUpper`, `editPasswordLower`, `editPasswordNumber`, `editPasswordSpecial` - Individual requirements
- `editPasswordMatch` - Match feedback container
- `editPasswordMatchText` - Match status

---

## Backend Implementation

### Password Hashing

**Location:** `controllers/adminController.js`

**Account Creation:**
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
// Store hashedPassword in database
```

**Account Update:**
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(passwordText, 10);
// Store hashedPassword in database
```

### Password Validation

**Regex Pattern:**
```javascript
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
```

**Validation:**
- Minimum 8 characters
- At least 1 lowercase letter
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

---

## Security Features

### Frontend:
- Real-time validation prevents invalid submissions
- Eye toggle allows users to verify password entry
- Clear feedback on password requirements
- Passwords never displayed in View modal

### Backend:
- Passwords validated on server-side
- Passwords hashed with bcrypt (10 salt rounds)
- Plain text passwords never stored
- Passwords never returned in API responses
- Only `has_password` flag returned

---

## Common Tasks

### Add a New User with Password:
```javascript
// Frontend validation
1. User enters password
2. Real-time feedback shows requirements
3. User enters confirm password
4. Real-time feedback shows match status
5. Form submission validates all requirements

// Backend processing
1. Validate password strength
2. Hash password with bcrypt
3. Store hashed password in database
```

### Update User Password:
```javascript
// Frontend validation
1. User enters new password (optional)
2. If password provided:
   - Real-time feedback shows requirements
   - User enters confirm password
   - Real-time feedback shows match status
3. Form submission validates if password provided

// Backend processing
1. If password provided:
   - Validate password strength
   - Hash password with bcrypt
   - Store hashed password in database
2. If password not provided:
   - Keep existing password
```

### View User Account:
```javascript
// Frontend display
1. Show all account details
2. Password shows as "********" (masked)
3. No password input fields
4. Read-only display only
```

---

## Troubleshooting

### Password Validation Not Working:
1. Check browser console for errors
2. Verify `validatePasswordStrength()` function exists
3. Verify `validatePasswordMatch()` function exists
4. Check HTML element IDs match function parameters

### Password Not Hashing:
1. Check bcrypt is installed: `npm list bcrypt`
2. Check bcrypt is required in controller
3. Check password is being hashed before storage
4. Check database field accepts hashed password

### Eye Toggle Not Working:
1. Check `togglePasswordVisibility()` function exists
2. Check eye icon element IDs are correct
3. Check password field IDs are correct
4. Check browser console for errors

### Password Match Not Showing:
1. Check `validatePasswordMatch()` function exists
2. Check feedback container ID is correct
3. Check feedback text element ID is correct
4. Check `oninput` event is attached to confirm field

---

## Testing

### Manual Testing:

**Add Modal:**
1. Click "Add User"
2. Enter password: "Test123"
   - Should show ✗ for special character
3. Enter password: "Test123!"
   - Should show ✓ for all requirements
4. Enter confirm password: "Test123!"
   - Should show ✓ for password match
5. Click "Add User"
   - Should create account with hashed password

**Edit Modal:**
1. Click edit on existing account
2. Leave password fields blank
   - Should keep existing password
3. Enter new password: "NewPass123!"
   - Should show ✓ for all requirements
4. Enter confirm password: "NewPass123!"
   - Should show ✓ for password match
5. Click "Save Changes"
   - Should update account with new hashed password

**View Modal:**
1. Click view on existing account
2. Password should show as "********"
3. No password input fields
4. All fields should be read-only

---

## API Endpoints

### Create Account
```
POST /api/admin/accounts
Body: {
  type: 'admin' | 'user',
  email: 'user@example.com',
  role: 'student' | 'faculty' | 'staff' | 'admin' | 'head',
  password: 'SecurePass123!',
  ...other fields
}
Response: {
  success: true,
  message: 'Account created successfully',
  account: {...}
}
```

### Update Account
```
PUT /api/admin/accounts/:email?type=admin|user
Body: {
  role: 'student' | 'faculty' | 'staff' | 'admin' | 'head',
  password: 'NewPass123!' (optional),
  ...other fields
}
Response: {
  success: true,
  message: 'Account updated successfully',
  account: {...}
}
```

---

## Files Reference

### Frontend:
- `templates/ADMIN_ACCOUNTS.html` - UI and validation functions

### Backend:
- `controllers/adminController.js` - Password hashing and validation

### Dependencies:
- `bcrypt` - Password hashing library

---

## Best Practices

1. **Always validate on both frontend and backend**
   - Frontend for user experience
   - Backend for security

2. **Never store plain text passwords**
   - Always hash with bcrypt
   - Use 10 salt rounds minimum

3. **Never display passwords**
   - Show masked "********" instead
   - Use `has_password` flag for status

4. **Always use eye toggle**
   - Helps users verify password entry
   - Improves user experience

5. **Always provide clear feedback**
   - Show which requirements are met/unmet
   - Use visual indicators (✓ green, ✗ red)

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check server logs for backend errors
3. Verify all HTML element IDs are correct
4. Verify all JavaScript functions are defined
5. Check bcrypt is installed and working

---

## Version History

- **v1.0** (April 30, 2026) - Initial implementation
  - Real-time password validation
  - Eye toggle visibility
  - Bcrypt hashing
  - Optional password update in Edit modal
  - Required password in Add modal
  - No password display in View modal
