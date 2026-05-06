# Signup API Integration Details

## Frontend to Backend Flow

### 1. Form Submission
**Trigger:** User clicks "Create Account" button

**Frontend Validation (Before API Call):**
```javascript
✓ All required fields filled
✓ Email format valid
✓ Password meets strength requirements
✓ Passwords match
✓ Terms accepted
```

### 2. API Request

**Endpoint:** `POST /auth/register`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "email": "john.doe@umak.edu.ph",
  "role": "student",
  "password": "SecurePass123!"
}
```

**Request Validation (Backend):**
```
✓ Email format valid
✓ Email not already registered
✓ Password meets strength requirements
✓ Role is valid (student|faculty|staff)
✓ Required fields present
```

### 3. Backend Processing

**Steps:**
1. Validate input data
2. Check if email already exists
3. Hash password with bcrypt (10 rounds)
4. Create user account in database
5. **Send confirmation email** (IMPORTANT)
6. Return success response

**Database Operations:**
```sql
-- Insert into user_accounts table
INSERT INTO user_accounts (
  email,
  password,
  role,
  campus_id,
  status,
  created_at
) VALUES (
  'john.doe@umak.edu.ph',
  '$2b$10$...',  -- bcrypt hash
  'student',
  'K12345',      -- extracted from email
  'active',
  NOW()
)

-- Insert into student_accounts table (if student)
INSERT INTO student_accounts (
  student_id,
  first_name,
  middle_name,
  last_name,
  email,
  created_at
) VALUES (...)
```

### 4. Email Confirmation

**Email Service:** (Backend responsibility)
- Send confirmation email to user
- Include verification link
- Link should contain token/code
- Email should be sent within 1-2 minutes

**Email Template Should Include:**
```
Subject: Confirm Your BinTECH Account

Dear [First Name],

Thank you for signing up for BinTECH!

To complete your registration, please verify your email address by clicking the link below:

[Verification Link]

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
BinTECH Team
```

### 5. Success Response

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "system_id_12345",
    "email": "john.doe@umak.edu.ph",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "status": "active",
    "createdAt": "2024-05-03T10:30:00Z"
  }
}
```

### 6. Frontend Success Handling

**Actions:**
1. Display success modal
2. Show user's email in modal
3. Display email confirmation instructions
4. Clear form
5. Offer navigation options:
   - "Go to Login" → Navigate to login page
   - "Back to Home" → Return to landing page

---

## Error Handling

### Error Response Format

**Status Code:** `400 Bad Request` or `500 Internal Server Error`

**Response Body:**
```json
{
  "success": false,
  "message": "Error description",
  "details": "Additional error details (optional)"
}
```

### Common Error Scenarios

#### 1. Email Already Registered
```json
{
  "success": false,
  "message": "Email already registered",
  "existingEmail": "john.doe@umak.edu.ph"
}
```
**Frontend Action:** Display error message, allow retry with different email

#### 2. Invalid Email Format
```json
{
  "success": false,
  "message": "Invalid email address"
}
```
**Frontend Action:** Display error message, highlight email field

#### 3. Weak Password
```json
{
  "success": false,
  "message": "Password must contain: at least 8 characters, one uppercase letter (A-Z), one number (0-9), and one special character (!@#$%^&*)"
}
```
**Frontend Action:** Display error message with requirements

#### 4. Invalid Role
```json
{
  "success": false,
  "message": "Invalid role. Must be one of: student, faculty, staff",
  "receivedRole": "invalid_role"
}
```
**Frontend Action:** Display error message, reset role dropdown

#### 5. Missing Required Fields
```json
{
  "success": false,
  "message": "Email, password, first name, and last name are required"
}
```
**Frontend Action:** Display error message, highlight empty fields

#### 6. Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```
**Frontend Action:** Display generic error message, allow retry

---

## Frontend Error Display

### Error Message Styling
```css
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #fca5a5;
  font-size: 14px;
}
```

### Error Message Placement
- Appears at the top of the form
- Auto-scrolls into view
- Clears when user starts correcting the issue
- Can be manually dismissed

### Error Message Examples

**Missing Fields:**
```
Error: Please fill in all required fields.
```

**Invalid Email:**
```
Error: Please enter a valid email address.
```

**Weak Password:**
```
Error: Password must contain:
• At least 8 characters
• One uppercase letter (A-Z)
• One number (0-9)
• One special character (!@#$%^&*)
```

**Password Mismatch:**
```
Error: Passwords do not match. Please re-enter your password.
```

**Email Already Registered:**
```
Error: Email already registered
```

**Terms Not Accepted:**
```
Error: You must agree to the Terms of Service and Privacy Policy.
```

---

## Success Modal Display

### Modal Structure
```
┌─────────────────────────────────────┐
│                                     │
│         ✓ (checkmark icon)          │
│                                     │
│      Signup Successful!             │
│  Your account has been created      │
│      successfully.                  │
│                                     │
│  Email Confirmation Instructions:   │
│  1. Confirmation email sent to      │
│     john.doe@umak.edu.ph            │
│  2. Check inbox (and spam folder)   │
│  3. Click verification link         │
│  4. Return and login                │
│                                     │
│  Didn't receive email?              │
│  Check spam folder or contact       │
│  support.                           │
│                                     │
│  [Go to Login] [Back to Home]       │
│                                     │
└─────────────────────────────────────┘
```

### Modal Animations
- **Entrance:** Slide up + fade in (0.4s)
- **Icon:** Scale in (0.5s, 0.2s delay)
- **Exit:** Fade out (0.3s)

---

## Email Verification Flow

### After User Receives Email

**User Actions:**
1. Opens email
2. Clicks verification link
3. Backend verifies token
4. Email marked as verified
5. User can now login

### Backend Email Verification Endpoint

**Endpoint:** `GET /auth/verify-email?token=<verification_token>`

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

---

## Login After Signup

### User Journey
1. Signup successful → Success modal shown
2. User clicks "Go to Login"
3. Navigates to login page
4. Enters email and password
5. Backend verifies credentials
6. User logged in and redirected to dashboard

### Login Endpoint

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "john.doe@umak.edu.ph",
  "password": "SecurePass123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "system_id_12345",
    "email": "john.doe@umak.edu.ph",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "fullName": "John Doe"
  },
  "token": "jwt_token_here",
  "isAdmin": false
}
```

---

## Security Considerations

### Password Security
- ✓ Passwords hashed with bcrypt (10 rounds)
- ✓ Passwords never logged
- ✓ Passwords never sent in response
- ✓ HTTPS required for all requests

### Email Verification
- ✓ Verification token expires after 24 hours
- ✓ Token is cryptographically secure
- ✓ One-time use only
- ✓ Prevents unauthorized email registration

### Input Validation
- ✓ Email format validated
- ✓ Password strength enforced
- ✓ SQL injection prevention (parameterized queries)
- ✓ XSS prevention (input sanitization)

### Rate Limiting
- ✓ Limit signup attempts per IP
- ✓ Limit email verification attempts
- ✓ Prevent brute force attacks

---

## Testing the API

### Using cURL

**Successful Signup:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@umak.edu.ph",
    "role": "student",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": { ... }
}
```

### Using Postman

1. Create new POST request
2. URL: `http://localhost:3000/auth/register`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@umak.edu.ph",
  "role": "student",
  "password": "SecurePass123!"
}
```
5. Click Send

---

## Monitoring & Logging

### Frontend Logging
```javascript
console.log('[Signup] Starting signup process...');
console.log('[Signup] Sending registration request...');
console.log('[Signup] Response:', data);
console.log('[Signup] Registration successful!');
```

### Backend Logging
```
[Registration] Email: john.doe@umak.edu.ph
[Registration] Role: student
[Registration] Password hashed successfully
[Registration] User account created
[Registration] Confirmation email sent
[Registration] Registration complete
```

### Error Logging
```
[Error] Email already registered: john.doe@umak.edu.ph
[Error] Invalid password strength
[Error] Database error: ...
[Error] Email service error: ...
```

---

## Troubleshooting

### Issue: Success modal doesn't appear
**Solution:** Check browser console for errors, verify modal HTML exists

### Issue: Email not received
**Solution:** Check spam folder, verify email service is configured, check backend logs

### Issue: "Email already registered" error
**Solution:** Use different email or reset password if account exists

### Issue: Password validation fails
**Solution:** Ensure password has uppercase, number, special char, and 8+ chars

### Issue: Form doesn't submit
**Solution:** Check browser console for validation errors, verify all fields filled

---

## Future Enhancements

- [ ] Social login (Google, Facebook)
- [ ] Two-factor authentication
- [ ] Email verification resend button
- [ ] CAPTCHA for bot prevention
- [ ] Password strength meter
- [ ] Multi-language support
- [ ] SMS verification option
- [ ] Account recovery options
