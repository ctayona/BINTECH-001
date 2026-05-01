# Profile Page Testing Guide

## Quick Start

### Server Status
- **URL**: http://localhost:3001
- **Status**: ✅ Running
- **Port**: 3001

### Test Credentials
Use any student account from the system to test. Example:
- **Email**: jbillones.k12149156@umak.edu.ph
- **Role**: Student

---

## Test Scenarios

### Scenario 1: Load Profile Page as Student

**Steps**:
1. Navigate to http://localhost:3001/profile
2. Wait for page to load
3. Check browser console for any errors

**Expected Results**:
- ✅ Page loads without errors
- ✅ Student fields are visible
- ✅ Year Level dropdown shows 5 options
- ✅ Department dropdown shows 20 options
- ✅ All fields are populated with current data

**Console Checks**:
- ✅ "✓ Supabase client initialized and set globally"
- ✅ "✓ Profile data loaded successfully"
- ✅ "========== PROFILE PAGE READY =========="

---

### Scenario 2: Edit Year Level

**Steps**:
1. Click "Edit Profile" button
2. Click on Year Level dropdown
3. Select "Third Year"
4. Click "Save Changes"

**Expected Results**:
- ✅ Dropdown opens and shows all 5 options
- ✅ Selection is highlighted
- ✅ Save button becomes enabled
- ✅ Success message appears: "Profile updated successfully! ✓"
- ✅ Page exits edit mode

**Console Checks**:
- ✅ "Calling backend API: /auth/update-profile with file uploads"
- ✅ "✓ Profile saved successfully"

---

### Scenario 3: Edit Department

**Steps**:
1. Click "Edit Profile" button
2. Click on Department dropdown
3. Select "CCIS" (College of Computing and Information Sciences)
4. Click "Save Changes"

**Expected Results**:
- ✅ Dropdown opens and shows all 20 options
- ✅ Selection is highlighted
- ✅ Save button becomes enabled
- ✅ Success message appears
- ✅ Page exits edit mode

**Console Checks**:
- ✅ "Calling backend API: /auth/update-profile with file uploads"
- ✅ "✓ Profile saved successfully"

---

### Scenario 4: Edit Multiple Fields

**Steps**:
1. Click "Edit Profile" button
2. Change First Name to "John"
3. Select Year Level: "Fourth Year"
4. Select Department: "CITE"
5. Click "Save Changes"

**Expected Results**:
- ✅ All fields are editable
- ✅ All changes are saved
- ✅ Success message appears
- ✅ Page exits edit mode
- ✅ Reload page and verify all changes persist

---

### Scenario 5: Cancel Edit

**Steps**:
1. Click "Edit Profile" button
2. Change First Name to "Jane"
3. Select Year Level: "Second Year"
4. Click "Cancel" button

**Expected Results**:
- ✅ Changes are discarded
- ✅ Original values are restored
- ✅ Page exits edit mode
- ✅ Info message appears: "Changes discarded"

---

### Scenario 6: Upload Profile Picture

**Steps**:
1. Click "Edit Profile" button
2. Click on profile avatar
3. Select an image file (JPG, PNG, GIF, or WebP)
4. Verify preview appears
5. Click "Save Changes"

**Expected Results**:
- ✅ File picker opens
- ✅ Image preview appears in avatar
- ✅ Upload starts when saving
- ✅ Success message appears
- ✅ Profile picture updates
- ✅ Reload page and verify picture persists

**Console Checks**:
- ✅ "📤 Starting upload: [filename]"
- ✅ "✓ File uploaded successfully"
- ✅ "✓ Profile picture uploaded, signed URL stored"

---

### Scenario 7: Upload COR (Students Only)

**Steps**:
1. Click "Edit Profile" button
2. Scroll to "Class of Record (COR)" section
3. Click file input
4. Select an image file
5. Verify preview appears
6. Click "Save Changes"

**Expected Results**:
- ✅ File picker opens
- ✅ Image preview appears (20x20px thumbnail)
- ✅ Remove button appears on preview
- ✅ Upload starts when saving
- ✅ Success message appears
- ✅ COR image persists after reload

**Console Checks**:
- ✅ "📤 Uploading COR file..."
- ✅ "✓ COR uploaded, signed URL stored"

---

### Scenario 8: Remove COR Image

**Steps**:
1. Click "Edit Profile" button
2. Hover over COR preview image
3. Click the "✕" remove button
4. Click "Save Changes"

**Expected Results**:
- ✅ Remove button appears on hover
- ✅ Clicking removes the preview
- ✅ File input is cleared
- ✅ Save completes successfully
- ✅ COR image is removed from profile

---

### Scenario 9: Test Faculty Role

**Steps**:
1. Login as faculty user
2. Navigate to profile page
3. Verify faculty-specific fields are shown:
   - Faculty ID (read-only)
   - Department (editable text)
   - Position (editable text)
4. Verify student fields are hidden
5. Edit and save department and position

**Expected Results**:
- ✅ Only faculty fields are visible
- ✅ Student fields are hidden
- ✅ Fields can be edited and saved
- ✅ Changes persist after reload

---

### Scenario 10: Test Staff/Other Role

**Steps**:
1. Login as staff user
2. Navigate to profile page
3. Verify staff-specific fields are shown:
   - Account ID (read-only)
   - Designation (editable text)
   - Institution (editable text)
4. Verify student and faculty fields are hidden
5. Edit and save designation and institution

**Expected Results**:
- ✅ Only staff fields are visible
- ✅ Student and faculty fields are hidden
- ✅ Fields can be edited and saved
- ✅ Changes persist after reload

---

## Error Scenarios

### Error 1: File Too Large

**Steps**:
1. Click "Edit Profile"
2. Try to upload a file larger than 5MB

**Expected Results**:
- ✅ Error message appears: "File size exceeds 5MB limit"
- ✅ File is not uploaded
- ✅ Page remains in edit mode

---

### Error 2: Invalid File Type

**Steps**:
1. Click "Edit Profile"
2. Try to upload a non-image file (PDF, TXT, etc.)

**Expected Results**:
- ✅ Error message appears: "File type not supported"
- ✅ File is not uploaded
- ✅ Page remains in edit mode

---

### Error 3: Missing Required Fields

**Steps**:
1. Click "Edit Profile"
2. Clear First Name field
3. Click "Save Changes"

**Expected Results**:
- ✅ Error message appears: "First name and last name are required"
- ✅ Profile is not saved
- ✅ Page remains in edit mode

---

## Browser Console Checks

### Expected Console Messages (Success Path)

```
✓ Supabase client initialized and set globally
========== PROFILE PAGE INITIALIZATION ==========
Session storage user data: {...}
Current user loaded: {...}
--- Loading Profile Data ---
Calling backend API: /auth/get-profile
✓ Profile data received: {...}
Populating form fields...
Setting display values - Full Name: [name] Initials: [initials]
✓ Profile data loaded successfully
========== PROFILE PAGE READY ==========
```

### Expected Console Messages (Save Path)

```
Calling backend API: /auth/update-profile with file uploads
📤 Uploading profile picture...
📤 Starting upload: [filename] ([size]KB) to bucket: cor-uploads
📤 Sending to backend: /auth/upload (multipart/form-data)
✓ File uploaded successfully: [filename]
✓ URL obtained: [signed-url]
✓ Profile picture uploaded, signed URL stored
Calling backend API: /auth/update-profile with file uploads
✓ Profile saved successfully
```

---

## Performance Checks

### Page Load Time
- **Target**: < 2 seconds
- **Measure**: Open DevTools → Network tab → Reload page

### Save Time
- **Target**: < 1 second (without file upload)
- **Target**: < 3 seconds (with file upload)
- **Measure**: Open DevTools → Network tab → Click Save

---

## Accessibility Checks

- [ ] Tab through all form fields
- [ ] Verify all labels are associated with inputs
- [ ] Test with screen reader (NVDA or JAWS)
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Test keyboard navigation

---

## Mobile Testing

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Verify dropdowns work on mobile
- [ ] Verify file upload works on mobile
- [ ] Verify layout is responsive

---

## Data Persistence Testing

### Test 1: Reload After Save
1. Edit and save profile
2. Reload page (F5)
3. Verify all changes are still there

### Test 2: Close and Reopen
1. Edit and save profile
2. Close browser tab
3. Open new tab and navigate to profile
4. Verify all changes are still there

### Test 3: Different Browser
1. Edit and save profile in Chrome
2. Open Firefox
3. Navigate to profile
4. Verify all changes are visible

---

## Database Verification

### Check Student Department
```sql
SELECT system_id, first_name, last_name, department, year_level 
FROM student_accounts 
WHERE system_id = '[user-id]';
```

### Check Faculty Department
```sql
SELECT system_id, first_name, last_name, department, position 
FROM faculty_accounts 
WHERE system_id = '[user-id]';
```

### Check Staff Institution
```sql
SELECT system_id, first_name, last_name, designation, institution 
FROM other_accounts 
WHERE system_id = '[user-id]';
```

---

## Troubleshooting

### Issue: Dropdowns not showing options
- **Solution**: Check browser console for JavaScript errors
- **Check**: Verify page loaded completely
- **Check**: Try refreshing page

### Issue: Save button not working
- **Solution**: Check browser console for errors
- **Check**: Verify all required fields are filled
- **Check**: Check network tab for failed requests

### Issue: File upload fails
- **Solution**: Check file size (max 5MB)
- **Solution**: Check file type (JPG, PNG, GIF, WebP only)
- **Solution**: Check browser console for errors

### Issue: Changes not persisting
- **Solution**: Check browser console for save errors
- **Solution**: Check network tab for failed requests
- **Solution**: Verify database connection

---

## Success Criteria

- ✅ All dropdowns display correctly
- ✅ All fields can be edited
- ✅ All changes are saved to database
- ✅ All changes persist after reload
- ✅ File uploads work correctly
- ✅ Error messages are clear
- ✅ No console errors
- ✅ Page loads quickly
- ✅ Mobile responsive
- ✅ Accessible

---

**Last Updated**: April 30, 2026
**Status**: Ready for Testing
