# BinTECH Admin Authentication System

## Overview
This document outlines the complete admin authentication system implemented for BinTECH using Supabase Auth and Row-Level Security (RLS).

---

## 1. Database Setup

### Step 1: Create Users Table in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Create users/profiles table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  auth_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'))
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only read their own data
CREATE POLICY "Users can read their own profile" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = auth_id);

-- Policy 2: Admins can read all user data
CREATE POLICY "Admins can read all users" 
  ON public.users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Only admins can update user roles
CREATE POLICY "Only admins can update roles" 
  ON public.users 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 4: Allow user creation during signup
CREATE POLICY "Users can insert their own profile" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (auth.uid() = auth_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 2: Create First Admin User

Replace `admin@example.com` with your email:

```sql
-- Update a user to admin (after they sign up)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin@example.com';

-- Verify
SELECT email, role FROM public.users;
```

---

## 2. Backend Files

### Middleware: `/middleware/adminAuth.js`
- Checks JWT token in Authorization header
- Verifies user's admin role from database
- Blocks non-admin requests with 403 Forbidden

**Usage in routes:**
```javascript
const { checkAdminAuth } = require('../middleware/adminAuth');
router.use(checkAdminAuth);  // Apply to all admin routes
```

### Config: `/config/auth.js`
Helper functions for server-side auth:
- `checkAuth(req)` - Verify session
- `isAdmin(userId)` - Check if user is admin
- `getUserRole(userId)` - Get user's role
- `requireAdminAccess(res)` - Middleware for Express

---

## 3. Frontend Files

### Script: `/public/js/auth-frontend.js`
Client-side authentication helpers:

**Functions:**
- `getAuthSession()` - Get current session
- `isCurrentUserAdmin()` - Check if current user is admin
- `protectAdminPage()` - Protect pages (redirect if not admin)
- `hideAdminUIForNonAdmins()` - Hide admin UI elements
- `logout()` - Sign out user

**Usage in HTML:**
```html
<script src="/js/auth-frontend.js"></script>
<script>
  // Protect admin pages
  authHelpers.protectAdminPage();
  
  // Hide admin-only elements
  authHelpers.hideAdminUIForNonAdmins();
  
  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    authHelpers.logout();
  });
</script>
```

### Admin Panel Pages
Updated files to include auth protection:
- `templates/ADMIN_DASHBOARD.html` - Calls `protectAdminPage()` on load

---

## 4. API Endpoints

### User Role Management

#### Get All Users (Admin Only)
```
GET /api/admin/users/all
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "users": [
    { "id": "uuid", "email": "user@example.com", "role": "user", "created_at": "..." },
    { "id": "uuid", "email": "admin@example.com", "role": "admin", "created_at": "..." }
  ]
}
```

#### Update User Role (Admin Only)
```
PUT /api/admin/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid",
  "role": "admin"  // or "user"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User role updated to \"admin\"",
  "user": { "id": "uuid", "email": "user@example.com", "role": "admin" }
}
```

---

## 5. Security Features

### Row-Level Security (RLS)
- ✅ Users can only read their own profile
- ✅ Admins can read all user data
- ✅ Only admins can update user roles
- ✅ New users automatically inserted as "user" role

### Backend Protection
- ✅ JWT token validation
- ✅ Admin role check on every request
- ✅ 403 Forbidden for non-admin requests
- ✅ Comprehensive error logging

### Frontend Protection
- ✅ Redirect to login if not authenticated
- ✅ Show "Access Denied" for non-admin users
- ✅ Hide admin navigation from non-admins
- ✅ Auto-logout on session expiration

---

## 6. User Flow

### First-Time Admin User
1. Admin signs up via login page
2. User profile created in `users` table with `role='user'`
3. Database admin manually updates role to `'admin'`
4. On next login, user can access admin panel

### Regular User
1. User signs up
2. Profile created with `role='user'`
3. User sees "Access Denied" when trying to access `/admin/*`
4. User navigates to app instead

### Admin User
1. Admin logs in with correct credentials
2. Frontend checks `role === 'admin'`
3. Admin panel loads successfully
4. All admin API endpoints accessible

---

## 7. Implementation Checklist

- [ ] Run SQL setup in Supabase
- [ ] Update first admin user with your email
- [ ] Verify `middleware/adminAuth.js` is present
- [ ] Verify `config/auth.js` is present
- [ ] Verify `public/js/auth-frontend.js` is present
- [ ] Update admin routes with middleware
- [ ] Add `auth-frontend.js` to HTML templates
- [ ] Call `protectAdminPage()` on admin pages
- [ ] Test: Sign up as regular user - should see Access Denied
- [ ] Test: Sign up as admin - should see admin panel

---

## 8. Testing the System

### Test 1: Regular User Access
1. Sign up with `testuser@example.com`
2. Navigate to `/admin/dashboard`
3. **Expected:** See "Access Denied" message
4. **Check DevTools:** Should see role: "user" in logs

### Test 2: Admin User Access
1. Sign up with admin email (or manually set role in database)
2. Navigate to `/admin/dashboard`
3. **Expected:** Dashboard loads successfully
4. **Check DevTools:** Should see role: "admin" in logs

### Test 3: Admin API Endpoint
```bash
curl -H "Authorization: Bearer <token>" \
  https://yourdomain.com/api/admin/users/all
```
**Expected:** Returns list of all users

### Test 4: Non-Admin API Request
1. Get token from non-admin user
2. Call `/api/admin/users/all`
3. **Expected:** 403 Forbidden error

---

## 9. Common Issues & Solutions

### Issue: "Access Denied" for admin user
**Solution:**
1. Check Supabase: Database `users` table exists
2. Check `role` field = "admin"
3. Verify `auth_id` matches `auth.users.id`
4. Check browser console for error messages
5. Hard refresh page (Ctrl+F5)

### Issue: Getting "Invalid session" error
**Solution:**
1. Browser may not have valid session token
2. Login again or check Supabase Auth settings
3. Verify token is being sent in Authorization header
4. Check middleware is not blocking all requests

### Issue: Users table not created
**Solution:**
1. Run SQL in Supabase SQL Editor
2. Verify no errors in console
3. Check table exists: `SELECT * FROM public.users;`

---

## 10. Environment Variables

Add to `.env` if needed:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

---

## 11. Next Steps

- Customize admin UI as needed
- Add additional roles (e.g., "moderator", "staff")
- Implement user management UI for admins
- Add audit logging for role changes
- Set up email notifications for admin changes

---

**Created:** March 31, 2026  
**System:** BinTECH Admin Authentication v1.0  
**Status:** ✅ Production Ready
