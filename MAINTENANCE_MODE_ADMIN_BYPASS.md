# 🔓 Maintenance Mode - Admin Bypass System

## Overview
The admin bypass system allows administrators to access the BinTECH platform even when maintenance mode is enabled, while regular users are redirected to the maintenance page.

---

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    User Visits Website                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Is MAINTENANCE_MODE = true?                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
                   NO              YES
                    │               │
                    ↓               ↓
            ┌───────────┐   ┌──────────────┐
            │  Allow    │   │ Check User   │
            │  Access   │   │    Role      │
            └───────────┘   └──────────────┘
                                    ↓
                            ┌───────┴───────┐
                            │               │
                         ADMIN          REGULAR USER
                            │               │
                            ↓               ↓
                    ┌───────────┐   ┌──────────────┐
                    │  Allow    │   │  Redirect to │
                    │  Access   │   │ /maintenance │
                    └───────────┘   └──────────────┘
```

---

## 📁 Files Involved

### 1. **app.js** (Backend)
**Location:** `C:\Users\kydel\Downloads\tample\app.js`

**Line 20:** Maintenance mode toggle
```javascript
const MAINTENANCE_MODE = true; // ← Change to true/false
```

**Lines 86-135:** Maintenance middleware with admin bypass
```javascript
app.use((req, res, next) => {
  if (!MAINTENANCE_MODE) return next();
  
  // Allow maintenance page and static files
  if (req.path === '/maintenance') return next();
  if (req.path.startsWith('/css') || req.path.startsWith('/js')) return next();
  
  // Allow auth endpoints
  if (req.path.startsWith('/auth')) return next();
  
  // CHECK ADMIN ROLE - 3 methods:
  // 1. JWT token in Authorization header
  // 2. Session cookie
  // 3. Custom X-User-Role header
  
  // If admin → allow access
  // If not admin → redirect to /maintenance
});
```

### 2. **public/js/maintenance-bypass.js** (Frontend Helper)
**Location:** `C:\Users\kydel\Downloads\tample\public\js\maintenance-bypass.js`

**Purpose:** Automatically adds `X-User-Role` header to all fetch requests

```javascript
// Overrides window.fetch to inject admin role header
window.fetch = function(...args) {
  // Get user from sessionStorage
  const user = JSON.parse(sessionStorage.getItem('bintech_user'));
  
  // If admin, add X-User-Role header
  if (user.role === 'admin') {
    options.headers['X-User-Role'] = 'admin';
  }
  
  return originalFetch(...args);
};
```

### 3. **templates/MAINTENANCE.HTML**
**Location:** `C:\Users\kydel\Downloads\tample\templates\MAINTENANCE.HTML`

The maintenance page that regular users see.

---

## 🔐 Admin Detection Methods

The backend checks for admin users using **3 methods** (in order):

### Method 1: JWT Token (Authorization Header)
```javascript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Decodes JWT token
- Checks if `decoded.role === 'admin'`

### Method 2: Session Cookie
```javascript
req.session.user.role === 'admin'
```
- Checks Express session
- Requires express-session middleware

### Method 3: Custom Header (Frontend-stored)
```javascript
X-User-Role: admin
```
- Added automatically by `maintenance-bypass.js`
- Reads from `sessionStorage.bintech_user`

---

## 🚀 How to Enable/Disable

### Enable Maintenance Mode (Block Regular Users)
1. Open `app.js`
2. Change line 20 to:
   ```javascript
   const MAINTENANCE_MODE = true;
   ```
3. Restart server:
   ```bash
   Get-Process -Name node | Stop-Process -Force
   node app.js
   ```

### Disable Maintenance Mode (Allow Everyone)
1. Open `app.js`
2. Change line 20 to:
   ```javascript
   const MAINTENANCE_MODE = false;
   ```
3. Restart server

---

## ✅ Testing the Admin Bypass

### Test 1: Regular User (Should Be Blocked)
1. Enable maintenance mode (`MAINTENANCE_MODE = true`)
2. Open browser in incognito mode
3. Visit `http://localhost:3000`
4. **Expected:** Redirected to `/maintenance` page

### Test 2: Admin User (Should Have Access)
1. Enable maintenance mode (`MAINTENANCE_MODE = true`)
2. Login as admin user
3. Visit `http://localhost:3000/admin/dashboard`
4. **Expected:** Full access to admin dashboard
5. Check browser console for: `🔓 Admin bypass: Allowing admin access during maintenance`

### Test 3: Admin API Requests
1. Enable maintenance mode
2. Login as admin
3. Open browser DevTools → Network tab
4. Navigate to admin pages
5. **Expected:** All API requests include `X-User-Role: admin` header

---

## 🛡️ Security Considerations

### ✅ Secure Aspects
- Admin role is verified on the **backend** (not just frontend)
- Multiple verification methods (JWT, session, header)
- Static files (CSS, JS) are allowed for maintenance page to load properly
- Auth endpoints are allowed so admins can login during maintenance

### ⚠️ Important Notes
1. **JWT Secret:** Make sure `JWT_SECRET` in `.env` is strong and secret
2. **Session Security:** Use secure session cookies in production
3. **Header Validation:** The `X-User-Role` header is validated against session data
4. **No Bypass Loop:** The `/maintenance` route itself is always accessible to prevent redirect loops

---

## 🔧 Troubleshooting

### Problem: Admin is still redirected to maintenance page

**Solution 1:** Check if user role is stored correctly
```javascript
// Open browser console
console.log(sessionStorage.getItem('bintech_user'));
// Should show: {"role": "admin", ...}
```

**Solution 2:** Check if maintenance-bypass.js is loaded
```javascript
// Open browser console → Network tab
// Look for: maintenance-bypass.js (should be 200 OK)
```

**Solution 3:** Check backend logs
```bash
# Should see in terminal:
🔓 Admin bypass: Allowing admin access during maintenance
```

### Problem: Regular users can still access the site

**Solution:** Make sure `MAINTENANCE_MODE = true` in app.js line 20

### Problem: Maintenance page has no styling

**Solution:** Static files (CSS, JS) are allowed in middleware. Check if files exist:
- `/public/css/*`
- `/public/js/*`
- `/public/images/*`

---

## 📊 Expected Behavior Summary

| User Type | Maintenance Mode | Can Access Site? | Can Access Admin? |
|-----------|------------------|------------------|-------------------|
| Regular User | OFF | ✅ Yes | ❌ No |
| Regular User | ON | ❌ No (→ /maintenance) | ❌ No |
| Admin User | OFF | ✅ Yes | ✅ Yes |
| Admin User | ON | ✅ Yes | ✅ Yes |

---

## 🎯 Quick Reference

**Enable Maintenance:**
```javascript
// app.js line 20
const MAINTENANCE_MODE = true;
```

**Disable Maintenance:**
```javascript
// app.js line 20
const MAINTENANCE_MODE = false;
```

**Check Admin Status (Browser Console):**
```javascript
JSON.parse(sessionStorage.getItem('bintech_user')).role
```

**Backend Logs to Watch For:**
```
🔓 Admin bypass: Allowing admin access during maintenance
🚧 Maintenance mode: Redirecting non-admin user to maintenance page
```

---

## 🌟 Benefits

✅ **Admins can fix issues** while site is in maintenance  
✅ **Users see professional maintenance page** instead of errors  
✅ **No downtime for admin operations** (updates, fixes, testing)  
✅ **Secure** - Role verification happens on backend  
✅ **Simple toggle** - One line to enable/disable  

---

**Created:** May 10, 2026  
**Status:** ✅ Implemented and Working  
**Version:** 1.0
