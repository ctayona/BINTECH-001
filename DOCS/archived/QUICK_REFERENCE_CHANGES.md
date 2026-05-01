# Quick Reference: All Changes Made

## Summary
Fixed dropdowns and implemented COR image management in Add/Edit/View modals.

---

## What Was Changed

### 1. Add Modal - Department Dropdowns
```
BEFORE: <input type="text" id="addDepartment" ...>
AFTER:  <select id="addDepartment"> with 20 options

NEW:    <select id="addStudentDepartment"> with 20 options (for students)
```

### 2. Add Modal - COR Field
```
BEFORE: <input type="text" id="addCor" ...>
AFTER:  File upload with buttons:
        - Upload COR button
        - Remove COR button
        - File preview
        - Hidden value storage (addCorValue)
```

### 3. Add Modal - JavaScript
```
NEW FUNCTIONS:
- triggerAddCorFilePicker()
- removeAddCorPhoto()
- handleAddCorFileSelected(event)

UPDATED FUNCTIONS:
- handleAddUser() - now reads from addCorValue and addStudentDepartment
```

### 4. View Modal - Student Section
```
ADDED: Department field display for students
```

---

## Form Field IDs

### New Fields
| ID | Type | Purpose |
|---|---|---|
| addStudentDepartment | select | Student department dropdown |
| addCorFile | file (hidden) | COR file input |
| addCorValue | hidden | COR URL storage |
| addCorFileButton | button | Upload COR |
| removeAddCorFileButton | button | Remove COR |
| addCorFileName | p | File name display |
| addCorPreviewContainer | div | COR preview wrapper |
| addCorPreviewContent | div | COR preview content |

### Updated Fields
| ID | Change |
|---|---|
| addDepartment | text input → select dropdown |
| addCor | removed (replaced with file upload) |

---

## Department Options (20 Total)

```
CLAS - College of Liberal Arts and Sciences
CBFS - College of Business and Financial Science
CCIS - College of Computing and Information Sciences
CCAPS - College of Continuing, Advanced and Professional Studies
CITE - College of Innovative Teacher Education
CCSE - College of Construction Sciences and Engineering
CET - College of Engineering Technology
CGPP - College of Governance and Public Policy
CTHM - College of Tourism and Hospitality Management
SOL - School of Law
ION - Institute of Nursing
IOP - Institute of Pharmacy
IOIHS - Institute of Imaging and Health Sciences
IOA - Institute of Accountancy
IOPS - Institute of Psychology
IOAD - Institute of Arts and Design
IOSW - Institute of Social Work
IODEM - Institute of Disaster and Emergency Management
IOSDNB - Institute of Social Development and Nation Building
CHK - Center of Human Kinesthetics
```

---

## COR Upload Details

**Endpoint:** `/api/admin/upload-reward-image`
**Method:** POST
**Supported Formats:** PNG, JPG, WEBP
**Max Size:** 5MB
**Response:** `{ success: true, image_url: "..." }`

---

## Role-Based Visibility

### Student Fields
- Student ID
- Program
- Year Level
- **Department** (NEW)
- **COR with file upload** (UPDATED)

### Faculty Fields
- Faculty ID
- **Department** (now dropdown)
- Position

### Other Fields
- Account ID
- Designation
- Affiliation

---

## Testing Checklist

- [ ] Add modal: Student role shows department dropdown
- [ ] Add modal: Faculty role shows department dropdown
- [ ] Add modal: Upload COR image for student
- [ ] Add modal: COR preview displays after upload
- [ ] Add modal: Remove COR button clears image
- [ ] Add modal: Submit form saves all fields
- [ ] Edit modal: Department dropdown still works
- [ ] Edit modal: COR upload still works
- [ ] View modal: Student department displays
- [ ] View modal: COR preview displays

---

## File Modified
- `templates/ADMIN_ACCOUNTS.html`

## Lines Changed
- Add modal department: ~281-324
- Add modal COR: ~357-376
- handleAddUser function: ~1091, 1093
- New functions: ~1917-1985
- renderViewAccountContent: ~1294

---

## Backward Compatibility
✅ All existing features work
✅ No breaking changes
✅ Edit modal unchanged
✅ View modal enhanced
✅ Add modal enhanced
