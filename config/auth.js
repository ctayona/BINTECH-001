// Authentication and authorization helper
const supabase = require('./supabase');

/**
 * Check if user is authenticated
 * @returns {Promise<{authenticated: boolean, user: object}>}
 */
async function checkAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('[checkAuth] No active session');
      return { authenticated: false, user: null };
    }
    
    console.log('[checkAuth] Session found for user:', session.user.email);
    return { 
      authenticated: true, 
      user: { id: session.user.id, email: session.user.email }
    };
  } catch (err) {
    console.error('[checkAuth] Error:', err);
    return { authenticated: false, user: null };
  }
}

/**
 * Check if user is admin
 * @param {string} userId - User ID from auth
 * @returns {Promise<boolean>}
 */
async function isAdmin(userId) {
  try {
    if (!userId) {
      console.warn('[isAdmin] No user ID provided');
      return false;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', userId)
      .single();
    
    if (error) {
      console.error('[isAdmin] Query error:', error.message);
      return false;
    }
    
    const isAdminUser = data && data.role === 'admin';
    console.log('[isAdmin] User role:', data?.role, '→ isAdmin:', isAdminUser);
    
    return isAdminUser;
  } catch (err) {
    console.error('[isAdmin] Error:', err);
    return false;
  }
}

/**
 * Get user's role
 * @param {string} userId - User ID from auth
 * @returns {Promise<string>} Returns 'admin' or 'user' or 'unknown'
 */
async function getUserRole(userId) {
  try {
    if (!userId) {
      return 'unknown';
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', userId)
      .single();
    
    if (error || !data) {
      console.warn('[getUserRole] Could not fetch role:', error?.message);
      return 'unknown';
    }
    
    return data.role || 'user';
  } catch (err) {
    console.error('[getUserRole] Error:', err);
    return 'unknown';
  }
}

/**
 * Check admin access and redirect if unauthorized
 * Call this on admin pages to protect them
 * @returns {Promise<boolean>} True if authorized, false otherwise
 */
async function requireAdminAccess(res) {
  try {
    const { authenticated, user } = await checkAuth();
    
    if (!authenticated || !user) {
      console.warn('[requireAdminAccess] Not authenticated - redirecting to login');
      if (res) {
        return res.redirect('/login');
      }
      return false;
    }
    
    const admin = await isAdmin(user.id);
    
    if (!admin) {
      console.warn('[requireAdminAccess] User is not admin - blocking access');
      if (res) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Admin privileges required'
        });
      }
      return false;
    }
    
    console.log('[requireAdminAccess] ✓ Admin access granted for:', user.email);
    return true;
  } catch (err) {
    console.error('[requireAdminAccess] Error:', err);
    if (res) {
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
    return false;
  }
}

module.exports = {
  checkAuth,
  isAdmin,
  getUserRole,
  requireAdminAccess
};
