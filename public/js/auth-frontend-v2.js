// Frontend Authentication Handler - Version 2
// Works with localStorage for admin authentication
// Protects all pages via JavaScript (no server middleware needed)

console.log('[auth-frontend-v2.js] Loading...');

/**
 * Get user from localStorage
 */
function getLocalUser() {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      console.log('[getLocalUser] Found user:', user.email);
    }
    return user;
  } catch (err) {
    console.error('[getLocalUser] Error:', err);
    return null;
  }
}

function getActiveUser() {
  const localUser = getLocalUser();
  if (localUser) {
    return localUser;
  }

  try {
    const sessionUser = JSON.parse(sessionStorage.getItem('bintech_user') || 'null');
    if (sessionUser) {
      return sessionUser;
    }
  } catch (err) {
    console.error('[getActiveUser] Error:', err);
  }

  return null;
}

function isAdminRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'head';
}

/**
 * Check if user is authenticated and get their session
 */
function getAuthSession() {
  const user = getLocalUser();
  if (user) {
    return { user: user, authenticated: true };
  }
  return null;
}

/**
 * Check if current user is admin (from localStorage)
 */
function isCurrentUserAdmin() {
  const user = getLocalUser();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  const result = isAdmin && user && isAdminRole(user.role);
  console.log('[isCurrentUserAdmin] User:', user?.email, '| role:', user?.role, '| isAdmin flag:', isAdmin, '| Result:', result);
  
  return result;
}

/**
 * Protect admin pages - redirect based on role
 * Admin → Allow page load
 * Regular user → Redirect to /dashboard
 * Not logged in → Redirect to /login
 */
function protectAdminPage() {
  console.log('[protectAdminPage] ===== CHECKING ADMIN PAGE PROTECTION =====');
  
  const user = getLocalUser();
  const isAdmin = isCurrentUserAdmin();
  
  console.log('[protectAdminPage] User:', user?.email);
  console.log('[protectAdminPage] Is Admin:', isAdmin);
  console.log('[protectAdminPage] Current URL:', window.location.pathname);
  
  // Not logged in - redirect to login
  if (!user) {
    console.warn('[protectAdminPage] NO USER LOGGED IN - Redirecting to / (landing page)');
    window.location.href = '/';
    return false;
  }
  
  // Check if admin
  if (!isAdmin) {
    console.warn('[protectAdminPage] USER NOT ADMIN - Redirecting to /dashboard');
    console.warn('[protectAdminPage] User role is:', user.role);
    window.location.href = '/dashboard';
    return false;
  }
  
  console.log('[protectAdminPage] ✓ ADMIN AUTHORIZED - Page will load');
  return true;
}

/**
 * Hide admin UI elements from non-admin users
 */
function hideAdminUIForNonAdmins() {
  const isAdmin = isCurrentUserAdmin();
  
  if (!isAdmin) {
    // Hide all elements with admin-only class
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
      el.style.display = 'none';
    });
    console.log('[hideAdminUIForNonAdmins] Hidden ' + adminElements.length + ' admin-only elements');
  }
}

/**
 * Show logout notification card
 */
function showLogoutNotification() {
  // Create notification HTML
  const notification = document.createElement('div');
  notification.id = 'logoutNotification';
  notification.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); animation: slideUp 0.3s ease-out;">
        <div style="width: 60px; height: 60px; background: #3d8b7a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <svg style="width: 32px; height: 32px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </div>
        <h2 style="color: #1a3a2f; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">You're Logged Out</h2>
        <p style="color: #6b9080; font-size: 14px; margin: 0 0 24px 0;">You have been successfully logged out.</p>
        <p style="color: #999; font-size: 12px; margin: 0;">Redirecting to home page...</p>
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>
  `;
  
  document.body.appendChild(notification);
}

/**
 * Logout current user
 */
async function logout() {
  console.log('[logout] Logging out...');
  
  // Show logout notification
  showLogoutNotification();

  const activeUser = getActiveUser();
  
  // Clear auth state from both storage layers used by the app
  localStorage.removeItem('user');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('bintech_user');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('isAdmin');
  sessionStorage.removeItem('bintech_user');
  sessionStorage.removeItem('adminName');
  sessionStorage.removeItem('adminInitials');
  console.log('[logout] Cleared localStorage');

  try {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: activeUser?.email || null
      })
    });
  } catch (err) {
    console.warn('[logout] Backend logout request failed, continuing client-side cleanup:', err);
  }
  
  console.log('[logout] Redirecting to / (landing page)');
  window.location.href = '/';
}

// Export functions for use in HTML
window.authHelpers = {
  getAuthSession,
  getLocalUser,
  isCurrentUserAdmin,
  protectAdminPage,
  hideAdminUIForNonAdmins,
  showLogoutNotification,
  logout
};

console.log('[auth-frontend-v2.js] ✓ Loaded - authHelpers available');
