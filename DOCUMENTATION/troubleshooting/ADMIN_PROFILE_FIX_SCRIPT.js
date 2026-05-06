/**
 * Admin Profile Population Script
 * Add this to all admin panel templates to ensure consistent admin profile display
 * 
 * Usage: Call populateAdminProfile() on DOMContentLoaded
 */

// ============================================
// POPULATE ADMIN PROFILE
// ============================================
function populateAdminProfile() {
  try {
    const user = getLocalUser();
    if (user) {
      // Set admin name
      const fullName = user.full_name || user.name || 'Admin';
      const nameEl = document.getElementById('adminName');
      if (nameEl) {
        nameEl.textContent = fullName;
      }
      
      // Set admin email
      const emailEl = document.getElementById('adminEmail');
      if (emailEl) {
        emailEl.textContent = user.email || 'admin@example.com';
      }
      
      // Set admin initials
      const initials = fullName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
      const initialsEl = document.getElementById('adminInitials');
      if (initialsEl) {
        initialsEl.textContent = initials || 'AD';
      }
      
      console.log('[populateAdminProfile] ✓ Admin profile populated:', { 
        name: fullName, 
        email: user.email, 
        initials 
      });
    } else {
      console.warn('[populateAdminProfile] No user found in localStorage');
    }
  } catch (error) {
    console.error('[populateAdminProfile] Error:', error);
  }
}

// Call this on page load:
// document.addEventListener('DOMContentLoaded', populateAdminProfile);
