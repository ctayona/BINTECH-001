# Admin Settings Interface - Quick Reference Guide

## File Location
`templates/ADMIN_SETTINGS.html`

## Key Features at a Glance

### 📋 Sections
1. **Profile Header** - Avatar, name, email, role/status badges
2. **Personal Information** - First/Middle/Last Name, Email, Phone (editable)
3. **Account Details** - ID, Role, Auth ID, Google ID, Timestamps (read-only)
4. **Security & Password** - Current/New/Confirm Password with visibility toggle
5. **Archive Information** - Conditional section showing if account is archived

### 🎨 Design
- **Glass Morphism**: Modern backdrop blur effects
- **Responsive**: Desktop, tablet, mobile optimized
- **Animations**: Smooth lift-in effects with staggered delays
- **Colors**: Forest green, teal, moss, sage, cream

### ⚙️ Functionality

#### Load Profile
```javascript
loadProfile() // Called on page load
// Fetches from GET /api/admin/settings
// Updates header, form fields, and archive section
```

#### Save Changes
```javascript
saveSettings() // Called on Save button click
// Validates all fields
// Sends PUT to /api/admin/settings
// Updates session storage
// Shows success/error notification
```

#### Cancel Changes
```javascript
cancelEdit() // Called on Cancel button click
// Restores original data
// Clears password fields
// Shows confirmation dialog
```

#### Password Visibility
```javascript
togglePasswordVisibility(fieldId) // Called on eye icon click
// Toggles between password and text type
// Works for all three password fields
```

#### Full Name Auto-Generation
```javascript
updateFullNameDisplay() // Called on name field input
// Generates full name from First/Middle/Last Name
// Updates read-only display field
// Real-time as user types
```

### 🔐 Password Requirements
- ✓ Minimum 8 characters
- ✓ At least 1 uppercase letter (A-Z)
- ✓ At least 1 lowercase letter (a-z)
- ✓ At least 1 number (0-9)
- ✓ At least 1 special character (@$!%*?&)

### 📱 Responsive Breakpoints
- **Desktop**: Full layout with all features
- **Tablet (1024px)**: Adjusted spacing, single column info grid
- **Mobile (640px)**: Optimized typography, compact cards

### 🎯 Form Fields

#### Editable Fields
- First Name
- Middle Name
- Last Name
- Email Address
- Phone Number
- Current Password (for change)
- New Password (for change)
- Confirm Password (for change)

#### Read-Only Fields
- Full Name (auto-generated)
- Account ID
- Role
- Auth ID
- Google ID
- Created At
- Last Updated
- Archive Status (if archived)
- Archived At (if archived)
- Archived By (if archived)
- Archive Reason (if archived)

### 🔔 Notifications
- **Success**: Green background with checkmark icon
- **Error**: Red background with X icon
- **Auto-dismiss**: Stays visible until user action

### 🎬 Animations
- **Lift-In**: 0.6s cubic-bezier easing
- **Delays**: 0.1s, 0.2s, 0.3s, 0.4s for staggered effect
- **Hover**: 0.3s smooth transitions on cards

### 📊 Database Fields Handled
```
✅ id (UUID)
✅ email (text)
✅ full_name (text, auto-generated)
✅ role (admin/head)
✅ phone (text)
✅ created_at (timestamp)
✅ updated_at (timestamp)
✅ First_Name (varchar)
✅ Middle_Name (varchar)
✅ Last_Name (varchar)
✅ Google_ID (text)
✅ password (text)
✅ auth_id (UUID)
✅ is_archived (boolean)
✅ archived_at (timestamp)
✅ archived_by_email (text)
✅ archive_reason (text)
```

### 🔗 API Endpoints

#### GET /api/admin/settings
Load profile data
```javascript
Headers: X-User-Email (optional)
Response: { success: true, settings: {...} }
```

#### PUT /api/admin/settings
Save profile changes
```javascript
Headers: X-User-Email (optional)
Body: {
  First_Name, Middle_Name, Last_Name,
  email, phone,
  password (optional)
}
Response: { success: true, settings: {...} }
```

### 🧪 Testing Checklist
- [ ] Profile loads on page load
- [ ] All fields display correctly
- [ ] Full name auto-generates as you type
- [ ] Password visibility toggle works
- [ ] Password validation works
- [ ] Save button saves changes
- [ ] Cancel button discards changes
- [ ] Archive section shows/hides correctly
- [ ] Notifications display properly
- [ ] Responsive on mobile
- [ ] No console errors

### 🚀 Deployment
1. Verify API endpoints are working
2. Test with real admin accounts
3. Test password change flow
4. Test responsive design
5. Deploy to production
6. Monitor for issues

### 📝 Notes
- Full Name is auto-generated and read-only
- Archive section only shows if account is archived
- Password fields are optional (leave blank to keep current)
- All timestamps are formatted to locale-specific format
- Google ID is truncated to 20 characters for display
- Session storage is updated after successful save

### 🎨 Color Scheme
- **Forest**: #1a3a2f (primary text)
- **Teal**: #3d8b7a (accents)
- **Moss**: #6b9080 (secondary text)
- **Sage**: #a4c3a2 (tertiary)
- **Cream**: #f8f5f0 (background)

### 📦 Dependencies
- Tailwind CSS 3.4.17
- Plus Jakarta Sans font
- auth-frontend-v2.js
- timestampUtils.js

---

**Last Updated**: May 1, 2026
**Status**: ✅ Complete
