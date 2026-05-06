# Profile Page Refactor Plan - Role-Based Dynamic System

## Overview
Refactor USER_PROFILE.HTML to be fully role-based and dynamic, rendering different fields and sections based on the logged-in user's role.

## Architecture

### 1. Role Detection
- Read `sessionStorage("user")` to get current user
- Extract `role` field: "student", "faculty", or "other"
- Load role-specific configuration

### 2. Dynamic Field Rendering
Create a configuration object that defines fields for each role:

```javascript
const roleConfig = {
  student: {
    readOnlyFields: ['studentId', 'email'],
    editableFields: ['firstName', 'middleName', 'lastName', 'birthdate', 'sex', 'program', 'yearLevel', 'department'],
    sections: ['basicInfo', 'academicInfo', 'documents', 'systemFields']
  },
  faculty: {
    readOnlyFields: ['facultyId', 'email'],
    editableFields: ['firstName', 'middleName', 'lastName', 'birthdate', 'sex', 'department', 'position'],
    sections: ['basicInfo', 'systemFields']
  },
  other: {
    readOnlyFields: ['accountId', 'email'],
    editableFields: ['firstName', 'middleName', 'lastName', 'birthdate', 'sex', 'designation', 'affiliation'],
    sections: ['basicInfo', 'systemFields']
  }
};
```

### 3. Field Definitions
Each field has metadata:
```javascript
const fieldDefinitions = {
  studentId: { label: 'Student ID', type: 'text', readOnly: true },
  firstName: { label: 'First Name', type: 'text', required: true },
  program: { label: 'Program', type: 'dropdown', options: [...] },
  department: { label: 'Department', type: 'dropdown', options: [...] },
  cor: { label: 'Class of Record (COR)', type: 'file', accept: 'image/*' },
  // ... more fields
};
```

### 4. Dynamic HTML Generation
- Generate form fields based on role configuration
- Show/hide sections based on role
- Apply correct validation rules
- Set read-only attributes appropriately

### 5. Data Binding
- Load profile data from backend
- Map backend fields to form fields
- Handle missing/null values gracefully
- Support both snake_case (backend) and camelCase (frontend)

## Implementation Steps

### Step 1: Create Role Configuration
Define all roles, fields, and sections

### Step 2: Create Field Definitions
Define all possible fields with metadata

### Step 3: Create Dynamic Renderer
Function to generate HTML based on role

### Step 4: Create Data Mapper
Map backend data to frontend fields

### Step 5: Create Save Handler
Handle saving data for each role

### Step 6: Create Validation
Role-specific validation rules

## Student Role Fields

### Basic Information
- Student ID (read-only)
- Email (read-only)
- First Name (required, editable)
- Middle Name (optional, editable)
- Last Name (required, editable)
- Birthdate (editable)
- Sex (dropdown: Male/Female/Other)

### Academic Information
- Program (text/dropdown, editable)
- Year Level (dropdown, editable):
  - First Year
  - Second Year
  - Third Year
  - Fourth Year
  - Fifth Year
- Department (dropdown, editable):
  - College of Liberal Arts and Sciences (CLAS)
  - College of Business and Financial Science (CBFS)
  - College of Computing and Information Sciences (CCIS)
  - College of Continuing, Advanced and Professional Studies (CCAPS)
  - College of Innovative Teacher Education (CITE)
  - College of Construction Sciences and Engineering (CCSE)
  - College of Engineering Technology (CET)
  - College of Governance and Public Policy (CGPP)
  - College of Tourism and Hospitality Management (CTHM)
  - School of Law (SOL)
  - Institute of Nursing
  - Institute of Pharmacy
  - Institute of Imaging and Health Sciences
  - Institute of Accountancy
  - Institute of Psychology
  - Institute of Arts and Design
  - Institute of Social Work
  - Institute of Disaster and Emergency Management
  - Institute of Social Development and Nation Building
  - Center of Human Kinesthetics (CHK)

### Documents
- COR (Certificate of Registration)
  - Image upload (PNG/JPG/JPEG/WEBP)
  - Preview before save
  - Remove/replace support

### System Fields
- Profile Picture (upload + preview)
- QR Code (auto-generated or stored)
- QR Value (system-generated, read-only)

## Faculty Role Fields

### Basic Information
- Faculty ID (read-only)
- Email (read-only)
- First Name (editable)
- Middle Name (optional, editable)
- Last Name (editable)
- Birthdate (editable)
- Sex (dropdown)

### Professional Information
- Department (dropdown/text, editable)
- Position (dropdown/text, editable)

### System Fields
- Profile Picture (upload + preview)
- QR Code (auto-generated or stored)
- QR Value (system-generated, read-only)

## Other Role Fields

### Basic Information
- Account ID (read-only)
- Email (read-only)
- First Name (editable)
- Middle Name (optional, editable)
- Last Name (editable)
- Birthdate (editable)
- Sex (dropdown)

### Additional Information
- Designation (editable)
- Affiliation (editable)

### System Fields
- Profile Picture (upload + preview)
- Points (read-only display, default 0)
- QR Code (auto-generated or stored)
- QR Value (system-generated, read-only)

## Benefits

✅ Single profile page for all roles
✅ Automatic field rendering based on role
✅ Consistent UI/UX across roles
✅ Easy to add new roles
✅ Easy to modify fields per role
✅ Reduced code duplication
✅ Better maintainability
✅ Scalable architecture

## Implementation Timeline

1. **Phase 1:** Create role configuration and field definitions
2. **Phase 2:** Create dynamic renderer
3. **Phase 3:** Create data mapper and loader
4. **Phase 4:** Create save handler
5. **Phase 5:** Create validation
6. **Phase 6:** Testing and refinement

---

**Status:** Planning complete, ready for implementation
