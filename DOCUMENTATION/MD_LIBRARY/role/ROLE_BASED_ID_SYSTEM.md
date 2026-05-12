# Role-Based ID System Implementation Guide

## Overview

This document explains the role-based ID system that ensures each user type uses their appropriate identifier while maintaining database normalization and scalability.

## Problem Statement

**Before (Anti-pattern):**
- All IDs stored in a single `campus_id` column in `user_accounts`
- No distinction between student_id, faculty_id, and account_id
- Confusing data representation
- Violates database normalization principles

**After (Proper Design):**
- `user_accounts` table: Stores general account info (system_id, email, role)
- `student_accounts` table: Stores student-specific info including `student_id`
- `faculty_accounts` table: Stores faculty-specific info including `faculty_id`
- `other_accounts` table: Stores other user info including `account_id`
- SQL VIEW: Dynamically returns correct ID based on role

## Database Schema

### 1. Core Tables

#### user_accounts (Main Account Table)
```sql
- system_id (UUID, Primary Key)
- email (VARCHAR, Unique)
- role (VARCHAR) -- 'student', 'faculty', 'staff', etc.
- password (TEXT)
- google_id (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### student_accounts (Student-Specific Data)
```sql
- system_id (UUID, Foreign Key → user_accounts)
- email (VARCHAR, Unique)
- student_id (VARCHAR, Unique) -- ← Student-specific ID
- first_name, middle_name, last_name
- program, year_level, cor
- birthdate, sex
- profile_picture, qr_code, qr_value
- created_at, updated_at
```

#### faculty_accounts (Faculty-Specific Data)
```sql
- system_id (UUID, Foreign Key → user_accounts)
- email (VARCHAR, Unique)
- faculty_id (VARCHAR, Unique) -- ← Faculty-specific ID
- first_name, middle_name, last_name
- department, position
- birthdate, sex
- profile_picture, qr_code, qr_value
- created_at, updated_at
```

#### other_accounts (Other User Types)
```sql
- system_id (UUID, Foreign Key → user_accounts)
- email (VARCHAR, Unique)
- account_id (VARCHAR, Unique) -- ← General account ID
- first_name, middle_name, last_name
- designation, affiliation
- points (INTEGER, default 0)
- birthdate, sex
- profile_picture, qr_code, qr_value
- created_at, updated_at
```

### 2. The SQL VIEW: `user_ids_by_role`

```sql
CREATE VIEW user_ids_by_role AS
SELECT
  u.system_id,
  u.email,
  u.role,
  u.campus_id,
  CASE
    WHEN u.role = 'student' THEN s.student_id
    WHEN u.role = 'faculty' THEN f.faculty_id
    WHEN u.role = 'staff' THEN o.account_id
    ELSE o.account_id
  END AS role_based_id,
  CASE
    WHEN u.role = 'student' THEN 'student_id'
    WHEN u.role = 'faculty' THEN 'faculty_id'
    WHEN u.role = 'staff' THEN 'account_id'
    ELSE 'account_id'
  END AS id_type,
  COALESCE(s.first_name, f.first_name, o.first_name) AS first_name,
  COALESCE(s.last_name, f.last_name, o.last_name) AS last_name,
  COALESCE(s.profile_picture, f.profile_picture, o.profile_picture) AS profile_picture,
  u.created_at,
  u.updated_at
FROM user_accounts u
LEFT JOIN student_accounts s ON u.system_id = s.system_id
LEFT JOIN faculty_accounts f ON u.system_id = f.system_id
LEFT JOIN other_accounts o ON u.system_id = o.system_id
ORDER BY u.created_at DESC;
```

**How it works:**
- Joins all three role-specific tables
- Uses CASE statement to select correct ID based on role
- Returns `role_based_id` column with the appropriate identifier
- Returns `id_type` column indicating which ID is being used
- Uses COALESCE for optional fields to avoid NULL issues

## Usage Examples

### Querying the VIEW

**Get all users with their role-based IDs:**
```sql
SELECT system_id, email, role, role_based_id, id_type, first_name, last_name
FROM user_ids_by_role
WHERE role = 'student';
```

**Result:**
```
system_id                           email              role    role_based_id  id_type     first_name  last_name
123e4567-e89b-12d3-a456-426614174000  john@umak.edu.ph   student STU-2026001   student_id  John        Doe

123e4567-e89b-12d3-a456-426614174001  mary@umak.edu.ph   student STU-2026002   student_id  Mary        Smith
```

**Get a specific user's ID:**
```sql
SELECT role_based_id, id_type
FROM user_ids_by_role
WHERE email = 'john@umak.edu.ph';
```

**Result:**
```
role_based_id  id_type
STU-2026001    student_id
```

### Application Code Implementation

**Backend: Get correct ID based on role (Supabase)**
```javascript
// Query the VIEW instead of individual tables
const { data, error } = await supabase
  .from('user_ids_by_role')
  .select('email, role, role_based_id, id_type')
  .eq('email', userEmail)
  .single();

if (data) {
  console.log(`User ${data.email} has ${data.id_type}: ${data.role_based_id}`);
  // Outputs: "User john@umak.edu.ph has student_id: STU-2026001"
}
```

**Creating a new student account:**
```javascript
// 1. Create entry in user_accounts
const { data: userAccount } = await supabase
  .from('user_accounts')
  .insert([{
    email: 'john@umak.edu.ph',
    role: 'student',
    password: hashedPassword
  }])
  .select('system_id');

// 2. Create entry in student_accounts with student_id
const { data: studentProfile } = await supabase
  .from('student_accounts')
  .insert([{
    system_id: userAccount[0].system_id,
    email: 'john@umak.edu.ph',
    student_id: 'STU-2026001',  // ← Role-specific ID
    first_name: 'John',
    last_name: 'Doe',
    program: 'Computer Science',
    year_level: '3'
  }])
  .select();
```

**Creating a faculty account:**
```javascript
// 1. Create entry in user_accounts
const { data: userAccount } = await supabase
  .from('user_accounts')
  .insert([{
    email: 'prof@umak.edu.ph',
    role: 'faculty',
    password: hashedPassword
  }])
  .select('system_id');

// 2. Create entry in faculty_accounts with faculty_id
const { data: facultyProfile } = await supabase
  .from('faculty_accounts')
  .insert([{
    system_id: userAccount[0].system_id,
    email: 'prof@umak.edu.ph',
    faculty_id: 'FAC-2026001',  // ← Role-specific ID
    first_name: 'Prof',
    last_name: 'Smith',
    department: 'Computer Science',
    position: 'Associate Professor'
  }])
  .select();
```

## Benefits

| Aspect | Benefit |
|--------|---------|
| **Data Integrity** | No mixing of ID types; clear separation of concerns |
| **Normalization** | Follows 3NF; no data redundancy |
| **Scalability** | Easy to add new user types without modifying existing tables |
| **Query Performance** | Indexes on each ID column for fast lookups |
| **Code Simplicity** | VIEW handles role logic; no conditional checks needed |
| **Maintainability** | Single source of truth for role-to-ID mapping |
| **Data Consistency** | Constraints and triggers ensure accurate timestamps |

## Migration Steps

### 1. Run the Migration
```sql
-- Execute this file in Supabase SQL editor:
migrations/create_role_based_id_system.sql
```

### 2. Verify Tables Created
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('student_accounts', 'faculty_accounts', 'other_accounts');
```

### 3. Verify VIEW Created
```sql
-- Check if VIEW exists
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'user_ids_by_role';
```

### 4. Test the VIEW
```sql
-- Query the VIEW
SELECT * FROM user_ids_by_role LIMIT 5;
```

## Backend Integration

### Update Controller Logic

The `adminController.js` already uses this pattern:
```javascript
const role = String(data.role || '').trim().toLowerCase();
const targetTable = role === 'student' ? 'student_accounts' 
                   : role === 'faculty' ? 'faculty_accounts' 
                   : 'other_accounts';
```

### Query the VIEW When Needed

```javascript
// Instead of checking role in code, query the VIEW:
const { data: userInfo } = await supabase
  .from('user_ids_by_role')
  .select('*')
  .eq('email', userEmail)
  .single();

// Now you have: userInfo.role_based_id, userInfo.id_type
```

## Best Practices

1. **Always use the role-specific tables for inserts/updates**
   - Insert student data in `student_accounts`
   - Insert faculty data in `faculty_accounts`
   - Insert other data in `other_accounts`

2. **Use the VIEW for reads that need the correct ID**
   ```javascript
   // Good: Query the VIEW
   const { data } = await supabase
     .from('user_ids_by_role')
     .select('*')
     .eq('email', userEmail);

   // Less ideal: Query individual table with role check
   if (role === 'student') {
     const { data } = await supabase.from('student_accounts')...
   }
   ```

3. **Maintain referential integrity**
   - Foreign keys link role tables to `user_accounts`
   - Use CASCADE delete to maintain data consistency
   - Always delete from `user_accounts` last (if at all)

4. **Document the flow**
   ```javascript
   // CREATE NEW STUDENT
   // 1. Insert into user_accounts (email, role, password)
   // 2. Insert into student_accounts (system_id, student_id, profile info)
   // 3. Insert into account_points (system_id, initial points)
   ```

## FAQ

**Q: Why separate tables instead of one table with all columns?**
A: Follows database normalization. Each table stores only relevant data for that role, avoiding NULL columns and confusion.

**Q: Can a user have multiple roles?**
A: Current design supports one role per user. For multiple roles, add a role_assignments table.

**Q: What if I need to change a user's role?**
A: Move their profile to the appropriate table:
```sql
-- Move from student to faculty
INSERT INTO faculty_accounts SELECT * FROM student_accounts WHERE system_id = ?;
DELETE FROM student_accounts WHERE system_id = ?;
UPDATE user_accounts SET role = 'faculty' WHERE system_id = ?;
```

**Q: How do I query all users of a specific type?**
A: Use the VIEW with role filter:
```sql
SELECT * FROM user_ids_by_role WHERE role = 'student';
```

## Related Files

- **Migration:** `migrations/create_role_based_id_system.sql`
- **Controller:** `controllers/adminController.js` (createAccount function)
- **Frontend:** `templates/ADMIN_ACCOUNTS.html` (Add User modal)

## Conclusion

This role-based ID system provides a scalable, normalized database design that:
- Eliminates confusion about which ID to use
- Maintains data integrity through constraints
- Simplifies application logic via SQL VIEW
- Enables easy querying of role-specific data
- Supports future expansion with new user roles
