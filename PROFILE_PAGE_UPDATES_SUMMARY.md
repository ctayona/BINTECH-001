# Profile Page Updates Summary

## Date: April 30, 2026

### Changes Made

#### 1. **Added Department Dropdown for Students**
- **File**: `templates/USER_PROFILE.HTML`
- **Change**: Replaced text input for "Year Level" with a dropdown select
- **Options**: First Year through Fifth Year
- **Field ID**: `yearLevel`

#### 2. **Added Department Dropdown for Students**
- **File**: `templates/USER_PROFILE.HTML`
- **Change**: Added new "Department" dropdown field for students
- **Field ID**: `studentDepartment`
- **Options**: 20 departments including:
  - CLAS (College of Liberal Arts and Sciences)
  - CBFS (College of Business and Financial Science)
  - CCIS (College of Computing and Information Sciences)
  - CCAPS (College of Continuing, Advanced and Professional Studies)
  - CITE (College of Innovative Teacher Education)
  - CCSE (College of Construction Sciences and Engineering)
  - CET (College of Engineering Technology)
  - CGPP (College of Governance and Public Policy)
  - CTHM (College of Tourism and Hospitality Management)
  - SOL (School of Law)
  - ION (Institute of Nursing)
  - IOP (Institute of Pharmacy)
  - IIHS (Institute of Imaging and Health Sciences)
  - IOA (Institute of Accountancy)
  - IOPS (Institute of Psychology)
  - IOAD (Institute of Arts and Design)
  - IOSW (Institute of Social Work)
  - IODEM (Institute of Disaster and Emergency Management)
  - IOSDN (Institute of Social Development and Nation Building)
  - CHK (Center of Human Kinesthetics)

#### 3. **Updated JavaScript to Handle New Fields**
- **File**: `templates/USER_PROFILE.HTML`
- **Changes**:
  - Added `studentDepartment` to `editableFields` array
  - Updated `loadProfileData()` to populate `studentDepartment` from `profile.department`
  - Updated `handleSaveProfile()` to save `studentDepartment` as `department` in update data
  - Updated `cancelEditMode()` to restore `studentDepartment` value
  - Updated `originalData` storage to include `studentDepartment`

### Profile Picture Upload Status

**Current Status**: Using workaround with `cor-uploads` bucket
- **Issue**: `profile-pictures` bucket returns HTTP 400 error
- **Workaround**: Profile pictures are uploaded to `cor-uploads` bucket instead
- **Location**: Line 1141 in `templates/USER_PROFILE.HTML`
- **Note**: This is a temporary workaround. The `profile-pictures` bucket needs proper permissions configuration in Supabase.

### Role-Based System Status

**Student Role Fields**:
- ✅ Student ID (read-only)
- ✅ Program (editable text)
- ✅ Year Level (editable dropdown)
- ✅ Department (editable dropdown) - **NEW**
- ✅ COR Upload (image upload with preview)
- ✅ Profile Picture (upload with preview)

**Faculty Role Fields**:
- ✅ Faculty ID (read-only)
- ✅ Department (editable text)
- ✅ Position (editable text)
- ✅ Profile Picture (upload with preview)

**Staff/Other Role Fields**:
- ✅ Account ID (read-only)
- ✅ Designation (editable text)
- ✅ Institution (editable text)
- ✅ Profile Picture (upload with preview)

### Testing Checklist

- [ ] Load profile page as student
- [ ] Verify Year Level dropdown shows all 5 options
- [ ] Verify Department dropdown shows all 20 options
- [ ] Edit profile and select Year Level
- [ ] Edit profile and select Department
- [ ] Save profile with new Year Level and Department
- [ ] Verify data persists after page reload
- [ ] Test profile picture upload (should use cor-uploads bucket)
- [ ] Test COR upload for students
- [ ] Test cancel button restores original values
- [ ] Test with faculty role
- [ ] Test with staff/other role

### Next Steps

1. **Fix profile-pictures bucket**: 
   - Check Supabase bucket permissions
   - Ensure bucket exists and has proper RLS policies
   - Test direct upload to profile-pictures bucket

2. **Backend Integration**:
   - Verify `authController.updateProfile()` handles `department` field for students
   - Ensure database schema supports `department` field for all roles

3. **Testing**:
   - Test profile page with all three roles
   - Verify dropdowns work correctly
   - Verify file uploads work
   - Verify data persistence

### Files Modified

1. `templates/USER_PROFILE.HTML` - Added dropdowns and updated JavaScript

### Files Not Modified (But May Need Updates)

1. `controllers/authController.js` - May need to handle `department` field for students
2. Database schema - May need to verify `department` column exists for all user roles
