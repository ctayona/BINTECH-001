# Full Name Auto-Generation Rule - CRITICAL

## ❌ NOT Manually Editable
## ❌ NOT an Input for Users
## ✅ Automatically Generated from First_Name + Middle_Name + Last_Name

---

## Rule Definition

### What is Full Name?
Full Name is a **computed/derived field** that is automatically generated from the individual name components.

### How is it Generated?
```
full_name = First_Name + " " + Middle_Name + " " + Last_Name
```

**Examples:**
- First: "John", Middle: "Michael", Last: "Doe" → Full Name: "John Michael Doe"
- First: "Jane", Middle: "", Last: "Smith" → Full Name: "Jane Smith"
- First: "Bob", Middle: "", Last: "Johnson" → Full Name: "Bob Johnson"

### When is it Generated?
- **On Create:** When adding a new admin account
- **On Update:** Whenever First_Name, Middle_Name, or Last_Name changes
- **Real-time:** Should update in real-time as user types

---

## Implementation Requirements

### Add Modal
```
LEFT COLUMN              RIGHT COLUMN
Profile Picture          Email
                        Password
                        Confirm Password
                        Role
                        Phone
                        Google ID

FULL WIDTH:
─────────────────────────────────────────
First Name | Middle Name | Last Name
─────────────────────────────────────────
Full Name (READ-ONLY, auto-generated)
─────────────────────────────────────────
```

### View Modal
```
Display full_name as read-only text
(No input field, just display value)
```

### Edit Modal
```
LEFT COLUMN              RIGHT COLUMN
Profile Picture          Email (readonly)
Add/Remove Photo         Password (optional)
                        Confirm Password
                        Role
                        Phone
                        Google ID

FULL WIDTH:
─────────────────────────────────────────
First Name | Middle Name | Last Name
─────────────────────────────────────────
Full Name (READ-ONLY, auto-generated)
─────────────────────────────────────────
```

---

## JavaScript Implementation

### Function: Auto-Generate Full Name
```javascript
function generateFullName(firstName, middleName, lastName) {
  const parts = [];
  
  if (firstName && firstName.trim()) {
    parts.push(firstName.trim());
  }
  
  if (middleName && middleName.trim()) {
    parts.push(middleName.trim());
  }
  
  if (lastName && lastName.trim()) {
    parts.push(lastName.trim());
  }
  
  return parts.join(' ');
}
```

### Real-Time Update on Input
```javascript
// Add event listeners to name fields
document.getElementById('firstName').addEventListener('input', updateFullName);
document.getElementById('middleName').addEventListener('input', updateFullName);
document.getElementById('lastName').addEventListener('input', updateFullName);

function updateFullName() {
  const firstName = document.getElementById('firstName').value;
  const middleName = document.getElementById('middleName').value;
  const lastName = document.getElementById('lastName').value;
  
  const fullName = generateFullName(firstName, middleName, lastName);
  
  // Display in read-only field
  document.getElementById('fullNameDisplay').textContent = fullName || '(No name entered)';
  
  // Store in hidden input for form submission
  document.getElementById('fullNameInput').value = fullName;
}
```

---

## Field Specifications

### First Name
- **Type:** Text input
- **Editable:** Yes
- **Required:** No
- **Triggers:** Full Name update

### Middle Name
- **Type:** Text input
- **Editable:** Yes
- **Required:** No
- **Triggers:** Full Name update

### Last Name
- **Type:** Text input
- **Editable:** Yes
- **Required:** No
- **Triggers:** Full Name update

### Full Name
- **Type:** Read-only display / Hidden input
- **Editable:** NO
- **Required:** No
- **Generated:** Automatically from First + Middle + Last
- **Display:** Shows auto-generated value in real-time
- **Storage:** Stored in hidden input for form submission

---

## Backend Handling

### On Create
```javascript
// Backend receives: firstName, middleName, lastName
// Backend generates: fullName = firstName + " " + middleName + " " + lastName
// Backend stores: fullName in admin_accounts.full_name
```

### On Update
```javascript
// Backend receives: firstName, middleName, lastName
// Backend generates: fullName = firstName + " " + middleName + " " + lastName
// Backend updates: admin_accounts.full_name
```

### Never Accept Manual Full Name
```javascript
// WRONG - Don't do this:
const fullName = req.body.full_name;  // ❌ User-provided

// CORRECT - Do this:
const fullName = generateFullName(
  req.body.firstName,
  req.body.middleName,
  req.body.lastName
);  // ✅ Server-generated
```

---

## UI/UX Behavior

### Add Modal
1. User enters First Name → Full Name updates
2. User enters Middle Name → Full Name updates
3. User enters Last Name → Full Name updates
4. Full Name field is read-only, shows auto-generated value
5. User cannot manually edit Full Name

### Edit Modal
1. User modifies First Name → Full Name updates
2. User modifies Middle Name → Full Name updates
3. User modifies Last Name → Full Name updates
4. Full Name field is read-only, shows auto-generated value
5. User cannot manually edit Full Name

### View Modal
1. Display Full Name as read-only text
2. No input field, just display the value
3. Shows the auto-generated full name

---

## Validation Rules

### Full Name Validation
- **Minimum Length:** 0 (can be empty if all name fields are empty)
- **Maximum Length:** 255 characters (sum of all name parts)
- **Allowed Characters:** Letters, spaces, hyphens, apostrophes
- **Trimming:** Trim whitespace from each part before joining

### Name Field Validation
- **First Name:** Optional, max 50 characters
- **Middle Name:** Optional, max 50 characters
- **Last Name:** Optional, max 50 characters

---

## Examples

### Example 1: All Names Provided
```
First Name: John
Middle Name: Michael
Last Name: Doe
─────────────────────────────────────
Full Name: John Michael Doe
```

### Example 2: No Middle Name
```
First Name: Jane
Middle Name: (empty)
Last Name: Smith
─────────────────────────────────────
Full Name: Jane Smith
```

### Example 3: Only First Name
```
First Name: Bob
Middle Name: (empty)
Last Name: (empty)
─────────────────────────────────────
Full Name: Bob
```

### Example 4: All Empty
```
First Name: (empty)
Middle Name: (empty)
Last Name: (empty)
─────────────────────────────────────
Full Name: (empty)
```

---

## Database Storage

### admin_accounts Table
```sql
-- Individual name fields (editable)
First_Name VARCHAR(50)
Middle_Name VARCHAR(50)
Last_Name VARCHAR(50)

-- Full name field (auto-generated, stored for display)
full_name VARCHAR(255)
```

### Storage Strategy
1. Store individual name fields (First_Name, Middle_Name, Last_Name)
2. Generate and store full_name on create/update
3. Never accept user-provided full_name
4. Always regenerate full_name from individual fields

---

## Critical Implementation Points

### ✅ DO:
- Generate full_name from individual name fields
- Update full_name whenever any name field changes
- Display full_name as read-only
- Validate individual name fields
- Store full_name in database for display

### ❌ DON'T:
- Allow manual editing of full_name
- Accept user-provided full_name from frontend
- Create input field for full_name
- Skip full_name generation
- Store full_name without validation

---

## Testing Checklist

- [ ] Full Name updates when First Name changes
- [ ] Full Name updates when Middle Name changes
- [ ] Full Name updates when Last Name changes
- [ ] Full Name field is read-only (cannot be edited)
- [ ] Full Name displays correctly with all combinations
- [ ] Full Name handles empty name fields correctly
- [ ] Full Name trims whitespace correctly
- [ ] Backend generates full_name correctly
- [ ] Backend never accepts user-provided full_name
- [ ] Full Name displays in View modal
- [ ] Full Name displays in Edit modal
- [ ] Full Name displays in Add modal

---

## Summary

**Full Name is NOT manually editable. It is automatically generated from First_Name, Middle_Name, and Last_Name.**

- ❌ Users cannot manually edit Full Name
- ❌ Full Name is not an input field
- ✅ Full Name is auto-generated in real-time
- ✅ Full Name is displayed as read-only
- ✅ Full Name is stored in database for display

This ensures data consistency and prevents users from entering conflicting or inconsistent name data.

