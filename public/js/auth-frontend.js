// Frontend Authentication Handler
// Use this in HTML templates to protect pages and check admin status

const supabase = window.supabase;

/**
 * Check if user is authenticated and get their session
 */
async function getAuthSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[getAuthSession] Error:', error.message);
      return null;
    }
    
    if (!session) {
      console.log('[getAuthSession] No active session');
      return null;
    }
    
    return session;
  } catch (err) {
    console.error('[getAuthSession] Error:', err);
    return null;
  }
}

/**
 * Check if current user is admin
 */
async function isCurrentUserAdmin() {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      console.log('[isCurrentUserAdmin] No session found');
      return false;
    }
    
    // Fetch user role from users table
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single();
    
    if (error) {
      console.error('[isCurrentUserAdmin] Error fetching role:', error.message);
      return false;
    }
    
    const isAdmin = data?.role === 'admin';
    console.log('[isCurrentUserAdmin] User role:', data?.role, '→ isAdmin:', isAdmin);
    
    return isAdmin;
  } catch (err) {
    console.error('[isCurrentUserAdmin] Error:', err);
    return false;
  }
}

/**
 * Protect admin pages - redirect to login if not authenticated
 * Use this on page load of any admin page
 */
async function protectAdminPage() {
  try {
    const session = await getAuthSession();
    
    // Not logged in - redirect to login
    if (!session) {
      console.warn('[protectAdminPage] Not authenticated - redirecting to login');
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    
    // Check if admin
    const admin = await isCurrentUserAdmin();
    
    if (!admin) {
      console.warn('[protectAdminPage] User is not admin - showing access denied');
      // Show access denied message
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #d32f2f; margin-bottom: 20px;">⛔ Access Denied</h1>
            <p style="font-size: 16px; color: #666; margin-bottom: 20px;">You do not have permission to access this page.</p>
            <p style="font-size: 14px; color: #999; margin-bottom: 30px;">Admin privileges are required.</p>
            <a href="/" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px;">Go Home</a>
          </div>
        </div>
      `;
      return false;
    }
    
    console.log('[protectAdminPage] ✓ User is authorized admin');
    return true;
  } catch (err) {
    console.error('[protectAdminPage] Error:', err);
    // Fallback - show error and redirect
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    return false;
  }
}

/**
 * Hide admin UI elements from non-admin users
 */
async function hideAdminUIForNonAdmins() {
  try {
    const admin = await isCurrentUserAdmin();
    
    if (!admin) {
      // Hide all elements with admin-only class
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
      });
      console.log('[hideAdminUIForNonAdmins] Hidden admin UI elements');
    }
  } catch (err) {
    console.error('[hideAdminUIForNonAdmins] Error:', err);
  }
}

/**
 * Logout current user
 */
async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[logout] Error:', error.message);
      return false;
    }
    
    console.log('[logout] ✓ User logged out');
    window.location.href = '/login';
    return true;
  } catch (err) {
    console.error('[logout] Error:', err);
    return false;
  }
}

// Export functions for use in HTML
window.authHelpers = {
  getAuthSession,
  isCurrentUserAdmin,
  protectAdminPage,
  hideAdminUIForNonAdmins,
  logout
};
