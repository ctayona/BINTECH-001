# Admin Modal Specifications - Received & Documented

## Status: ✅ Specifications Received & Documented

The user has provided comprehensive specifications for restructuring the admin account modals (Add/View/Edit) to follow a professional 2-column layout.

---

## 📋 Specifications Summary

### 1. ADD ADMIN MODAL 🟦

**Purpose:** Create new admin accounts

**Required Fields:**
- Email
- Password
- Role (admin / head)

**Optional Fields:**
- First Name
- Middle Name
- Last Name
- Phone
- Google ID
- Profile Picture

**Auto-Generated Fields (NOT editable):**
- Full Name (automatically generated from First_Name + Middle_Name + Last_Name)

**Auto-managed (Hidden):**
- created_at
- updated_at
- is_archived (default false)

**Layout:** 2-Column
```
LEFT COLUMN              RIGHT COLUMN
Profile Picture          Email
                        Password
                        Confirm Password
                        Role
                        Phone
                        Google ID

FULL WIDTH:
First Name | Middle Name | Last Name
Full Name (auto-generated)
```

---

### 2. VIEW ADMIN MODAL 🟩

**Purpose:** Display admin account details (read-only)

**Sections:**

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
- Profile Picture

**Layout:** 2-Column
```
LEFT COLUMN              RIGHT COLUMN
Profile Picture          Account Info
(Large)                 (ID, Email, Full Name, Role, Phone)

FULL WIDTH:
Identity Details         System Info
(Names, Google ID)      (Timestamps, Archive Info)
```

---

### 3. EDIT ADMIN MODAL 🟨

**Purpose:** Edit admin account details

**Editable Fields:**
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

**Locked / System Fields (NOT editable):**
- id
- created_at
- updated_at (auto trigger)
- is_archived
- archived_at
- archived_by_email
- archive_reason

**Layout:** 2-Column
```
LEFT COLUMN              RIGHT COLUMN
Profile Picture          Email (readonly)
Add Photo / Remove       Password (optional)
                        Confirm Password
                        Role (dropdown)
                        Phone
                        Google ID

FULL WIDTH:
First Name | Middle Name | Last Name
Full Name (auto-generated or manual)
```

---

## 🎯 Key Requirements

### Field Organization
1. **Profile Picture** - Always in left column
2. **Email** - Always in right column (readonly in edit)
3. **Password** - Right column, optional in edit
4. **Role** - Right column, dropdown
5. **Names** - Full width section
6. **Phone & Google ID** - Right column
7. **Archive Info** - View modal only, system info section

### Behavior
1. **Add Modal** - All required fields must be filled
2. **View Modal** - All fields read-only, display archive information
3. **Edit Modal** - Only editable fields are enabled, locked fields are readonly
4. **Password** - Optional in edit, only updates if both password fields filled
5. **Profile Picture** - Can be added/removed/updated

### Validation
1. Email format validation
2. Password strength validation (if changing)
3. Password match validation (if changing)
4. Required field validation (add modal)
5. Role dropdown validation

---

## 📊 Field Mapping

| Table Field | Add Modal | View Modal | Edit Modal | Notes |
|-------------|-----------|-----------|-----------|-------|
| id | Hidden | ✓ | Hidden | System field |
| email | ✓ Required | ✓ | ✓ Readonly | Unique identifier |
| password | ✓ Required | Hidden | ✓ Optional | Never displayed |
| role | ✓ Required | ✓ | ✓ Editable | Dropdown: admin/head |
| full_name | ✓ Display | ✓ Display | ✓ Display | Auto-generated (NOT editable) |
| First_Name | ✓ Optional | ✓ | ✓ Editable | Part of name |
| Middle_Name | ✓ Optional | ✓ | ✓ Editable | Part of name |
| Last_Name | ✓ Optional | ✓ | ✓ Editable | Part of name |
| phone | ✓ Optional | ✓ | ✓ Editable | Contact info |
| Google_ID | ✓ Optional | ✓ | ✓ Editable | OAuth identifier |
| Profile_Picture | ✓ Optional | ✓ | ✓ Editable | Image upload |
| created_at | Hidden | ✓ | Hidden | System timestamp |
| updated_at | Hidden | ✓ | Hidden | System timestamp |
| is_archived | Hidden | ✓ | Hidden | Archive status |
| archived_at | Hidden | ✓ | Hidden | Archive timestamp |
| archived_by_email | Hidden | ✓ | Hidden | Archive audit |
| archive_reason | Hidden | ✓ | Hidden | Archive reason |

---

## 🎨 UI/UX Considerations

### Professional 2-Column Layout
- Left column: Profile picture and visual elements
- Right column: Form fields and data
- Full width: Name fields and sections
- Responsive: Stacks on mobile

### Visual Hierarchy
1. Profile picture (prominent)
2. Email and role (important)
3. Name fields (secondary)
4. Contact info (tertiary)
5. System info (view only)

### Accessibility
- Clear labels for all fields
- Proper form structure
- Readonly fields clearly marked
- Password fields with visibility toggle
- Archive information clearly displayed

### Responsive Design
- 2-column on desktop (lg breakpoint)
- 1-column on tablet/mobile
- Profile picture responsive
- Form fields full width on mobile

---

## 🔄 Current vs. Proposed

### Current State
- Edit modal exists with mixed layout
- View modal exists but needs restructuring
- Add modal missing
- Fields not organized by section
- Archive information not displayed in view modal
- Profile picture not prominent

### Proposed State
- Add modal created with 2-column layout
- View modal restructured with sections
- Edit modal reorganized with 2-column layout
- Fields organized by section and importance
- Archive information displayed in view modal
- Profile picture prominent in left column

---

## 📝 Implementation Notes

### Add Modal
- New modal to be created
- Form validation required
- Submit handler needed
- Profile picture upload support

### View Modal
- Restructure existing modal
- Add archive information section
- Organize into Account Info, Identity Details, System Info, Media
- All fields readonly

### Edit Modal
- Reorganize existing modal
- Move profile picture to left column
- Reorganize form fields
- Mark locked fields as readonly
- Keep password as optional

### JavaScript Functions
- `openAddAdminModal()` - New function
- `renderViewAccountContent()` - Update to show sections
- `populateEditModalFields()` - Update layout
- Form submission handlers - Update as needed

### CSS Styling
- 2-column grid layout
- Section styling
- Field grouping
- Responsive breakpoints
- Readonly field styling

---

## ✅ Next Steps

1. **Review Specifications** - Confirm all requirements understood
2. **Create Add Modal** - Implement new modal with 2-column layout
3. **Restructure View Modal** - Reorganize into sections
4. **Restructure Edit Modal** - Implement 2-column layout
5. **Update JavaScript** - Update functions for new layout
6. **Add CSS Styling** - Add styles for 2-column layout
7. **Test All Modals** - Verify functionality and layout
8. **Test Responsiveness** - Verify mobile/tablet layout

---

## 📚 Documentation

- `ADMIN_MODAL_RESTRUCTURING_PLAN.md` - Detailed implementation plan
- `ADMIN_MODAL_SPECIFICATIONS_RECEIVED.md` - This document

---

## 🎯 Summary

The user has provided comprehensive specifications for restructuring the admin account modals to follow a professional 2-column layout. The specifications clearly define:

1. **Add Modal** - For creating new admin accounts
2. **View Modal** - For displaying admin account details
3. **Edit Modal** - For editing admin account details

Each modal has specific field requirements, layout specifications, and behavioral requirements. The implementation will follow these specifications to create a professional, user-friendly admin panel.

**Status:** ✅ Specifications received and documented. Ready for implementation.

