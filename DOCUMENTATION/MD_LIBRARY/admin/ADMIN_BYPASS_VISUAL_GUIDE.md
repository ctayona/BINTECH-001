# 🎨 Admin Bypass - Visual Guide

## 🔄 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    USER VISITS BINTECH WEBSITE                      │
│                    http://localhost:3000                            │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                   MAINTENANCE MIDDLEWARE                            │
│                   (app.js lines 86-135)                             │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Check Toggle   │
                    │ MAINTENANCE_   │
                    │ MODE = ?       │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌──────────────┐
        │     FALSE     │         │     TRUE     │
        │               │         │              │
        │  Maintenance  │         │  Maintenance │
        │  Mode OFF     │         │  Mode ON     │
        └───────┬───────┘         └──────┬───────┘
                │                        │
                ▼                        ▼
        ┌───────────────┐         ┌──────────────────────┐
        │               │         │  Check User Role     │
        │  ALLOW ALL    │         │                      │
        │  USERS        │         │  3 Detection Methods:│
        │               │         │  1. JWT Token        │
        │  ✅ Access    │         │  2. Session Cookie   │
        │  Granted      │         │  3. X-User-Role      │
        │               │         │     Header           │
        └───────────────┘         └──────┬───────────────┘
                                         │
                            ┌────────────┴────────────┐
                            │                         │
                            ▼                         ▼
                    ┌───────────────┐         ┌──────────────┐
                    │  ADMIN USER   │         │ REGULAR USER │
                    │               │         │              │
                    │  role=admin   │         │ role=student │
                    │  role=head    │         │ role=faculty │
                    │               │         │ role=staff   │
                    └───────┬───────┘         └──────┬───────┘
                            │                        │
                            ▼                        ▼
                    ┌───────────────┐         ┌──────────────┐
                    │               │         │              │
                    │  ✅ ALLOW     │         │  ❌ BLOCK    │
                    │  ACCESS       │         │              │
                    │               │         │  Redirect to │
                    │  Full access  │         │  /maintenance│
                    │  to all pages │         │              │
                    │               │         │              │
                    └───────────────┘         └──────────────┘
```

---

## 🔐 Admin Detection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    INCOMING HTTP REQUEST                            │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                   METHOD 1: JWT TOKEN CHECK                         │
│                                                                     │
│   Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────┐     │
│   │  1. Extract token from Authorization header             │     │
│   │  2. Verify token with JWT_SECRET                        │     │
│   │  3. Decode payload                                      │     │
│   │  4. Check if decoded.role === 'admin'                   │     │
│   └─────────────────────────────────────────────────────────┘     │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Is Admin?     │
                    └────────┬───────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                   YES               NO
                    │                 │
                    ▼                 ▼
            ┌───────────┐     ┌──────────────────────────────────────┐
            │  ALLOW    │     │                                      │
            │  ACCESS   │     │     METHOD 2: SESSION COOKIE CHECK   │
            │  ✅       │     │                                      │
            └───────────┘     │  req.session.user.role === 'admin'  │
                              │                                      │
                              │  ┌────────────────────────────────┐ │
                              │  │ 1. Check Express session       │ │
                              │  │ 2. Read user object            │ │
                              │  │ 3. Check role field            │ │
                              │  └────────────────────────────────┘ │
                              │                                      │
                              └──────────────┬───────────────────────┘
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │  Is Admin?     │
                                    └────────┬───────┘
                                             │
                                    ┌────────┴────────┐
                                    │                 │
                                   YES               NO
                                    │                 │
                                    ▼                 ▼
                            ┌───────────┐     ┌──────────────────────┐
                            │  ALLOW    │     │                      │
                            │  ACCESS   │     │  METHOD 3: HEADER    │
                            │  ✅       │     │  CHECK               │
                            └───────────┘     │                      │
                                              │  X-User-Role: admin  │
                                              │                      │
                                              │  ┌────────────────┐  │
                                              │  │ 1. Read header │  │
                                              │  │ 2. Check value │  │
                                              │  └────────────────┘  │
                                              │                      │
                                              └──────────┬───────────┘
                                                         │
                                                         ▼
                                                ┌────────────────┐
                                                │  Is Admin?     │
                                                └────────┬───────┘
                                                         │
                                                ┌────────┴────────┐
                                                │                 │
                                               YES               NO
                                                │                 │
                                                ▼                 ▼
                                        ┌───────────┐     ┌──────────────┐
                                        │  ALLOW    │     │  REDIRECT    │
                                        │  ACCESS   │     │  /maintenance│
                                        │  ✅       │     │  ❌          │
                                        └───────────┘     └──────────────┘
```

---

## 🌐 Frontend Helper Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    PAGE LOADS IN BROWSER                            │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│              maintenance-bypass.js LOADS                            │
│              (Injected automatically by app.js)                     │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│              OVERRIDE window.fetch()                                │
│                                                                     │
│   const originalFetch = window.fetch;                               │
│   window.fetch = function(...args) {                                │
│     // Add admin header if user is admin                            │
│   }                                                                 │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│              USER MAKES API REQUEST                                 │
│              fetch('/api/admin/stats')                              │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│              FETCH INTERCEPTOR RUNS                                 │
│                                                                     │
│   1. Read sessionStorage.getItem('bintech_user')                    │
│   2. Parse JSON to get user object                                  │
│   3. Check if user.role === 'admin' or 'head'                       │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Is Admin?     │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
               YES                       NO
                │                         │
                ▼                         ▼
    ┌───────────────────────┐     ┌──────────────────┐
    │  ADD HEADER           │     │  NO HEADER       │
    │                       │     │                  │
    │  X-User-Role: admin   │     │  Send request    │
    │                       │     │  as-is           │
    └───────────┬───────────┘     └────────┬─────────┘
                │                          │
                └──────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  SEND REQUEST TO BACKEND     │
            │                              │
            │  GET /api/admin/stats        │
            │  Headers:                    │
            │    X-User-Role: admin        │
            │                              │
            └──────────────────────────────┘
```

---

## 📊 User Experience Comparison

### Regular User (Maintenance Mode ON)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. User visits http://localhost:3000                       │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  2. Middleware checks: MAINTENANCE_MODE = true              │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  3. Middleware checks: User role = 'student'                │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  4. ❌ NOT ADMIN → Redirect to /maintenance                 │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  5. User sees:                                              │
│                                                             │
│     ╔═══════════════════════════════════════════════╗       │
│     ║                                               ║       │
│     ║           🔧 System Under Maintenance         ║       │
│     ║                                               ║       │
│     ║     We're performing updates to improve      ║       │
│     ║     your experience. We'll be back shortly!  ║       │
│     ║                                               ║       │
│     ║              [Spinning Gear Icon]             ║       │
│     ║                                               ║       │
│     ║        Thank you for your patience 🌱        ║       │
│     ║                                               ║       │
│     ╚═══════════════════════════════════════════════╝       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Admin User (Maintenance Mode ON)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. Admin visits http://localhost:3000/admin/dashboard      │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  2. Middleware checks: MAINTENANCE_MODE = true              │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  3. Middleware checks: User role = 'admin'                  │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  4. ✅ IS ADMIN → Allow access                              │
│                                                             │
│  Console: "🔓 Admin bypass: Allowing admin access"          │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  5. Admin sees:                                             │
│                                                             │
│     ╔═══════════════════════════════════════════════╗       │
│     ║  BinTECH Admin Dashboard                      ║       │
│     ╠═══════════════════════════════════════════════╣       │
│     ║                                               ║       │
│     ║  📊 Statistics                                ║       │
│     ║  👥 User Management                           ║       │
│     ║  🗑️  Bin Management                           ║       │
│     ║  🎁 Rewards Management                        ║       │
│     ║  ⚙️  Settings                                 ║       │
│     ║                                               ║       │
│     ║  [Full admin functionality available]         ║       │
│     ║                                               ║       │
│     ╚═══════════════════════════════════════════════╝       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Toggle Maintenance Mode

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ENABLE MAINTENANCE MODE                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

    1. Open app.js
       ↓
    2. Find line 20
       ↓
    3. Change to: const MAINTENANCE_MODE = true;
       ↓
    4. Save file
       ↓
    5. Restart server:
       Get-Process -Name node | Stop-Process -Force
       node app.js
       ↓
    6. ✅ Maintenance mode is now ACTIVE
       - Regular users → Blocked
       - Admin users → Full access

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              DISABLE MAINTENANCE MODE                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

    1. Open app.js
       ↓
    2. Find line 20
       ↓
    3. Change to: const MAINTENANCE_MODE = false;
       ↓
    4. Save file
       ↓
    5. Restart server:
       Get-Process -Name node | Stop-Process -Force
       node app.js
       ↓
    6. ✅ Maintenance mode is now DISABLED
       - Everyone → Full access
```

---

## 🎯 Real-World Scenario

### Scenario: Database Migration During Business Hours

```
┌─────────────────────────────────────────────────────────────┐
│  TIME: 2:00 PM - Need to migrate database                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Enable Maintenance Mode                            │
│  - Set MAINTENANCE_MODE = true                              │
│  - Restart server                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  RESULT: Users see maintenance page                         │
│                                                             │
│  Regular Users:                                             │
│  ❌ Cannot access website                                   │
│  ❌ Cannot make transactions                                │
│  ❌ Cannot modify data                                      │
│  ✅ See professional maintenance message                    │
│                                                             │
│  Admin Users:                                               │
│  ✅ Full access to admin dashboard                          │
│  ✅ Can monitor migration progress                          │
│  ✅ Can test functionality                                  │
│  ✅ Can fix issues if they arise                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Perform Database Migration                         │
│  - Admin runs migration scripts                             │
│  - Admin monitors logs                                      │
│  - Admin tests new schema                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Verify Everything Works                            │
│  - Admin tests all features                                 │
│  - Admin checks data integrity                              │
│  - Admin confirms no errors                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Disable Maintenance Mode                           │
│  - Set MAINTENANCE_MODE = false                             │
│  - Restart server                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  RESULT: Website back online                                │
│  ✅ All users can access website                            │
│  ✅ Migration completed successfully                        │
│  ✅ Zero data loss                                          │
│  ✅ Minimal downtime                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile vs Desktop View

### Desktop View (Admin Dashboard During Maintenance)

```
┌─────────────────────────────────────────────────────────────────────┐
│  BinTECH Admin Dashboard                                    [Logout] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Total      │  │   Active     │  │   Pending    │             │
│  │   Users      │  │   Bins       │  │   Rewards    │             │
│  │              │  │              │  │              │             │
│  │    1,234     │  │      45      │  │      12      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ⚠️ MAINTENANCE MODE ACTIVE - Only admins can access               │
│                                                                     │
│  [Full admin functionality available]                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile View (Regular User During Maintenance)

```
┌───────────────────────────┐
│                           │
│      🔧                   │
│                           │
│  System Under             │
│  Maintenance              │
│                           │
│  We're performing         │
│  updates to improve       │
│  your experience.         │
│                           │
│  We'll be back            │
│  shortly!                 │
│                           │
│  [Spinning Gear]          │
│                           │
│  Thank you for your       │
│  patience 🌱              │
│                           │
└───────────────────────────┘
```

---

## 🎨 Color-Coded Status

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🟢 GREEN = Allowed / Success                               │
│  🔴 RED = Blocked / Denied                                  │
│  🟡 YELLOW = Warning / Caution                              │
│  🔵 BLUE = Information                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Maintenance Mode OFF:
  🟢 Regular Users → Full Access
  🟢 Admin Users → Full Access

Maintenance Mode ON:
  🔴 Regular Users → Blocked (→ /maintenance)
  🟢 Admin Users → Full Access
  🟡 Warning: Site in maintenance mode
```

---

**Created:** May 10, 2026  
**Purpose:** Visual guide for understanding admin bypass system  
**Status:** ✅ Complete
