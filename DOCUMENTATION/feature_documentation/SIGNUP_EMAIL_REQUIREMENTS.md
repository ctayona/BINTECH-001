# BinTECH Signup - Email Requirements Guide

**Last Updated**: May 3, 2026

---

## Quick Reference

| Role | UMak Email | External Email (Gmail, Yahoo, etc.) |
|------|------------|-------------------------------------|
| **Student** | ✅ Required | ❌ Not Allowed |
| **Faculty** | ✅ Allowed | ✅ Allowed |
| **Staff/Others** | ✅ Allowed | ✅ Allowed |

---

## Detailed Requirements

### 🎓 Students

**Email Requirement**: **UMak institutional email with K-number or A-number**

**Accepted Formats**:
- ✅ `firstname.k12345@umak.edu.ph` (K-number for regular students)
- ✅ `firstname.a12345@umak.edu.ph` (A-number for some students)

**Not Accepted**:
- ❌ Gmail, Yahoo, Outlook, or other external emails
- ❌ UMak emails without K-number or A-number

**Why?**: Students must use their official UMak email to verify their student status and link their account to their student ID.

**Example**:
```
✅ CORRECT: john.k12158353@umak.edu.ph
❌ WRONG: john@gmail.com
❌ WRONG: john@umak.edu.ph (missing K-number)
```

---

### 👨‍🏫 Faculty

**Email Requirement**: **UMak email OR external email**

**Option 1 - UMak Email** (Recommended):
- ✅ `firstname.lastname@umak.edu.ph`
- ✅ Automatically detected as faculty
- ✅ Role dropdown is locked

**Option 2 - External Email**:
- ✅ Gmail, Yahoo, Outlook, or any other email
- ⚠️ **You must manually select "Faculty" from the role dropdown**
- ⚠️ Role dropdown is unlocked for manual selection

**Examples**:
```
✅ CORRECT (UMak): lilibeth.arcalas@umak.edu.ph
   → Role auto-detected as "Faculty"

✅ CORRECT (External): juliemaybillones19@gmail.com
   → You must select "Faculty" from dropdown
```

---

### 👔 Staff/Others

**Email Requirement**: **Any email address**

**Accepted**:
- ✅ UMak institutional email
- ✅ Gmail, Yahoo, Outlook, or any external email

**Note**: You must manually select "Staff/Others" from the role dropdown when using any email.

**Examples**:
```
✅ CORRECT: staff@umak.edu.ph
✅ CORRECT: myemail@gmail.com
✅ CORRECT: work@company.com
```

---

## How the Signup Form Works

### Auto-Detection (UMak Emails)

When you enter a UMak email, the system automatically detects your role:

1. **Student Email** (with K-number or A-number):
   - Email: `john.k12345@umak.edu.ph`
   - Role: Automatically set to "Student" 🔒 (locked)
   - Message: "✓ Role auto-detected: Student (UMak student email)"

2. **Faculty Email** (without K-number):
   - Email: `john.doe@umak.edu.ph`
   - Role: Automatically set to "Faculty" 🔒 (locked)
   - Message: "✓ Role auto-detected: Faculty (UMak faculty email)"

### Manual Selection (External Emails)

When you enter an external email (Gmail, Yahoo, etc.):

1. **Email Entered**:
   - Email: `myemail@gmail.com`
   - Role: Dropdown is **unlocked** 🔓
   - Message: "Select your affiliation (personal email)"

2. **You Must Select**:
   - Choose "Faculty" if you are a faculty member
   - Choose "Staff/Others" if you are staff or other personnel
   - ❌ Do NOT select "Student" (will be rejected)

---

## Common Errors and Solutions

### Error: "Invalid email format for student"

**Full Error Message**:
```
Invalid email format for student. Students must use UMak email 
with K-number or A-number (e.g., name.k12345@umak.edu.ph).
```

**Cause**: You selected "Student" role but used an external email (Gmail, Yahoo, etc.)

**Solutions**:
1. **If you are a student**: Use your UMak student email (with K-number or A-number)
2. **If you are faculty/staff**: Change the role dropdown to "Faculty" or "Staff/Others"

---

### Error: "Could not extract campus ID"

**Cause**: You're using a UMak email but it doesn't match the expected format

**Solutions**:
- **Students**: Ensure your email has a K-number or A-number (e.g., `name.k12345@umak.edu.ph`)
- **Faculty**: Ensure your email is in format `firstname.lastname@umak.edu.ph`
- **Alternative**: Use an external email and manually select your role

---

## Step-by-Step Signup Guide

### For Students

1. Enter your UMak student email (e.g., `john.k12345@umak.edu.ph`)
2. Role will automatically be set to "Student" 🔒
3. Fill in your name and password
4. Click "Create Account"

### For Faculty (UMak Email)

1. Enter your UMak faculty email (e.g., `john.doe@umak.edu.ph`)
2. Role will automatically be set to "Faculty" 🔒
3. Fill in your name and password
4. Click "Create Account"

### For Faculty (External Email)

1. Enter your external email (e.g., `myemail@gmail.com`)
2. **Manually select "Faculty"** from the role dropdown 🔓
3. Fill in your name and password
4. Click "Create Account"

### For Staff/Others

1. Enter any email address
2. **Manually select "Staff/Others"** from the role dropdown 🔓
3. Fill in your name and password
4. Click "Create Account"

---

## Visual Guide

### UMak Student Email (Auto-Detected)
```
┌─────────────────────────────────────────┐
│ Email: john.k12345@umak.edu.ph         │
├─────────────────────────────────────────┤
│ Role: [Student] 🔒 LOCKED               │
│ ✓ Role auto-detected: Student          │
└─────────────────────────────────────────┘
```

### UMak Faculty Email (Auto-Detected)
```
┌─────────────────────────────────────────┐
│ Email: john.doe@umak.edu.ph            │
├─────────────────────────────────────────┤
│ Role: [Faculty] 🔒 LOCKED               │
│ ✓ Role auto-detected: Faculty          │
└─────────────────────────────────────────┘
```

### External Email (Manual Selection Required)
```
┌─────────────────────────────────────────┐
│ Email: myemail@gmail.com               │
├─────────────────────────────────────────┤
│ Role: [Select...] 🔓 UNLOCKED          │
│ ⚠ Select your affiliation              │
│                                         │
│ Options:                                │
│ • Faculty (for faculty members)        │
│ • Staff/Others (for staff)             │
└─────────────────────────────────────────┘
```

---

## FAQ

### Q: I'm a student. Can I use my Gmail?
**A**: No, students must use their official UMak student email with K-number or A-number.

### Q: I'm a faculty member. Can I use my Gmail?
**A**: Yes! Enter your Gmail and manually select "Faculty" from the role dropdown.

### Q: Why is the role dropdown locked?
**A**: When you use a UMak email, the system automatically detects your role based on your email format. This prevents errors and ensures correct role assignment.

### Q: Why is the role dropdown unlocked?
**A**: When you use an external email (Gmail, Yahoo, etc.), the system cannot auto-detect your role, so you must manually select it.

### Q: I entered my UMak email but the role is wrong
**A**: Check your email format:
- Students: Must have K-number or A-number (e.g., `name.k12345@umak.edu.ph`)
- Faculty: Should be `firstname.lastname@umak.edu.ph`
- If your email doesn't match these formats, use an external email and manually select your role

### Q: Can I change my role after signup?
**A**: No, your role is permanent once your account is created. Make sure to select the correct role during signup.

---

## Support

If you continue to have issues signing up, please contact:
- **IT Support**: support@umak.edu.ph
- **BinTECH Admin**: admin@bintech.umak.edu.ph

---

**Remember**: 
- 🎓 **Students**: Must use UMak email with K-number/A-number
- 👨‍🏫 **Faculty**: Can use UMak or external email (select role if external)
- 👔 **Staff**: Can use any email (select "Staff/Others" role)

