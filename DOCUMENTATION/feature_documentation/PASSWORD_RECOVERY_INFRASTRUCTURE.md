# Password Recovery Infrastructure Documentation

## Overview

This document describes the password recovery infrastructure and utilities created for the BinTECH application. The infrastructure provides secure OTP-based password recovery with email delivery, password validation, and comprehensive audit logging.

## Created Files

### Services

#### 1. `services/passwordRecoveryService.js`
**Purpose**: Manages OTP generation, storage, validation, and recovery session lifecycle

**Key Functions**:
- `generateOTP()` - Generates cryptographically secure 6-digit OTP codes
- `storeOTP(email, otp, expiryMinutes)` - Stores OTP with expiration timestamp
- `verifyOTP(email, otp)` - Verifies OTP against stored value with attempt tracking
- `isOTPExpired(email)` - Checks if OTP has expired
- `invalidateOTP(email)` - Removes OTP session
- `verifyRecoveryToken(email, token)` - Validates recovery token
- `getRecoverySession(email)` - Retrieves session details
- `updateRecoverySession(email, updates)` - Updates session fields
- `cleanupExpiredSessions()` - Removes expired sessions (maintenance)
- `getCacheStats()` - Returns cache statistics for debugging

**Configuration**:
- OTP Length: 6 digits
- OTP Expiry: 10 minutes
- Max Attempts: 5 failed verification attempts
- Storage: In-memory cache (can be replaced with Redis)

**Example Usage**:
```javascript
const passwordRecoveryService = require('./services/passwordRecoveryService');

// Generate and store OTP
const otp = passwordRecoveryService.generateOTP();
passwordRecoveryService.storeOTP('user@example.com', otp);

// Verify OTP
const result = passwordRecoveryService.verifyOTP('user@example.com', otp);
if (result.success) {
  console.log('OTP verified, recovery token:', result.recoveryToken);
}
```

#### 2. `services/emailService.js`
**Purpose**: Handles OTP email delivery and password reset confirmation emails

**Key Functions**:
- `sendOTPEmail(email, otp, userName)` - Sends OTP email with HTML template
- `sendPasswordResetConfirmation(email, userName)` - Sends confirmation email
- `generateOTPEmailTemplate(userName, otp, expiryMinutes)` - Generates OTP email HTML
- `generatePasswordResetConfirmationTemplate(userName)` - Generates confirmation email HTML
- `verifyConnection()` - Tests email transporter connection
- `initializeTransporter()` - Initializes Nodemailer transporter

**Configuration** (via environment variables):
- `EMAIL_HOST` - SMTP server host (default: smtp.gmail.com)
- `EMAIL_PORT` - SMTP server port (default: 587)
- `EMAIL_USER` - SMTP authentication username
- `EMAIL_PASSWORD` - SMTP authentication password
- `EMAIL_FROM` - Sender email address (default: EMAIL_USER)

**Example Usage**:
```javascript
const emailService = require('./services/emailService');

// Send OTP email
const sent = await emailService.sendOTPEmail(
  'user@example.com',
  '123456',
  'John'
);

if (sent) {
  console.log('OTP email sent successfully');
}
```

### Libraries

#### 3. `lib/passwordValidator.js`
**Purpose**: Validates password strength, hashing, and comparison

**Key Functions**:
- `validateStrength(password)` - Validates password against strength requirements
- `validateMatch(password, confirmPassword)` - Checks if passwords match
- `hashPassword(password)` - Hashes password using bcrypt
- `comparePassword(plainPassword, hashedPassword)` - Compares plain and hashed passwords
- `isDifferentFromOld(newPassword, oldHashedPassword)` - Checks if new password differs from old
- `validatePasswordReset(newPassword, confirmPassword, oldHashedPassword)` - Complete reset validation
- `getPasswordRequirements()` - Returns human-readable requirements
- `getPasswordConfig()` - Returns configuration object

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Example Usage**:
```javascript
const passwordValidator = require('./lib/passwordValidator');

// Validate password strength
const result = passwordValidator.validateStrength('SecurePass123!');
if (result.isValid) {
  console.log('Password is strong');
} else {
  console.log('Password requirements:', result.reason);
}

// Hash password
const hash = await passwordValidator.hashPassword('SecurePass123!');

// Compare passwords
const match = await passwordValidator.comparePassword('SecurePass123!', hash);
```

#### 4. `lib/auditLogger.js`
**Purpose**: Logs password recovery actions for security and compliance

**Key Functions**:
- `record(logData)` - Records audit log entry
- `recordOTPInitiation(email, ipAddress, userAgent)` - Logs OTP request
- `recordOTPSent(email, ipAddress, userAgent)` - Logs OTP email sent
- `recordOTPVerification(email, success, failureReason, ipAddress, userAgent)` - Logs OTP verification
- `recordPasswordReset(email, success, failureReason, ipAddress, userAgent)` - Logs password reset
- `recordFailedAttempt(email, failureReason, ipAddress, userAgent)` - Logs failed attempt
- `readLogs(limit)` - Reads audit logs from file
- `filterByEmail(email, limit)` - Filters logs by email
- `filterByAction(action, limit)` - Filters logs by action
- `filterByStatus(status, limit)` - Filters logs by status
- `getStatistics()` - Returns audit statistics
- `clearLogs()` - Clears all audit logs

**Log Actions**:
- `INITIATED` - Password recovery initiated
- `OTP_SENT` - OTP email sent
- `OTP_VERIFIED` - OTP verification attempt
- `PASSWORD_RESET` - Password reset attempt
- `FAILED_ATTEMPT` - Failed recovery attempt

**Log Statuses**:
- `SUCCESS` - Action completed successfully
- `FAILURE` - Action failed

**Log File**:
- Location: `logs/password-recovery-audit.log`
- Format: JSON (one entry per line)
- Rotation: Automatic when file exceeds 10MB
- Backups: Up to 5 backup files retained

**Example Usage**:
```javascript
const auditLogger = require('./lib/auditLogger');

// Record OTP initiation
auditLogger.recordOTPInitiation(
  'user@example.com',
  '192.168.1.1',
  'Mozilla/5.0'
);

// Read recent logs
const logs = auditLogger.readLogs(100);

// Get statistics
const stats = auditLogger.getStatistics();
console.log('Total entries:', stats.totalEntries);
console.log('Success rate:', stats.successCount / stats.totalEntries);
```

## Data Models

### PasswordRecoverySession
```javascript
{
  email: String,                    // User email (normalized to lowercase)
  otp: String,                      // 6-digit OTP code
  otpCreatedAt: Date,              // Timestamp when OTP was created
  otpExpiresAt: Date,              // Timestamp when OTP expires
  otpAttempts: Number,             // Number of failed verification attempts
  maxAttempts: Number,             // Maximum allowed attempts (5)
  isVerified: Boolean,             // Whether OTP has been verified
  recoveryToken: String,           // Unique token for password reset
  createdAt: Date,                 // Session creation timestamp
  updatedAt: Date                  // Last update timestamp
}
```

### AuditLogEntry
```javascript
{
  timestamp: String,               // ISO 8601 timestamp
  email: String,                   // User email (normalized to lowercase)
  action: String,                  // INITIATED, OTP_SENT, OTP_VERIFIED, PASSWORD_RESET, FAILED_ATTEMPT
  status: String,                  // SUCCESS or FAILURE
  failureReason: String|null,      // Reason for failure (if applicable)
  ipAddress: String,               // Client IP address
  userAgent: String,               // Client user agent
  additionalInfo: Object|null      // Additional context (optional)
}
```

## Integration Points

### With Existing Auth System
The password recovery infrastructure integrates with the existing authentication system:

1. **User Lookup**: Uses `user_accounts` table to verify email exists
2. **Password Update**: Updates password in `user_accounts` table
3. **Role-Specific Tables**: Retrieves user information from role-specific tables (student_accounts, faculty_accounts, other_accounts)

### With Email System
Uses existing Nodemailer configuration:
- Requires `EMAIL_USER` and `EMAIL_PASSWORD` environment variables
- Supports Gmail, Office 365, and other SMTP providers
- Falls back gracefully if email not configured

### With Database
Uses Supabase client from `config/supabase.js`:
- Queries user_accounts table
- Updates password field
- Supports transaction-like operations

## Security Features

### OTP Security
- Cryptographically secure random generation using `crypto.randomBytes()`
- 6-digit codes (1 million combinations)
- 10-minute expiration window
- Maximum 5 verification attempts
- Session invalidation after max attempts

### Password Security
- Bcrypt hashing with 10 salt rounds
- Strength validation (8+ chars, uppercase, lowercase, numbers, special chars)
- Password confirmation matching
- Prevention of reusing old password
- Secure comparison using bcrypt.compare()

### Session Security
- Cryptographically secure recovery tokens
- Session invalidation after successful reset
- Session invalidation after max attempts
- Email normalization to prevent case-sensitivity issues

### Audit Trail
- All recovery actions logged with timestamp
- IP address and user agent captured
- Success/failure status recorded
- Failure reasons documented
- Log rotation to prevent disk space issues

## Testing

### Unit Tests
Comprehensive unit tests are provided for all components:

1. **passwordRecoveryService.test.js**
   - OTP generation and uniqueness
   - OTP storage and retrieval
   - OTP expiration
   - OTP verification with attempt tracking
   - Recovery token validation
   - Session management

2. **passwordValidator.test.js**
   - Password strength validation
   - Password matching
   - Password hashing
   - Password comparison
   - Password reset validation
   - Requirements checking

3. **auditLogger.test.js**
   - Log recording
   - Log filtering (by email, action, status)
   - Log statistics
   - Log file management
   - Log entry format validation

4. **emailService.test.js**
   - Email template generation
   - Email sending
   - Email normalization
   - Template content quality

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- passwordRecoveryService.test.js

# Run with coverage
npm test -- --coverage
```

## Configuration

### Environment Variables
```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@bintech.com

# Supabase Configuration (existing)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Password Configuration
Edit `lib/passwordValidator.js` to customize:
```javascript
const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  bcryptSaltRounds: 10
};
```

### OTP Configuration
Edit `services/passwordRecoveryService.js` to customize:
```javascript
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
```

## Performance Considerations

- **OTP Generation**: <10ms (cryptographic random)
- **Email Delivery**: <2 seconds (async operation)
- **Database Queries**: <50ms (indexed lookups)
- **Cache Operations**: <5ms (in-memory)
- **Password Hashing**: <500ms (bcrypt with 10 rounds)
- **Log Operations**: <10ms (file I/O)

## Maintenance

### Regular Tasks
1. **Monitor Audit Logs**: Check for suspicious patterns
2. **Clean Expired Sessions**: Run `cleanupExpiredSessions()` periodically
3. **Rotate Log Files**: Automatic at 10MB, manual via `clearLogs()`
4. **Update Dependencies**: Keep bcrypt and nodemailer current

### Troubleshooting

**Emails not sending**:
- Verify EMAIL_USER and EMAIL_PASSWORD are set
- Check SMTP server configuration
- Run `emailService.verifyConnection()` to test

**OTP verification failing**:
- Check OTP hasn't expired (10 minute window)
- Verify attempt count hasn't exceeded 5
- Check email normalization (lowercase)

**Password validation failing**:
- Verify password meets all requirements
- Check password confirmation matches
- Ensure new password differs from old

## Future Enhancements

1. **Redis Integration**: Replace in-memory cache with Redis for distributed systems
2. **Rate Limiting**: Implement IP-based rate limiting for brute force prevention
3. **SMS OTP**: Add SMS delivery option for OTP
4. **Backup Codes**: Generate backup codes for account recovery
5. **Two-Factor Authentication**: Integrate with existing 2FA system
6. **Password History**: Track password history to prevent reuse
7. **Biometric Recovery**: Support fingerprint/face recognition for recovery

## Support

For issues or questions about the password recovery infrastructure:
1. Check the test files for usage examples
2. Review the inline code comments
3. Check the audit logs for error details
4. Verify environment variables are configured correctly
