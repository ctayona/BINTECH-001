// Admin Authorization Middleware
// Checks if user is authenticated and has admin role

const supabase = require('../config/supabase');

/**
 * Middleware to check admin authorization
 * For page loads: Let them through, frontend JS will verify
 * For API calls: Require Bearer token and admin role
 */
async function checkAdminAuth(req, res, next) {
  try {
    // Get session from request headers
    const authHeader = req.headers.authorization;
    
    // For page requests (HTML), allow through - frontend will verify
    // Only enforce Bearer token for API requests
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[checkAdminAuth] No Bearer token - allowing page load (frontend will verify)');
      // If it's an API request (marked by Accept header or json request), require auth
      if (req.accepts('json') && req.path.startsWith('/api')) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: API requires Bearer token'
        });
      }
      // For HTML page loads, let them through
      return next();
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log('[checkAdminAuth] Bearer token found for API request');
    
    // Verify and decode the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.warn('[checkAdminAuth] Invalid token:', authError?.message);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid session'
      });
    }

    const normalizedEmail = String(user.email || '').trim().toLowerCase();
    const isAdminRole = (role) => {
      const normalizedRole = String(role || '').trim().toLowerCase();
      return normalizedRole === 'admin' || normalizedRole === 'head';
    };
    
    // Fetch user role from admin_accounts first, then fall back to users
    const { data: adminData, error: adminDbError } = await supabase
      .from('admin_accounts')
      .select('role, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    const { data: userData, error: dbError } = adminData
      ? { data: null, error: null }
      : await supabase
        .from('users')
        .select('role, email')
        .ilike('email', normalizedEmail)
        .maybeSingle();

    const roleSource = adminData || userData;
    const roleError = adminData ? adminDbError : dbError;

    if (roleError || !roleSource) {
      console.warn('[checkAdminAuth] Could not fetch user role:', roleError?.message);
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Could not verify user role'
      });
    }
    
    // Check if user is admin-capable
    if (!isAdminRole(roleSource.role)) {
      console.warn('[checkAdminAuth] User is not admin:', user.email, 'role:', roleSource.role);
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Admin privileges required'
      });
    }
    
    // Attach user to request for use in controllers
    req.user = {
      id: user.id,
      email: user.email,
      role: String(roleSource.role || '').trim().toLowerCase()
    };
    
    console.log('[checkAdminAuth] ✓ Admin access granted for:', user.email);
    next();
  } catch (err) {
    console.error('[checkAdminAuth] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
}

module.exports = {
  checkAdminAuth
};
