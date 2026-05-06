/**
 * Profile Page Refactor - Complete JavaScript Implementation
 * Role-Based Dynamic Profile System
 * 
 * This file contains all the JavaScript code needed to implement
 * the role-based profile system. Copy and paste into USER_PROFILE.HTML
 */

// ============================================
// ROLE CONFIGURATION
// ============================================

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

// ============================================
// DROPDOWN OPTIONS
// ============================================

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

// ============================================
// FIELD MAPPING
// ============================================

const FIELD_MAPPING = {
  student: {
    'system_id': 'systemId',
    'first_name': 'firstName',
    'middle_name': 'middleName',
    'last_name': 'lastName',
    'student_id': 'studentId',
    'program': 'program',
    'year_level': 'yearLevel',
    'department': 'department',
    'cor': 'corFile',
    'profile_picture': 'profilePicture'
  },
  faculty: {
    'system_id': 'systemId',
    'first_name': 'firstName',
    'middle_name': 'middleName',
    'last_name': 'lastName',
    'faculty_id': 'facultyId',
    'department': 'department',
    'position': 'position',
    'profile_picture': 'profilePicture'
  },
  other: {
    'system_id': 'systemId',
    'first_name': 'firstName',
    'middle_name': 'middleName',
    'last_name': 'lastName',
    'account_id': 'accountId',
    'designation': 'designation',
    'affiliation': 'affiliation',
    'profile_picture': 'profilePicture'
  }
};

// ============================================
// ROLE DETECTION
// ============================================

function detectUserRole() {
  try {
    const userStr = sessionStorage.getItem('bintech_user');
    if (!userStr) {
      console.error('No user data in sessionStorage');
      return null;
    }
    
    const user = JSON.parse(userStr);
    const role = user.role || null;
    
    console.log(`✓ User role detected: ${role}`);
    return role;
  } catch (error) {
    console.error('Error detecting user role:', error);
    return null;
  }
}

// ============================================
// SECTION VISIBILITY MANAGER
// ============================================

function updateSectionVisibility(role) {
  console.log(`📋 Updating section visibility for role: ${role}`);
  
  // Hide all role-specific sections
  const sections = ['studentFields', 'facultyFields', 'staffFields'];
  sections.forEach(sectionId => {
    const elem = document.getElementById(sectionId);
    if (elem) elem.classList.add('hidden');
  });
  
  // Show role-specific section
  if (role === 'student') {
    const elem = document.getElementById('studentFields');
    if (elem) elem.classList.remove('hidden');
  } else if (role === 'faculty') {
    const elem = document.getElementById('facultyFields');
    if (elem) elem.classList.remove('hidden');
  } else if (role === 'staff' || role === 'other') {
    const elem = document.getElementById('staffFields');
    if (elem) elem.classList.remove('hidden');
  }
  
  console.log(`✓ Section visibility updated`);
}

// ============================================
// DROPDOWN POPULATOR
// ============================================

function populateDropdowns(role) {
  console.log(`📝 Populating dropdowns for role: ${role}`);
  
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
  
  console.log(`✓ Dropdowns populated`);
}

// ============================================
// FIELD MAPPER
// ============================================

function mapBackendToFrontend(backendData, role) {
  console.log(`🔄 Mapping backend data for role: ${role}`);
  
  const mapping = FIELD_MAPPING[role] || {};
  const frontendData = {};
  
  Object.entries(mapping).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      frontendData[frontendKey] = backendData[backendKey];
    }
  });
  
  console.log(`✓ Data mapped:`, frontendData);
  return frontendData;
}

// ============================================
// FIELD POPULATOR
// ============================================

function populateFormFields(data, role) {
  console.log(`📋 Populating form fields for role: ${role}`);
  
  const config = ROLE_CONFIG[role];
  if (!config) {
    console.error(`Invalid role: ${role}`);
    return;
  }
  
  // Populate all editable fields
  config.editableFields.forEach(fieldId => {
    const elem = document.getElementById(fieldId);
    if (elem && data[fieldId] !== undefined) {
      elem.value = data[fieldId] || '';
    }
  });
  
  console.log(`✓ Form fields populated`);
}

// ============================================
// FIELD VALIDATOR
// ============================================

function validateFormFields(role) {
  console.log(`✓ Validating form fields for role: ${role}`);
  
  const config = ROLE_CONFIG[role];
  if (!config) return false;
  
  // Check required fields
  const requiredFields = ['firstName', 'lastName'];
  for (const fieldId of requiredFields) {
    const elem = document.getElementById(fieldId);
    if (!elem || !elem.value.trim()) {
      showError(`${fieldId} is required`);
      return false;
    }
  }
  
  console.log(`✓ Validation passed`);
  return true;
}

// ============================================
// FORM DATA COLLECTOR
// ============================================

function collectFormData(role) {
  console.log(`📦 Collecting form data for role: ${role}`);
  
  const config = ROLE_CONFIG[role];
  if (!config) return null;
  
  const data = {
    system_id: currentUser.id,
    role: role
  };
  
  // Collect editable fields
  config.editableFields.forEach(fieldId => {
    const elem = document.getElementById(fieldId);
    if (elem) {
      data[fieldId] = elem.value || null;
    }
  });
  
  console.log(`✓ Form data collected:`, data);
  return data;
}

// ============================================
// SAVE HANDLER
// ============================================

async function handleSaveProfile(event, role) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Saving...';
  
  try {
    // Validate form
    if (!validateFormFields(role)) {
      throw new Error('Form validation failed');
    }
    
    // Collect form data
    const updateData = collectFormData(role);
    if (!updateData) {
      throw new Error('Failed to collect form data');
    }
    
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to save profile');
    }
    
    console.log('✓ Profile saved successfully');
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

// ============================================
// PAGE INITIALIZATION
// ============================================

async function initializeRoleBasedProfile() {
  try {
    console.log('========== ROLE-BASED PROFILE INITIALIZATION ==========');
    
    // Detect role
    const role = detectUserRole();
    if (!role) {
      throw new Error('Unable to determine user role');
    }
    
    // Update UI based on role
    updateSectionVisibility(role);
    populateDropdowns(role);
    
    // Load profile data
    await loadProfileData(role);
    
    // Setup form handlers
    setupFormHandlers(role);
    
    console.log(`✓ Profile page initialized for role: ${role}`);
    console.log('========== INITIALIZATION COMPLETE ==========');
    
  } catch (error) {
    console.error('Error initializing role-based profile:', error);
    showError('Failed to initialize profile page: ' + error.message);
  }
}

// ============================================
// FORM HANDLERS SETUP
// ============================================

function setupFormHandlers(role) {
  console.log(`⚙️ Setting up form handlers for role: ${role}`);
  
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.onsubmit = (event) => handleSaveProfile(event, role);
  }
  
  console.log(`✓ Form handlers setup complete`);
}

// ============================================
// EXPORT FOR USE
// ============================================

// Call this function on page load:
// document.addEventListener('DOMContentLoaded', initializeRoleBasedProfile);

// Or replace the existing initializePage() call with:
// initializeRoleBasedProfile();
