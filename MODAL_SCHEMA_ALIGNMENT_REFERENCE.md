# Modal Schema Alignment Reference

## Database Schema Overview

### user_accounts (Base Table)
```sql
CREATE TABLE user_accounts (
  system_id uuid PRIMARY KEY,
  campus_id varchar(50) UNIQUE,
  role varchar(20),
  email varchar(255) UNIQUE,
  password text,
  google_id text UNIQUE,
  created_at timestamp,
  updated_at timestamp
)
```

### student_accounts (Role-Specific)
```sql
CREATE TABLE student_accounts (
  system_id uuid PRIMARY KEY FK,
  email varchar(255) UNIQUE,
  student_id varchar(50) UNIQUE,
  first_name varchar(100),
  middle_name varchar(100),
  last_name varchar(100),
  program varchar(100),
  year_level varchar(20),
  department varchar(100),
  birthdate date,
  sex varchar(20),
  cor varchar(100),
  profile_picture text,
  qr_code text,
  qr_value varchar(255),
  created_at timestamp,
  updated_at timestamp
)
```

### faculty_accounts (Role-Specific)
```sql
CREATE TABLE faculty_accounts (
  system_id uuid PRIMARY KEY FK,
  email varchar(255) UNIQUE,
  faculty_id varchar(50) UNIQUE,
  first_name varchar(100),
  middle_name varchar(100),
  last_name varchar(100),
  department varchar(100),
  position varchar(100),
  birthdate date,
  sex varchar(20),
  profile_picture text,
  qr_code text,
  qr_value varchar(255),
  created_at timestamp,
  updated_at timestamp
)
```

### other_accounts (Role-Specific)
```sql
CREATE TABLE other_accounts (
  system_id uuid PRIMARY KEY FK,
  email varchar(255) UNIQUE,
  account_id varchar(50) UNIQUE,
  first_name varchar(100),
  middle_name varchar(100),
  last_name varchar(100),
  designation varchar(100),
  affiliation varchar(100),
  birthdate date,
  sex varchar(20),
  points integer DEFAULT 0,
  profile_picture text,
  qr_code text,
  qr_value varchar(255),
  created_at timestamp,
  updated_at timestamp
)
```

---

## ADD MODAL - Field Mapping

### Always Visible (Required)
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Email | addEmail | text | user_accounts | email | ✅ |
| Account Type | addType | select | - | - | ✅ |
| Role | addRole | select | user_accounts | role | ✅ |
| Password | addPassword | password | user_accounts | password | ✅ |
| Confirm Password | addConfirmPassword | password | - | - | ✅ |

### Always Visible (Optional)
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Google ID | addGoogleId | text | user_accounts | google_id | ✅ |
| Profile Picture | addProfileFile | file | role_table | profile_picture | ✅ |

### Student-Specific (role = "student")
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Student ID | addStudentId | text | student_accounts | student_id | ✅ |
| First Name | addUserFirstName | text | student_accounts | first_name | ✅ |
| Middle Name | addUserMiddleName | text | student_accounts | middle_name | ✅ |
| Last Name | addUserLastName | text | student_accounts | last_name | ✅ |
| Program | addProgram | text | student_accounts | program | ✅ |
| Year Level | addYearLevel | select | student_accounts | year_level | ✅ |
| Department | addStudentDepartment | select | student_accounts | department | ✅ |
| Birthdate | addBirthdate | date | student_accounts | birthdate | ✅ |
| Sex | addSex | select | student_accounts | sex | ✅ |
| COR | addCorFile | file | student_accounts | cor | ✅ |

### Faculty-Specific (role = "faculty")
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Faculty ID | addFacultyId | text | faculty_accounts | faculty_id | ✅ |
| First Name | addUserFirstName | text | faculty_accounts | first_name | ✅ |
| Middle Name | addUserMiddleName | text | faculty_accounts | middle_name | ✅ |
| Last Name | addUserLastName | text | faculty_accounts | last_name | ✅ |
| Department | addDepartment | select | faculty_accounts | department | ✅ |
| Position | addPosition | text | faculty_accounts | position | ✅ |
| Birthdate | addBirthdate | date | faculty_accounts | birthdate | ✅ |
| Sex | addSex | select | faculty_accounts | sex | ✅ |

### Other-Specific (role = "other")
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Account ID | addAccountId | text | other_accounts | account_id | ✅ |
| First Name | addUserFirstName | text | other_accounts | first_name | ✅ |
| Middle Name | addUserMiddleName | text | other_accounts | middle_name | ✅ |
| Last Name | addUserLastName | text | other_accounts | last_name | ✅ |
| Designation | addDesignation | text | other_accounts | designation | ✅ |
| Affiliation | addAffiliation | text | other_accounts | affiliation | ✅ |
| Birthdate | addBirthdate | date | other_accounts | birthdate | ✅ |
| Sex | addSex | select | other_accounts | sex | ✅ |
| Points | addPoints | number | other_accounts | points | ✅ |

---

## EDIT MODAL - Field Mapping

### Always Visible (Read-Only)
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Email | editEmail | text | user_accounts | email | ❌ |
| Campus ID | editCampusId | text | user_accounts | campus_id | ❌ |
| Account Type | editType | text | - | - | ❌ |

### Always Visible (Editable)
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Role | editRole | select | user_accounts | role | ✅ |
| Google ID | editGoogleId | text | user_accounts | google_id | ✅ |
| Profile Picture | editProfileFile | file | role_table | profile_picture | ✅ |
| Password | editPassword | password | user_accounts | password | ✅ |
| Confirm Password | editConfirmPassword | password | - | - | ✅ |

### Student-Specific (role = "student")
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Student ID | editStudentId | text | student_accounts | student_id | ✅ |
| First Name | editUserFirstName | text | student_accounts | first_name | ✅ |
| Middle Name | editUserMiddleName | text | student_accounts | middle_name | ✅ |
| Last Name | editUserLastName | text | student_accounts | last_name | ✅ |
| Program | editProgram | text | student_accounts | program | ✅ |
| Year Level | editYearLevel | select | student_accounts | year_level | ✅ |
| Department | editStudentDepartment | select | student_accounts | department | ✅ |
| Birthdate | editBirthdate | date | student_accounts | birthdate | ✅ |
| Sex | editSex | select | student_accounts | sex | ✅ |
| COR | editCorFile | file | student_accounts | cor | ✅ |

### Faculty-Specific (role = "faculty")
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Faculty ID | editFacultyId | text | faculty_accounts | faculty_id | ✅ |
| First Name | editUserFirstName | text | faculty_accounts | first_name | ✅ |
| Middle Name | editUserMiddleName | text | faculty_accounts | middle_name | ✅ |
| Last Name | editUserLastName | text | faculty_accounts | last_name | ✅ |
| Department | editDepartment | select | faculty_accounts | department | ✅ |
| Position | editPosition | text | faculty_accounts | position | ✅ |
| Birthdate | editBirthdate | date | faculty_accounts | birthdate | ✅ |
| Sex | editSex | select | faculty_accounts | sex | ✅ |

### Other-Specific (role = "other")
| Field | HTML ID | Type | DB Table | DB Column | Editable |
|-------|---------|------|----------|-----------|----------|
| Account ID | editAccountId | text | other_accounts | account_id | ✅ |
| First Name | editUserFirstName | text | other_accounts | first_name | ✅ |
| Middle Name | editUserMiddleName | text | other_accounts | middle_name | ✅ |
| Last Name | editUserLastName | text | other_accounts | last_name | ✅ |
| Designation | editDesignation | text | other_accounts | designation | ✅ |
| Affiliation | editAffiliation | text | other_accounts | affiliation | ✅ |
| Birthdate | editBirthdate | date | other_accounts | birthdate | ✅ |
| Sex | editSex | select | other_accounts | sex | ✅ |
| Points | editPoints | number | other_accounts | points | ✅ |

---

## VIEW MODAL - Field Mapping

### All Fields (Read-Only)

#### User Accounts Base
| Field | Display | DB Table | DB Column |
|-------|---------|----------|-----------|
| Email | Text | user_accounts | email |
| Campus ID | Text | user_accounts | campus_id |
| Role | Text | user_accounts | role |
| Google ID | Text | user_accounts | google_id |
| Password | "Set" or "Not set" | user_accounts | password |
| Created At | MM/DD/YYYY \| hh:mm AM/PM | user_accounts | created_at |
| Updated At | MM/DD/YYYY \| hh:mm AM/PM | user_accounts | updated_at |

#### Student-Specific
| Field | Display | DB Table | DB Column |
|-------|---------|----------|-----------|
| Student ID | Text | student_accounts | student_id |
| First Name | Text | student_accounts | first_name |
| Middle Name | Text | student_accounts | middle_name |
| Last Name | Text | student_accounts | last_name |
| Program | Text | student_accounts | program |
| Year Level | Text | student_accounts | year_level |
| Department | Text | student_accounts | department |
| Birthdate | Date | student_accounts | birthdate |
| Sex | Text | student_accounts | sex |
| COR | Image Preview | student_accounts | cor |
| Profile Picture | Image | student_accounts | profile_picture |
| QR Code | Image | student_accounts | qr_code |
| QR Value | Text | student_accounts | qr_value |

#### Faculty-Specific
| Field | Display | DB Table | DB Column |
|-------|---------|----------|-----------|
| Faculty ID | Text | faculty_accounts | faculty_id |
| First Name | Text | faculty_accounts | first_name |
| Middle Name | Text | faculty_accounts | middle_name |
| Last Name | Text | faculty_accounts | last_name |
| Department | Text | faculty_accounts | department |
| Position | Text | faculty_accounts | position |
| Birthdate | Date | faculty_accounts | birthdate |
| Sex | Text | faculty_accounts | sex |
| Profile Picture | Image | faculty_accounts | profile_picture |
| QR Code | Image | faculty_accounts | qr_code |
| QR Value | Text | faculty_accounts | qr_value |

#### Other-Specific
| Field | Display | DB Table | DB Column |
|-------|---------|----------|-----------|
| Account ID | Text | other_accounts | account_id |
| First Name | Text | other_accounts | first_name |
| Middle Name | Text | other_accounts | middle_name |
| Last Name | Text | other_accounts | last_name |
| Designation | Text | other_accounts | designation |
| Affiliation | Text | other_accounts | affiliation |
| Birthdate | Date | other_accounts | birthdate |
| Sex | Text | other_accounts | sex |
| Points | Number | other_accounts | points |
| Profile Picture | Image | other_accounts | profile_picture |
| QR Code | Image | other_accounts | qr_code |
| QR Value | Text | other_accounts | qr_value |

---

## Key Alignment Rules

### 1. Field Visibility
- ✅ Only show fields relevant to the selected role
- ✅ Hide fields from other roles
- ✅ Use `data-role-group` attribute for visibility control

### 2. Field Mapping
- ✅ Each HTML field ID maps to exactly one database column
- ✅ Student department uses `addStudentDepartment` / `editStudentDepartment`
- ✅ Faculty department uses `addDepartment` / `editDepartment`
- ✅ No cross-role field confusion

### 3. Read-Only Fields
- ✅ Email (cannot change)
- ✅ Campus ID (cannot change)
- ✅ System ID (cannot change)
- ✅ Created At (auto-managed)
- ✅ Updated At (auto-managed)
- ✅ QR Code (auto-generated)
- ✅ QR Value (auto-generated)

### 4. Editable Fields
- ✅ Role (can change, moves to different table)
- ✅ Password (optional in edit mode)
- ✅ Google ID (optional)
- ✅ Profile Picture (file upload)
- ✅ All role-specific fields

### 5. Auto-Generated Fields
- ✅ Student ID (if empty)
- ✅ Faculty ID (if empty)
- ✅ Account ID (if empty)
- ✅ Campus ID (at creation only)
- ✅ QR Code (system-generated)
- ✅ QR Value (system-generated)

---

## Validation Rules

### Password
- Minimum 8 characters
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character
- Must match confirm password

### Email
- Valid email format
- Unique in user_accounts
- Cannot be changed after creation

### Role-Specific IDs
- Unique within their table
- Auto-generated if not provided
- Cannot be changed after creation

### Department
- Must be from predefined list (20 options)
- Same list for students and faculty
- Optional for other role

---

## Implementation Status

✅ **Completed:**
- Database schema properly defined
- Add modal fields aligned with schema
- Edit modal fields aligned with schema
- View modal fields aligned with schema
- Department field handling fixed
- Campus ID made read-only
- Role-based field visibility working
- All form IDs correctly mapped

✅ **Tested:**
- HTML file valid
- JavaScript file valid
- No syntax errors
- All functions properly defined

---

**Reference Date:** April 30, 2026
**Status:** READY FOR DEPLOYMENT
