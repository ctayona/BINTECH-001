# Password Recovery - Quick Test Guide

## Testing the Password Recovery Flow

### Step 1: Navigate to Password Recovery
1. Go to the login page (http://localhost:3000)
2. Click "Forgot Password?" link
3. You should see the password recovery form

### Step 2: Request OTP
1. Enter a valid email address (must be registered in the system)
2. Click "Send OTP"
3. You should see: "OTP sent to your email. Please check your inbox."
4. Check the email inbox for the OTP code

### Step 3: Verify OTP
1. Enter the 6-digit OTP code from the email
2. Click "Verify OTP"
3. You should see: "OTP verified successfully. Please set your new password."

### Step 4: Reset Password
1. Enter your new password (must meet requirements):
   - At least 8 characters
   - At least one uppercase letter
   - At least one number
   - At least one special character
2. Confirm the password
3. Click "Reset Password"
4. You should see: "Password reset successfully! Redirecting to login..."

### Step 5: Login with New Password
1. You'll be redirected to the login page
2. Enter your email and new password
3. Click "Login"
4. You should be logged in successfully

## Expected Emails

### Email 1: OTP Code
- **Subject:** Your BinTECH Password Recovery Code
- **Contains:** 6-digit OTP code, expiry time (10 minutes)
- **Action:** Copy the code and enter it in the form

### Email 2: Confirmation
- **Subject:** Your BinTECH Password Has Been Reset Successfully
- **Contains:** Success message, login link, security tips
- **Action:** Click link to go to login page

## Troubleshooting

### "An error occurred. Please try again."
- Check that the email address is registered in the system
- Verify email service is configured (check .env file)
- Check server logs for detailed error messages

### "OTP must be 6 digits"
- Make sure you're entering exactly 6 digits
- The form auto-formats as: XXX XXX

### "Passwords do not match"
- Ensure both password fields have the same value
- Check for extra spaces or typos

### "Password requirements not met"
- Password must be at least 8 characters
- Must include uppercase letter (A-Z)
- Must include number (0-9)
- Must include special character (!@#$%^&*)

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check email service configuration in .env
- Check server logs for email sending errors

## Email Service Configuration

Required environment variables in `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### POST /api/auth/forgot-password
Request:
```json
{
  "email": "user@example.com"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "OTP sent to your email. Please check your inbox.",
  "recoveryToken": "token-string"
}
```

### POST /api/auth/verify-otp
Request:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "recoveryToken": "token-string"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "recoveryToken": "token-string"
}
```

### POST /api/auth/reset-password
Request:
```json
{
  "email": "user@example.com",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!",
  "recoveryToken": "token-string"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

## Debug Commands

Check if email service is working:
```bash
curl http://localhost:3000/api/auth/debug/test-email?email=test@example.com
```

Check all registered emails:
```bash
curl http://localhost:3000/api/auth/debug/check-emails
```
