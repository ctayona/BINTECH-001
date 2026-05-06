# Signup Flow Testing Guide

## Quick Start Testing

### Test Case 1: Successful Signup
**Steps:**
1. Navigate to the landing page
2. Click "Sign In" button in the header
3. Fill in the signup form:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@umak.edu.ph (or any valid email)
   - Role: Student
   - Password: SecurePass123!
   - Confirm Password: SecurePass123!
   - Check "I agree to Terms of Service"
4. Click "Create Account"

**Expected Result:**
- Button shows "Creating Account..."
- Success modal appears with:
  - Green checkmark icon
  - "Signup Successful!" heading
  - User's email displayed
  - 4-step email confirmation instructions
  - "Go to Login" and "Back to Home" buttons
- Form clears

**Verification:**
- [ ] Modal displays correctly
- [ ] Email is shown in the modal
- [ ] Buttons are clickable
- [ ] "Go to Login" navigates to login page
- [ ] "Back to Home" returns to landing page

---

### Test Case 2: Missing Required Fields
**Steps:**
1. Go to signup page
2. Leave "First Name" empty
3. Fill other fields correctly
4. Click "Create Account"

**Expected Result:**
- Error message appears: "Please fill in all required fields."
- Error message is styled in red box
- Form does NOT submit
- Button remains enabled for retry

**Verification:**
- [ ] Error message displays inline
- [ ] Error message auto-scrolls into view
- [ ] Error message is dismissible when user starts typing

---

### Test Case 3: Invalid Email Format
**Steps:**
1. Go to signup page
2. Enter email: "invalidemail" (without @)
3. Fill other fields correctly
4. Click "Create Account"

**Expected Result:**
- Error message: "Please enter a valid email address."
- Form does NOT submit

**Verification:**
- [ ] Email validation works
- [ ] Error displays inline

---

### Test Case 4: Weak Password
**Steps:**
1. Go to signup page
2. Enter password: "weak" (less than 8 chars, no uppercase, no number, no special char)
3. Fill other fields correctly
4. Click "Create Account"

**Expected Result:**
- Error message displays password requirements
- Form does NOT submit

**Verification:**
- [ ] Password strength validation works
- [ ] Error message is clear

---

### Test Case 5: Password Mismatch
**Steps:**
1. Go to signup page
2. Enter password: "SecurePass123!"
3. Enter confirm password: "DifferentPass123!"
4. Fill other fields correctly
5. Click "Create Account"

**Expected Result:**
- Error message: "Passwords do not match. Please re-enter your password."
- Form does NOT submit

**Verification:**
- [ ] Password matching validation works

---

### Test Case 6: Terms Not Accepted
**Steps:**
1. Go to signup page
2. Fill all fields correctly
3. DO NOT check "I agree to Terms of Service"
4. Click "Create Account"

**Expected Result:**
- Error message: "You must agree to the Terms of Service and Privacy Policy."
- Form does NOT submit

**Verification:**
- [ ] Terms checkbox validation works

---

### Test Case 7: Email Already Registered
**Steps:**
1. Go to signup page
2. Enter an email that's already registered
3. Fill other fields correctly
4. Click "Create Account"

**Expected Result:**
- Error message from backend: "Email already registered"
- Form does NOT submit
- Button returns to normal state

**Verification:**
- [ ] Backend validation error is displayed
- [ ] User can retry with different email

---

### Test Case 8: Password Requirements Indicator
**Steps:**
1. Go to signup page
2. Click on password field
3. Type: "a" (doesn't meet requirements)
4. Type: "aA" (still doesn't meet)
5. Type: "aA1" (still doesn't meet)
6. Type: "aA1!" (meets all requirements)

**Expected Result:**
- Password requirements checkmarks update in real-time
- When all requirements are met, all checkmarks turn green

**Verification:**
- [ ] Real-time validation works
- [ ] Visual feedback is clear

---

### Test Case 9: Mobile Responsiveness
**Steps:**
1. Open signup page on mobile device (or use browser dev tools)
2. Fill form on mobile
3. Submit form

**Expected Result:**
- Form is readable on mobile
- Success modal is centered and properly sized
- Buttons are easily clickable
- No horizontal scrolling needed

**Verification:**
- [ ] Mobile layout works
- [ ] Touch interactions work
- [ ] Modal is visible on small screens

---

### Test Case 10: Error Message Clearing
**Steps:**
1. Go to signup page
2. Leave first name empty
3. Click "Create Account"
4. Error message appears
5. Type in first name field
6. Error message should disappear

**Expected Result:**
- Error message clears when user starts correcting the issue
- User can resubmit form

**Verification:**
- [ ] Error clearing works
- [ ] User can retry without page refresh

---

## Browser Testing

Test on these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Backend Integration Testing

### Verify Backend Sends Confirmation Email

**Steps:**
1. Complete successful signup
2. Check email inbox for confirmation email
3. Verify email contains:
   - User's name
   - Confirmation link
   - Instructions
   - Company branding

**Expected Result:**
- Confirmation email arrives within 1-2 minutes
- Email is properly formatted
- Confirmation link works

---

## Error Scenarios to Test

### Network Error
**Steps:**
1. Disconnect internet
2. Try to signup
3. Reconnect internet

**Expected Result:**
- Error message: "Network error" or similar
- User can retry when connection is restored

### Server Error (500)
**Steps:**
1. Backend returns 500 error
2. User tries to signup

**Expected Result:**
- Error message: "Server error. Please try again later."
- User can retry

### Timeout
**Steps:**
1. Backend takes >30 seconds to respond
2. User tries to signup

**Expected Result:**
- Request times out
- Error message displayed
- User can retry

---

## Accessibility Testing

- [ ] Form is keyboard navigable
- [ ] Tab order is logical
- [ ] Error messages are announced to screen readers
- [ ] Modal can be closed with Escape key
- [ ] Color contrast meets WCAG standards
- [ ] Form labels are properly associated with inputs

---

## Performance Testing

- [ ] Form loads quickly
- [ ] Validation happens instantly
- [ ] Success modal appears within 1 second
- [ ] No lag when typing in fields
- [ ] Button click response is immediate

---

## Security Testing

- [ ] Password is not visible in network requests (HTTPS)
- [ ] Password is not logged in console
- [ ] Form data is not stored in localStorage
- [ ] CSRF protection is in place (if applicable)
- [ ] Input sanitization prevents XSS

---

## Regression Testing

After any changes, verify:
- [ ] Login still works
- [ ] Password recovery still works
- [ ] Admin login still works
- [ ] Navigation between pages works
- [ ] Logout still works

---

## Test Data

### Valid Test Emails
- student.k12345@umak.edu.ph (Student)
- faculty.a67890@umak.edu.ph (Faculty)
- staff@umak.edu.ph (Staff)
- john.doe@gmail.com (External)

### Valid Test Passwords
- SecurePass123!
- MyPassword@2024
- Test#Pass123

### Invalid Test Passwords
- weak (too short)
- NoNumbers! (no numbers)
- nonumbers123 (no uppercase)
- NoSpecial123 (no special char)

---

## Debugging Tips

### Check Browser Console
```javascript
// Look for [Signup] logs
console.log('[Signup] ...')
```

### Check Network Tab
- Verify POST request to `/auth/register`
- Check request payload
- Check response status and body

### Check Local Storage
```javascript
// In browser console
localStorage.getItem('user')
sessionStorage.getItem('bintech_user')
```

### Test Success Modal Functions
```javascript
// In browser console
showSignupSuccessModal('test@example.com')
proceedToLogin()
closeSuccessModal()
```

---

## Known Issues & Workarounds

(To be updated as issues are discovered)

---

## Sign-Off

- [ ] All test cases passed
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for production

**Tested by:** _______________
**Date:** _______________
**Notes:** _______________
