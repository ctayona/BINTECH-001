# Maintenance Mode Implementation - Complete Modified Files

## Overview
Three files were modified to implement the maintenance mode system that allows admins to access all panels while regular users see the maintenance page.

---

## 1. **app.js** - Main Server File (Key Changes)

### Key Modifications:
1. Added `cookie-parser` import (line 6)
2. Added cookie parser middleware (line 54)
3. Implemented 4-method maintenance bypass logic (lines 120-178)
   - Method 1: JWT token check
   - Method 2: Session cookie check
   - Method 3: Custom x-user-role header
   - Method 4: **user_role cookie** (primary method)
4. Added API 403 response for non-admin users during maintenance

### Critical Code Section (Maintenance Middleware):
```javascript
// ============================================
// MAINTENANCE MODE MIDDLEWARE WITH ADMIN BYPASS
// ============================================
// This middleware redirects all traffic to maintenance page when enabled
// EXCEPT for admin users who can still access the system
app.use((req, res, next) => {
  // Skip if maintenance mode is disabled
  if (!MAINTENANCE_MODE) {
    return next();
  }
  
  // Allow access to maintenance page itself
  if (req.path === '/maintenance') {
    return next();
  }
  
  // Allow access to landing page (login page) so users can login
  if (req.path === '/' || req.path === '/login') {
    return next();
  }
  
  // Allow access to static files (CSS, JS, images, fonts)
  if (req.path.startsWith('/css') || 
      req.path.startsWith('/js') || 
      req.path.startsWith('/images') ||
      req.path.startsWith('/fonts')) {
    return next();
  }
  
  // Allow access to auth endpoints (needed for login/signup)
  if (req.path.startsWith('/auth') || req.path.startsWith('/api/auth')) {
    return next();
  }
  
  // ============================================
  // ADMIN BYPASS LOGIC - 4 Methods
  // ============================================
  
  // Method 1: Check Authorization header (JWT token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      if (decoded.role === 'admin' || decoded.role === 'head') {
        console.log('🔓 Admin bypass: Allowing admin access during maintenance (JWT)');
        return next();
      }
    } catch (err) {
      console.log('⚠️ Invalid token during maintenance mode');
    }
  }
  
  // Method 2: Check session cookie
  if (req.session && req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'head')) {
    console.log('🔓 Admin bypass: Allowing admin access during maintenance (Session)');
    return next();
  }
  
  // Method 3: Check custom header
  const userRole = req.headers['x-user-role'];
  if (userRole === 'admin' || userRole === 'head') {
    console.log('🔓 Admin bypass: Allowing admin access during maintenance (Header)');
    return next();
  }

  // Method 4: Check user_role cookie (PRIMARY - set by login endpoint)
  const cookieRole = req.cookies?.user_role;
  if (cookieRole === 'admin' || cookieRole === 'head') {
    console.log('🔓 Admin bypass: Allowing admin access during maintenance (Cookie)');
    return next();
  }
  
  // If not admin, handle request appropriately
  if (req.path.startsWith('/api/')) {
    // For API requests, return 403
    console.log('🚧 Maintenance mode: Blocking API request from non-admin user');
    return res.status(403).json({
      success: false,
      message: 'System is under maintenance. Only administrators can access the system.',
      error: 'MAINTENANCE_MODE_ENABLED'
    });
  }
  
  // For page requests, redirect to maintenance page
  console.log('🚧 Maintenance mode: Redirecting non-admin user to maintenance page');
  return res.redirect('/maintenance');
});
```

---

## 2. **controllers/authController.js** - Authentication Controller (Key Changes)

### Key Modifications:
1. Set `user_role` cookie on successful admin login (lines 750-757)
2. Set `user_role` cookie on successful user login (lines 880-887)
3. Clear `user_role` cookie on logout (added clear cookie call)

### Critical Code Sections:

#### Admin Login - Set Cookie:
```javascript
// After successful admin authentication, BEFORE returning response
const normalizedRole = String(adminUser.role || 'admin').trim().toLowerCase();

// ✅ SET USER_ROLE COOKIE HERE
res.cookie('user_role', normalizedRole, {
  httpOnly: false,
  maxAge: 86400 * 1000, // 24 hours
  path: '/'
});

return res.json({
  success: true,
  message: 'Login successful',
  isAdmin: true,
  user: {
    id: adminUser.id,
    email: adminUser.email,
    first_name: firstName,
    role: normalizedRole,
    // ... other user data
  }
});
```

#### User Login - Set Cookie:
```javascript
// After successful user authentication
const normalizedRole = String(userAccount.role || 'staff').trim().toLowerCase();

// ✅ SET USER_ROLE COOKIE HERE
res.cookie('user_role', normalizedRole, {
  httpOnly: false,
  maxAge: 86400 * 1000, // 24 hours
  path: '/'
});

return res.json({
  success: true,
  message: 'Login successful',
  isAdmin: false,
  user: {
    id: userAccount.system_id,
    email: userAccount.email,
    role: normalizedRole,
    // ... other user data
  }
});
```

#### Logout - Clear Cookie:
```javascript
exports.logout = async (req, res) => {
  try {
    // Extract user info from request if available
    const userEmail = req.body?.email || req.user?.email || 'unknown';
    const timestamp = new Date().toISOString();
    
    console.log('\n========== LOGOUT START ==========');
    console.log(`Timestamp: ${timestamp}`);
    console.log(`User: ${userEmail}`);
    console.log(`IP Address: ${req.ip}`);
    console.log('==================================\n');
    
    console.log(`✓ User ${userEmail} logged out successfully`);
    
    // ✅ CLEAR USER_ROLE COOKIE ON LOGOUT
    res.clearCookie('user_role', { path: '/' });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
};
```

---

## 3. **public/js/auth.js** - Frontend Authentication (Key Changes)

### Key Modifications:
1. Added fetch interceptor (lines 119-137) to include `x-user-role` header
2. Updated `handleLogout()` function (lines 788-809) to clear cookie and notify backend

### Critical Code Sections:

#### Fetch Interceptor:
```javascript
// ============================================
// Fetch Interceptor for Auth Headers
// ============================================
// Automatically add x-user-role header to all requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [resource, config = {}] = args;
  
  // Get the user's role from storage
  const user = AuthManager.getUser();
  const userRole = user?.role || null;
  
  // Add x-user-role header if user is logged in
  if (userRole) {
    config.headers = config.headers || {};
    config.headers['x-user-role'] = userRole;
    console.log(`[fetch-interceptor] Added x-user-role: ${userRole} to ${resource}`);
  }
  
  // Call original fetch with modified config
  return originalFetch.call(this, resource, config);
};
```

#### Updated Logout Handler:
```javascript
// ============================================
// Global Logout Handler - UPDATED
// ============================================
async function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    AuthManager.logout();
    
    // Clear cookie on the client side
    document.cookie = 'user_role=; path=/; max-age=0';
    
    // Notify backend to clear server-side session
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.warn('Backend logout failed, continuing:', err);
    }
    
    window.location.href = '/';
  }
}
```

---

## Installation & Setup

### Step 1: Install Dependencies
```bash
npm install cookie-parser
```

### Step 2: Update app.js
- Add `const cookieParser = require('cookie-parser');`
- Add `app.use(cookieParser());` after CORS middleware
- Replace the maintenance middleware section with the new 4-method bypass logic

### Step 3: Update controllers/authController.js
- Add cookie setting in admin login handler (lines 750-757)
- Add cookie setting in user login handler (lines 880-887)
- Add cookie clearing in logout handler

### Step 4: Update public/js/auth.js
- Add the fetch interceptor after AuthManager class
- Update handleLogout() function

### Step 5: Toggle Maintenance Mode
```javascript
// In app.js, line 21
const MAINTENANCE_MODE = true;  // Set to true to enable, false to disable
```

---

## How It Works

### Admin Access During Maintenance:
1. Admin logs in with credentials
2. Login endpoint sets `user_role` cookie with value `'admin'` or `'head'`
3. Browser automatically sends cookie with all requests
4. Maintenance middleware checks cookie
5. Recognizes admin and allows full access
6. Admin can access:
   - ✅ All `/admin/*` pages
   - ✅ All `/api/admin/*` endpoints
   - ✅ All dashboard features

### Regular User Access During Maintenance:
1. User logs in with credentials
2. Login endpoint sets `user_role` cookie with value `'student'`, `'faculty'`, or `'staff'`
3. Browser sends cookie with page navigation request
4. Maintenance middleware checks cookie
5. Does NOT match admin roles
6. User is redirected to `/maintenance` page
7. All API requests return 403 status

### On Logout:
1. Frontend clears the `user_role` cookie
2. Frontend calls `/auth/logout` endpoint
3. Backend also clears the cookie
4. User is redirected to home page
5. On next visit, maintenance page is shown

---

## Testing Checklist

- [ ] Server starts without errors
- [ ] Admin can log in
- [ ] Admin sees `user_role=admin` (or `head`) cookie set
- [ ] Admin can access `/admin/dashboard`
- [ ] Admin can access all `/api/admin/*` endpoints
- [ ] Regular user can log in
- [ ] Regular user sees `user_role=student` (or similar) cookie
- [ ] Regular user is redirected to `/maintenance` page
- [ ] Admin logout clears cookie
- [ ] Regular user logout clears cookie
- [ ] Maintenance mode toggle works (change `MAINTENANCE_MODE` to false/true)

---

## Files Modified
1. ✅ `app.js` - Server configuration and maintenance middleware
2. ✅ `controllers/authController.js` - Login/logout handlers with cookie management
3. ✅ `public/js/auth.js` - Frontend authentication and logout handler

## Dependencies Added
- ✅ `cookie-parser` - Parse cookies from HTTP requests

