# Admin Authentication - Project Structure Reference

## Complete File Inventory

### 📄 Setup & Documentation Files (NEW)

```
QUICK_START.md                     ← Start here!
SETUP_CHECKLIST.md                 ← Step-by-step instructions
ADMIN_AUTH_SETUP.md                ← Full documentation
SUPABASE_SETUP_COMPLETE.sql        ← Database SQL (copy-paste this)
```

---

### 🔧 Backend Files (Created/Modified)

#### Created - Middleware
```
middleware/adminAuth.js
├─ Export: checkAdminAuth(req, res, next)
├─ Purpose: Validates Bearer token + admin role on ALL admin routes
├─ Applied to: ALL routes in routes/admin.js
└─ Returns: 403 if not admin, calls next() if admin
```

#### Created - Config/Helpers 
```
config/auth.js
├─ Export: checkAuth(req)           ← Get session from request
├─ Export: isAdmin(userId)          ← Check if user is admin
├─ Export: getUserRole(userId)      ← Get user's role
├─ Export: requireAdminAccess(res)  ← Middleware wrapper
└─ Purpose: Reusable auth functions for controllers
```

#### Modified - Routes
```
routes/admin.js
├─ Added: Middleware import (checkAdminAuth)
├─ Added: router.use(checkAdminAuth) ← Protects ALL routes
├─ Added: GET /admin/users/all      ← List all users
├─ Added: PUT /admin/users/:id/role ← Change user role
└─ Purpose: Protected admin endpoints
```

#### Modified - Controller
```
controllers/adminController.js
├─ Added: getAllUsers()
│   └─ GET /admin/users/all
│   └─ Returns: { success, users: [...] }
│
├─ Added: updateUserRole()
│   └─ PUT /admin/users/:id/role
│   └─ Body: { user_id, role }
│   └─ Returns: { success, message, user }
│
└─ Purpose: Admin-only business logic
```

---

### 🎨 Frontend Files (Created/Modified)

#### Created - JavaScript
```
public/js/auth-frontend.js
├─ Export to: window.authHelpers
├─ Functions:
│  ├─ getAuthSession()              ← Get current session
│  ├─ isCurrentUserAdmin()          ← Check if user is admin
│  ├─ protectAdminPage()            ← Redirect/show Access Denied
│  ├─ hideAdminUIForNonAdmins()     ← Hide .admin-only elements
│  └─ logout()                      ← Sign out user
│
└─ Usage: <script src="/js/auth-frontend.js"></script>
```

#### Modified - Templates
```
templates/ADMIN_DASHBOARD.html
├─ Added: <script src="/js/auth-frontend.js"></script>
├─ Changed: Call to authHelpers.protectAdminPage()
└─ Purpose: Protect dashboard from non-admins
```

---

### 🗄️ Database Setup (NOT YET APPLIED)

```
SUPABASE_SETUP_COMPLETE.sql

Creates in Supabase:
├─ Table: public.users
│  ├─ id (UUID, PK)
│  ├─ auth_id (UUID, FK to auth.users)
│  ├─ email (TEXT, UNIQUE)
│  ├─ role (TEXT: 'admin' or 'user')
│  ├─ created_at (TIMESTAMP)
│  └─ updated_at (TIMESTAMP)
│
├─ RLS Policies (4 total):
│  ├─ Users read own profile
│  ├─ Admins read all users
│  ├─ Only admins update roles
│  └─ Users insert own profile
│
├─ Function: handle_new_user()
│  └─ Automatically create user record on signup
│
└─ Trigger: on_auth_user_created
   └─ Calls function on new auth.users insert
```

---

## Data Flow Diagrams

### Login Flow
```
User → Sign Up/Login → Supabase Auth
                          ↓
                    trigger: handle_new_user()
                          ↓
                    INSERT into users table
                          ↓
                    role = 'user' (default)
```

### Admin Access Flow
```
User navigates to /admin/dashboard
    ↓
Frontend loads auth-frontend.js
    ↓
Call: authHelpers.protectAdminPage()
    ↓
Check: Is session valid?
    NO → Redirect to /login?redirect=/admin/dashboard
    YES → Continue
    ↓
Check: Is role = 'admin'?
    NO → Show "Access Denied" page
    YES → Load admin panel ✅
```

### API Call Flow
```
Frontend calls: GET /api/admin/users/all + Bearer token
    ↓
Backend receives request
    ↓
Middleware: checkAdminAuth()
    ↓
Extract & verify Bearer token
    ↓
Query: SELECT role FROM users WHERE auth_id = token_user
    ↓
Check: role = 'admin'?
    NO → Return 403 Forbidden
    YES → Call controller function
    ↓
Return: { success: true, users: [...] } ✅
```

---

## API Endpoints Reference

### Public Endpoints
```
GET  /              ← Landing page
GET  /login         ← Login page (if created)
POST /login         ← Login handler (if created)
```

### Admin Endpoints (Protected)
```
GET  /admin/dashboard                ← Admin panel
GET  /api/admin/users/all            ← List all users
PUT  /api/admin/users/:id/role       ← Change user role
GET  /api/admin/schedule             ← Schedule management
POST /api/admin/qr                   ← QR code management
GET  /api/admin/rewards              ← Rewards management
```

All admin endpoints require:
- ✅ Valid JWT token in Authorization header
- ✅ User role = 'admin' in database
- ✅ Supabase session to be active

---

## Environment Requirements

### Required in .env
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Package Dependencies (Should Already Have)
```
supabase (^1.x.x or ^2.x.x)
express
```

---

## Security Checklist

- ✅ JWT tokens validated
- ✅ Admin role checked on every request
- ✅ RLS policies block unauthorized DB access
- ✅ Non-admins get 403 errors on API calls
- ✅ Frontend redirects to login if not authenticated
- ✅ Frontend shows "Access Denied" for non-admins
- ✅ Tokens expired → session invalid → redirect to login
- ✅ Users table auto-populates on signup with role='user'

---

## Testing Matrix

```
┌─────────────────┬──────────────┬─────────────────┬──────────────┐
│ Scenario        │ Login Status │ Role            │ Expected     │
├─────────────────┼──────────────┼─────────────────┼──────────────┤
│ Access /admin   │ NO           │ N/A             │ Redirect to  │
│                 │              │                 │ /login       │
│                 │              │                 │              │
│ Access /admin   │ YES          │ user            │ Show "Access │
│                 │              │                 │ Denied" page │
│                 │              │                 │              │
│ Access /admin   │ YES          │ admin           │ Load panel ✅ │
│                 │              │                 │              │
│ Call API        │ NO           │ N/a             │ 403 Error    │
│ without token   │              │                 │              │
│                 │              │                 │              │
│ Call API        │ YES          │ user            │ 403 Error    │
│ as user         │              │                 │              │
│                 │              │                 │              │
│ Call API        │ YES          │ admin           │ Success + ✅  │
│ as admin        │              │                 │ data         │
└─────────────────┴──────────────┴─────────────────┴──────────────┘
```

---

## Status Summary

| Component | Status | Location |
|-----------|--------|----------|
| Database schema | ⏳ Pending | SUPABASE_SETUP_COMPLETE.sql |
| Backend middleware | ✅ Ready | middleware/adminAuth.js |
| Backend helpers | ✅ Ready | config/auth.js |
| Backend endpoints | ✅ Ready | routes/ + controllers/ |
| Frontend protection | ✅ Ready | public/js/auth-frontend.js |
| Documentation | ✅ Complete | ADMIN_AUTH_SETUP.md |
| Quick start guide | ✅ Complete | QUICK_START.md |
| Setup checklist | ✅ Complete | SETUP_CHECKLIST.md |

---

**Generated:** March 31, 2026  
**System:** BinTECH Admin Auth v1.0  
**Ready to:** Execute SQL + Test
