# Database Schema Alignment & FK Constraint Fix

## Problem Analysis

### Foreign Key Constraint Error
```
Error: update or delete on table "user_accounts" violates foreign key constraint 
"fk_account_points_campus" on table "account_points"
```

### Root Cause
The `account_points` table has a foreign key constraint:
```sql
CONSTRAINT fk_account_points_campus FOREIGN KEY (campus_id) 
  REFERENCES user_accounts (campus_id) ON DELETE SET NULL
```

When updating a user account, if the code tries to change `campus_id` and there are related records in `account_points`, the constraint is violated.

### Why It Happens
- `campus_id` is UNIQUE in `user_accounts`
- When updating `campus_id`, PostgreSQL checks if the new value violates the FK constraint
- If `account_points` has records with the old `campus_id`, the update fails

---

## Solution Strategy

### 1. Make campus_id READ-ONLY
- Never allow updates to `campus_id` in the UI
- Never send `campus_id` in update payloads
- Display it as read-only information only

### 2. Fix Backend (updateAccountDetails)
- Remove `campus_id` from the update payload
- Only read `campus_id`, never modify it
- Ensure it's generated only during account creation

### 3. Align Modals with Database Schema

#### USER_ACCOUNTS (Base Table - Always Present)
```
Fields:
- system_id (UUID, PK) - READ ONLY
- campus_id (VARCHAR, UNIQUE) - READ ONLY (generated at creation)
- role (VARCHAR) - EDITABLE (student/faculty/other)
- email (VARCHAR, UNIQUE) - READ ONLY (cannot change)
- password (TEXT) - EDITABLE (optional in edit mode)
- created_at (TIMESTAMP) - READ ONLY
- updated_at (TIMESTAMP) - READ ONLY (auto-managed)
- google_id (TEXT, UNIQUE) - EDITABLE
```

#### STUDENT_ACCOUNTS (Role-Specific)
```
Fields:
- system_id (UUID, FK to user_accounts) - READ ONLY
- email (VARCHAR, UNIQUE) - READ ONLY
- student_id (VARCHAR, UNIQUE) - EDITABLE
- first_name (VARCHAR) - EDITABLE
- middle_name (VARCHAR) - EDITABLE
- last_name (VARCHAR) - EDITABLE
- program (VARCHAR) - EDITABLE
- year_level (VARCHAR) - EDITABLE (Dropdown)
- department (VARCHAR) - EDITABLE (Dropdown)
- birthdate (DATE) - EDITABLE
- sex (VARCHAR) - EDITABLE (Dropdown)
- cor (VARCHAR) - EDITABLE (File upload)
- profile_picture (TEXT) - EDITABLE (File upload)
- qr_code (TEXT) - READ ONLY
- qr_value (VARCHAR) - READ ONLY
- created_at (TIMESTAMP) - READ ONLY
- updated_at (TIMESTAMP) - READ ONLY (auto-managed)
```

#### FACULTY_ACCOUNTS (Role-Specific)
```
Fields:
- system_id (UUID, FK to user_accounts) - READ ONLY
- email (VARCHAR, UNIQUE) - READ ONLY
- faculty_id (VARCHAR, UNIQUE) - EDITABLE
- first_name (VARCHAR) - EDITABLE
- middle_name (VARCHAR) - EDITABLE
- last_name (VARCHAR) - EDITABLE
- department (VARCHAR) - EDITABLE (Dropdown)
- position (VARCHAR) - EDITABLE
- birthdate (DATE) - EDITABLE
- sex (VARCHAR) - EDITABLE (Dropdown)
- profile_picture (TEXT) - EDITABLE (File upload)
- qr_code (TEXT) - READ ONLY
- qr_value (VARCHAR) - READ ONLY
- created_at (TIMESTAMP) - READ ONLY
- updated_at (TIMESTAMP) - READ ONLY (auto-managed)
```

#### OTHER_ACCOUNTS (Role-Specific)
```
Fields:
- system_id (UUID, FK to user_accounts) - READ ONLY
- email (VARCHAR, UNIQUE) - READ ONLY
- account_id (VARCHAR, UNIQUE) - EDITABLE
- first_name (VARCHAR) - EDITABLE
- middle_name (VARCHAR) - EDITABLE
- last_name (VARCHAR) - EDITABLE
- designation (VARCHAR) - EDITABLE
- affiliation (VARCHAR) - EDITABLE
- birthdate (DATE) - EDITABLE
- sex (VARCHAR) - EDITABLE (Dropdown)
- points (INTEGER, default 0) - EDITABLE
- profile_picture (TEXT) - EDITABLE (File upload)
- qr_code (TEXT) - READ ONLY
- qr_value (VARCHAR) - READ ONLY
- created_at (TIMESTAMP) - READ ONLY
- updated_at (TIMESTAMP) - READ ONLY (auto-managed)
```

---

## Implementation Steps

### Step 1: Fix Backend (adminController.js)
- Remove `campus_id` from update payload in `updateAccountDetails`
- Ensure `campus_id` is only set during account creation
- Keep `campus_id` as read-only in responses

### Step 2: Update HTML Modals (ADMIN_ACCOUNTS.html)
- Remove any editable campus_id fields
- Keep campus_id as display-only in view modal
- Ensure all fields match the schema exactly

### Step 3: Update JavaScript Functions
- Remove campus_id from form data collection
- Ensure role-based field visibility is correct
- Validate all required fields before submission

### Step 4: Test
- Create new user accounts (all roles)
- Edit existing user accounts (all roles)
- View user accounts (all roles)
- Verify no FK constraint errors

---

## Field Visibility by Modal

### ADD MODAL

**Always Visible:**
- Email (required)
- Account Type (required)
- Role (required)
- Password (required)
- Confirm Password (required)
- Google ID (optional)
- Profile Picture (optional)

**Student-Specific:**
- Student ID (auto-generated if empty)
- First Name, Middle Name, Last Name
- Program
- Year Level (Dropdown)
- Department (Dropdown)
- Birthdate
- Sex (Dropdown)
- COR (File upload)

**Faculty-Specific:**
- Faculty ID (auto-generated if empty)
- First Name, Middle Name, Last Name
- Department (Dropdown)
- Position
- Birthdate
- Sex (Dropdown)

**Other-Specific:**
- Account ID (auto-generated if empty)
- First Name, Middle Name, Last Name
- Designation
- Affiliation
- Birthdate
- Sex (Dropdown)
- Points (default 0)

### EDIT MODAL

**Always Visible (Read-Only):**
- Email
- Campus ID
- Account Type
- Created At
- Updated At

**Always Visible (Editable):**
- Role (can change role)
- Google ID
- Profile Picture
- Password (optional, leave blank to keep current)

**Role-Specific (Editable):**
- Same as Add Modal, but with existing values pre-filled

### VIEW MODAL

**All Fields Read-Only:**
- Display all fields from user_accounts and role-specific table
- Show timestamps in formatted MM/DD/YYYY | hh:mm AM/PM format
- Show password as "Set" or "Not set" (never show actual password)

---

## Password Handling

### Requirements
- Minimum 8 characters
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character

### UI
- Eye toggle to show/hide password
- Real-time validation feedback
- Confirm password field (must match)

### Backend
- Hash with bcrypt before storing
- Never display hashed password in UI
- Optional in edit mode (leave blank to keep current)

---

## Timestamp Handling

### Display Format
```
MM/DD/YYYY | hh:mm AM/PM
Example: 04/30/2026 | 02:45 PM
```

### Rules
- Read-only (no editing)
- Auto-managed by database triggers
- Display in view modal only
- Use `timestampUtils.formatDateForDisplay()` function

---

## Implementation Checklist

### Backend (adminController.js)
- [ ] Remove `campus_id` from update payload
- [ ] Keep `campus_id` in response (read-only)
- [ ] Ensure password is optional in edit mode
- [ ] Validate all required fields

### Frontend (ADMIN_ACCOUNTS.html)
- [ ] Remove editable campus_id fields
- [ ] Keep campus_id display-only in view modal
- [ ] Ensure all role-specific fields are correct
- [ ] Add password eye toggle
- [ ] Add real-time password validation
- [ ] Ensure timestamps are formatted correctly

### Testing
- [ ] Create student account
- [ ] Create faculty account
- [ ] Create other account
- [ ] Edit student account
- [ ] Edit faculty account
- [ ] Edit other account
- [ ] View all account types
- [ ] Verify no FK constraint errors
- [ ] Verify password validation works
- [ ] Verify timestamps display correctly

---

## Notes

- `campus_id` is auto-generated during account creation and should never be modified
- All timestamps are auto-managed by database triggers
- Password is optional in edit mode (leave blank to keep current)
- Role can be changed, which moves the account to a different role-specific table
- All role-specific fields must be present in the appropriate table
