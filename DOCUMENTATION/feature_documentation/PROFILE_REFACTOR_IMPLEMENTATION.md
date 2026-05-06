# Profile Page Refactor - Implementation Guide

## Status: Ready for Implementation

This document provides a complete implementation guide for refactoring the profile page to be fully role-based and dynamic.

## Current State
- ✅ Backup created: `USER_PROFILE_BACKUP.HTML`
- ✅ Plan documented: `PROFILE_REFACTOR_PLAN.md`
- ✅ HTML structure updated with cleaner CSS

## Implementation Approach

### Option 1: Incremental Refactor (Recommended)
Keep the existing HTML structure but add JavaScript logic to:
1. Detect user role from sessionStorage
2. Show/hide sections based on role
3. Dynamically populate dropdowns
4. Apply role-specific validation

**Pros:** Lower risk, easier to test incrementally
**Cons:** Larger HTML file with hidden sections

### Option 2: Complete Rewrite
Create a new profile page that:
1. Generates all HTML dynamically based on role
2. Uses a configuration object for all fields
3. Minimal HTML, maximum JavaScript

**Pros:** Cleaner code, smaller HTML
**Cons:** Higher risk, requires more testing

## Recommended Implementation (Option 1)

### Step 1: Create Role Configuration

Add this JavaScript at the top of the script section:

```javascript
const ROLE_CONFIG = {
  student: {
    sections: ['basicInfo', 'academicInfo', 'documents', 'systemFields'],
    readOnlyFields: ['studentId', 'email'],
    editableFields: ['firstName', 'middleName', 'lastName', 'birthdate', 'sex', 'program', 'yearLevel', 'department']
  },
  faculty: {
    sections: ['basicInfo', 'professionalInfo', 'systemFields'],
    readOnlyFields: ['facultyId', 'email'],
    editableFields: ['firstName', 'middleName', 'lastName', 'birthdate', 'sex', 'department', 'position']
  },
  other: {
    sections: ['basicInfo', 'additionalInfo', 'systemFields'],
    readOnlyFields: ['accountId', 'email'],
    editableFields: ['firstName', 'middleName', 'lastName', 'birthdate', 'sex', 'designation', 'affiliation']
  }
};

const DEPARTMENT_OPTIONS = [
  'College of Liberal Arts and Sciences (CLAS)',
  'College of Business and Financial Science (CBFS)',
  'College of Computing and Information Sciences (CCIS)',
  'College of Continuing, Advanced and Professional Studies (CCAPS)',
  'College of Innovative Teacher Education (CITE)',
  'College of Construction Sciences and Engineering (CCSE)',
  'College of Engineering Technology (CET)',
  'College of Governance and Public Policy (CGPP)',
  'College of Tourism and Hospitality Management (CTHM)',
  'School of Law (SOL)',
  'Institute of Nursing',
  'Institute of Pharmacy',
  'Institute of Imaging and Health Sciences',
  'Institute of Accountancy',
  'Institute of Psychology',
  'Institute of Arts and Design',
  'Institute of Social Work',
  'Institute of Disaster and Emergency Management',
  'Institute of Social Development and Nation Building',
  'Center of Human Kinesthetics (CHK)'
];

const YEAR_LEVEL_OPTIONS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Fifth Year'
];
```

### Step 2: Create Role Detection Function

```javascript
function detectUserRole() {
  const userStr = sessionStorage.getItem('bintech_user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return user.role || null;
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
}
```

### Step 3: Create Section Visibility Manager

```javascript
function updateSectionVisibility(role) {
  const config = ROLE_CONFIG[role];
  if (!config) return;
  
  // Hide all sections first
  document.getElementById('studentFields')?.classList.add('hidden');
  document.getElementById('facultyFields')?.classList.add('hidden');
  document.getElementById('staffFields')?.classList.add('hidden');
  
  // Show role-specific sections
  if (role === 'student') {
    document.getElementById('studentFields')?.classList.remove('hidden');
  } else if (role === 'faculty') {
    document.getElementById('facultyFields')?.classList.remove('hidden');
  } else if (role === 'staff' || role === 'other') {
    document.getElementById('staffFields')?.classList.remove('hidden');
  }
}
```

### Step 4: Create Field Populator

```javascript
function populateDropdowns(role) {
  // Populate department dropdowns
  const deptSelects = document.querySelectorAll('[id*="department"]');
  deptSelects.forEach(select => {
    select.innerHTML = '<option value="">Select Department...</option>';
    DEPARTMENT_OPTIONS.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      select.appendChild(option);
    });
  });
  
  // Populate year level dropdown (students only)
  if (role === 'student') {
    const yearSelect = document.getElementById('yearLevel');
    if (yearSelect) {
      yearSelect.innerHTML = '<option value="">Select Year Level...</option>';
      YEAR_LEVEL_OPTIONS.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      });
    }
  }
}
```

### Step 5: Create Field Mapper

```javascript
function mapBackendToFrontend(backendData, role) {
  const mapping = {
    student: {
      'system_id': 'systemId',
      'first_name': 'firstName',
      'middle_name': 'middleName',
      'last_name': 'lastName',
      'student_id': 'studentId',
      'program': 'program',
      'year_level': 'yearLevel',
      'department': 'department',
      'cor': 'corFile'
    },
    faculty: {
      'system_id': 'systemId',
      'first_name': 'firstName',
      'middle_name': 'middleName',
      'last_name': 'lastName',
      'faculty_id': 'facultyId',
      'department': 'department',
      'position': 'position'
    },
    other: {
      'system_id': 'systemId',
      'first_name': 'firstName',
      'middle_name': 'middleName',
      'last_name': 'lastName',
      'account_id': 'accountId',
      'designation': 'designation',
      'affiliation': 'affiliation'
    }
  };
  
  const roleMapping = mapping[role] || {};
  const frontendData = {};
  
  Object.entries(roleMapping).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      frontendData[frontendKey] = backendData[backendKey];
    }
  });
  
  return frontendData;
}
```

### Step 6: Update Initialization

```javascript
async function initializePage() {
  try {
    // Detect role
    const role = detectUserRole();
    if (!role) {
      showError('Unable to determine user role');
      return;
    }
    
    // Update UI based on role
    updateSectionVisibility(role);
    populateDropdowns(role);
    
    // Load profile data
    await loadProfileData(role);
    
    // Setup form handlers
    setupFormHandlers(role);
    
    console.log(`✓ Profile page initialized for role: ${role}`);
  } catch (error) {
    console.error('Error initializing page:', error);
    showError('Failed to initialize profile page');
  }
}
```

### Step 7: Update Save Handler

```javascript
async function handleSaveProfile(event, role) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Saving...';
  
  try {
    // Get role-specific fields
    const config = ROLE_CONFIG[role];
    const updateData = {
      system_id: currentUser.id,
      role: role
    };
    
    // Collect editable fields
    config.editableFields.forEach(fieldId => {
      const elem = document.getElementById(fieldId);
      if (elem) {
        updateData[fieldId] = elem.value || null;
      }
    });
    
    // Handle file uploads
    const profilePicInput = document.getElementById('profilePictureFile');
    if (profilePicInput?.files.length > 0) {
      showInfo('Uploading profile picture...');
      const profileUrl = await uploadFileToSupabase(profilePicInput.files[0], 'cor-uploads');
      updateData.profile_picture = profileUrl;
    }
    
    // Save to backend
    showInfo('Saving profile...');
    const response = await fetch('/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) throw new Error('Failed to save profile');
    
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    
    showSuccess('Profile updated successfully!');
    toggleEditMode();
    
  } catch (error) {
    console.error('Error saving profile:', error);
    showError(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}
```

## HTML Structure Changes

### Keep Existing Sections:
- Navigation bar
- Profile card (left column)
- Form container (right column)
- Footer

### Modify Form Sections:
- Keep all role-specific field containers
- Add `hidden` class to hide non-applicable sections
- Use JavaScript to show/hide based on role

### Add Data Attributes:
```html
<input id="firstName" data-role="student,faculty,other" class="form-input" />
<input id="program" data-role="student" class="form-input" />
<input id="department" data-role="student,faculty" class="form-input" />
```

## Testing Checklist

- [ ] Student role loads correctly
- [ ] Faculty role loads correctly
- [ ] Other role loads correctly
- [ ] Correct fields show for each role
- [ ] Correct fields are read-only
- [ ] Dropdowns populate correctly
- [ ] Profile picture upload works
- [ ] COR upload works (students only)
- [ ] Save works for each role
- [ ] Validation works correctly
- [ ] Error messages display properly
- [ ] Mobile responsive

## Rollback Plan

If issues occur:
1. Restore from backup: `cp USER_PROFILE_BACKUP.HTML USER_PROFILE.HTML`
2. Restart server
3. Test to confirm rollback worked

## Next Steps

1. **Implement Step 1-7** in the existing profile page
2. **Test each role** thoroughly
3. **Verify all fields** save correctly
4. **Test file uploads** for each role
5. **Check mobile responsiveness**
6. **Deploy to production**

---

**Estimated Implementation Time:** 2-3 hours
**Estimated Testing Time:** 1-2 hours
**Total:** 3-5 hours

**Status:** Ready for implementation
