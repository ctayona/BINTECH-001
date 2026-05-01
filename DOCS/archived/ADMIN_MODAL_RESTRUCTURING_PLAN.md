# Admin Modal Restructuring Plan

## Overview
Reorganize the admin account modals (Add/View/Edit) to follow a professional 2-column layout with clear field organization based on the admin_accounts table structure.

---

## 1. ADD ADMIN MODAL 🟦

### Required Fields:
- Email
- Password
- Role (admin / head)

### Optional Fields:
- First Name
- Middle Name
- Last Name
- Full Name (auto-generated or manual override)
- Phone
- Google ID
- Profile Picture

### Auto-managed (Hidden/System):
- created_at
- updated_at
- is_archived (default false)

### Layout (2-Column):
```
LEFT COLUMN                    RIGHT COLUMN
─────────────────────────────────────────────
Profile Picture Upload         Email
                              Password
                              Confirm Password
                              Role (dropdown)
                              Phone
                              Google ID

FULL WIDTH:
─────────────────────────────────────────────
First Name | Middle Name | Last Name
Full Name (auto-generated)
```

---

## 2. VIEW ADMIN MODAL 🟩

### Display Sections:

#### Account Info
- ID
- Email
- Full Name
- Role
- Phone

#### Identity Details
- First Name
- Middle Name
- Last Name
- Google ID

#### System Info
- Created At
- Updated At
- Archive Status (is_archived)
- Archived At
- Archived By Email
- Archive Reason

#### Media
- Profile Picture (Profile_Picture / profile_picture)

### Layout (2-Column):
```
LEFT COLUMN                    RIGHT COLUMN
─────────────────────────────────────────────
Profile Picture (Large)        Account Info:
                              - ID
                              - Email
                              - Full Name
                              - Role
                              - Phone

FULL WIDTH:
─────────────────────────────────────────────
Identity Details:              System Info:
- First Name                   - Created At
- Middle Name                  - Updated At
- Last Name                    - Archive Status
- Google ID                    - Archived At
                              - Archived By Email
                              - Archive Reason
```

---

## 3. EDIT ADMIN MODAL 🟨

### Editable Fields:
- Email
- Full Name
- Role (admin / head)
- Phone
- First Name
- Middle Name
- Last Name
- Google ID
- Profile Picture
- Password (optional reset field)

### Locked / System Fields (NOT editable):
- id
- created_at
- updated_at (auto trigger)
- is_archived
- archived_at
- archived_by_email
- archive_reason

### Layout (2-Column):
```
LEFT COLUMN                    RIGHT COLUMN
─────────────────────────────────────────────
Profile Picture Upload         Email (readonly)
Add Photo / Remove             Password (optional)
                              Confirm Password
                              Role (dropdown)
                              Phone
                              Google ID

FULL WIDTH:
─────────────────────────────────────────────
First Name | Middle Name | Last Name
Full Name (auto-generated or manual)
```

---

## Implementation Steps

### Step 1: Create Add Admin Modal
- Create new modal with 2-column layout
- Add required fields: Email, Password, Role
- Add optional fields: First/Middle/Last Name, Phone, Google ID, Profile Picture
- Add form validation
- Add submit handler

### Step 2: Restructure View Admin Modal
- Reorganize content into sections: Account Info, Identity Details, System Info, Media
- Use 2-column layout for better readability
- Display all archive-related fields
- Make all fields read-only

### Step 3: Restructure Edit Admin Modal
- Reorganize into 2-column layout
- Move profile picture to left column
- Move email, password, role, phone, google ID to right column
- Add name fields in full width
- Clearly mark locked fields as readonly
- Keep password as optional reset field

### Step 4: Update JavaScript Functions
- Update `openAddAdminModal()` function
- Update `renderViewAccountContent()` function
- Update `populateEditModalFields()` function
- Update form submission handlers

### Step 5: Add CSS Styling
- Add 2-column grid layout styles
- Add section styling
- Add field grouping styles
- Ensure responsive design

---

## Field Mapping

### admin_accounts Table Fields:
```
id                    → System (readonly)
email                 → Email (editable in edit, readonly in view)
password              → Password (optional reset in edit, hidden in view)
role                  → Role (editable dropdown)
full_name             → Full Name (editable)
First_Name            → First Name (editable)
Middle_Name           → Middle Name (editable)
Last_Name             → Last Name (editable)
phone                 → Phone (editable)
Google_ID             → Google ID (editable)
Profile_Picture       → Profile Picture (editable)
created_at            → Created At (readonly)
updated_at            → Updated At (readonly)
is_archived           → Archive Status (readonly)
archived_at           → Archived At (readonly)
archived_by_email     → Archived By Email (readonly)
archive_reason        → Archive Reason (readonly)
```

---

## Current Issues to Fix

1. **Add Admin Modal**: Currently missing - need to create
2. **View Admin Modal**: Needs restructuring into sections
3. **Edit Admin Modal**: Needs 2-column layout reorganization
4. **Field Organization**: Need to group related fields
5. **Archive Fields**: Need to display in view modal
6. **Profile Picture**: Should be in left column

---

## Benefits of This Structure

1. **Professional Appearance**: 2-column layout is more organized
2. **Better UX**: Related fields are grouped together
3. **Clear Hierarchy**: Important fields are prominent
4. **Responsive**: Works well on mobile and desktop
5. **Consistent**: Matches modern admin panel standards
6. **Accessible**: Clear field organization helps users find information

---

## Timeline

- Step 1 (Add Modal): 30 minutes
- Step 2 (View Modal): 20 minutes
- Step 3 (Edit Modal): 30 minutes
- Step 4 (JavaScript): 20 minutes
- Step 5 (CSS): 15 minutes
- **Total**: ~2 hours

---

## Testing Checklist

- [ ] Add Admin Modal opens correctly
- [ ] Add Admin Modal validates required fields
- [ ] Add Admin Modal submits successfully
- [ ] View Admin Modal displays all fields correctly
- [ ] View Admin Modal shows archive information
- [ ] Edit Admin Modal displays 2-column layout
- [ ] Edit Admin Modal allows editing of correct fields
- [ ] Edit Admin Modal prevents editing of locked fields
- [ ] Edit Admin Modal submits successfully
- [ ] All modals are responsive on mobile
- [ ] All modals have proper styling

