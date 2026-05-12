# 🚀 Admin Bypass - Quick Start Guide

## What is Admin Bypass?

When maintenance mode is ON:
- ❌ **Regular users** → Redirected to maintenance page
- ✅ **Admin users** → Full access to website and admin dashboard

---

## 📝 Quick Setup (Already Done!)

The admin bypass system is **already implemented** and ready to use. Here's what was added:

### 1. Backend Middleware (app.js)
- Checks user role before redirecting
- Allows admin access during maintenance
- Located at lines 86-135

### 2. Frontend Helper (maintenance-bypass.js)
- Automatically adds admin role to requests
- Located at `public/js/maintenance-bypass.js`

### 3. Auto-injection
- Script is automatically loaded on all pages
- No manual setup needed

---

## 🎮 How to Use

### Enable Maintenance Mode
```javascript
// app.js - Line 20
const MAINTENANCE_MODE = true;
```

Then restart server:
```bash
Get-Process -Name node | Stop-Process -Force
node app.js
```

### Disable Maintenance Mode
```javascript
// app.js - Line 20
const MAINTENANCE_MODE = false;
```

Then restart server.

---

## ✅ Testing

### Test as Regular User
1. Open browser in **incognito mode**
2. Visit `http://localhost:3000`
3. **Expected:** See maintenance page

### Test as Admin
1. Login as admin user
2. Visit `http://localhost:3000/admin/dashboard`
3. **Expected:** Full access to dashboard
4. Check console for: `🔓 Admin bypass: Allowing admin access`

---

## 🔍 Verify It's Working

### Check User Role (Browser Console)
```javascript
JSON.parse(sessionStorage.getItem('bintech_user')).role
// Should return: "admin" or "head"
```

### Check Backend Logs (Terminal)
```
🔓 Admin bypass: Allowing admin access during maintenance
```

---

## 🎯 Use Cases

### Scenario 1: System Updates
```
1. Enable maintenance mode
2. Regular users see "Under Maintenance" page
3. Admins can still access dashboard
4. Perform updates/fixes
5. Disable maintenance mode when done
```

### Scenario 2: Database Migration
```
1. Enable maintenance mode
2. Users are blocked from making changes
3. Admins can monitor migration progress
4. Test functionality as admin
5. Disable maintenance mode after verification
```

### Scenario 3: Emergency Fixes
```
1. Bug discovered in production
2. Enable maintenance mode immediately
3. Users see maintenance page
4. Admins can debug and fix
5. Disable maintenance mode after fix
```

---

## 📊 What Happens When Maintenance is ON?

| Action | Regular User | Admin User |
|--------|--------------|------------|
| Visit homepage | → /maintenance | ✅ Access granted |
| Visit /dashboard | → /maintenance | ✅ Access granted |
| Visit /admin/dashboard | → /maintenance | ✅ Access granted |
| API requests | → /maintenance | ✅ Works normally |
| Login page | ✅ Can login | ✅ Can login |
| Static files (CSS/JS) | ✅ Loads | ✅ Loads |

---

## 🛠️ Files Modified

1. **app.js** - Added admin bypass logic to maintenance middleware
2. **public/js/maintenance-bypass.js** - NEW file for frontend helper
3. **MAINTENANCE_MODE_ADMIN_BYPASS.md** - Full documentation
4. **ADMIN_BYPASS_QUICK_START.md** - This quick guide

---

## 💡 Pro Tips

1. **Always test as admin first** before enabling maintenance for real users
2. **Check backend logs** to confirm admin bypass is working
3. **Use incognito mode** to test regular user experience
4. **Keep maintenance page updated** with estimated return time
5. **Notify users in advance** when possible

---

## 🚨 Troubleshooting

### Admin is redirected to maintenance page
**Fix:** Check if user role is "admin" or "head" in sessionStorage

### Regular users can still access
**Fix:** Make sure `MAINTENANCE_MODE = true` in app.js

### No styling on maintenance page
**Fix:** Static files should be allowed (already configured)

---

## 📞 Need Help?

Check the full documentation: **MAINTENANCE_MODE_ADMIN_BYPASS.md**

---

**Status:** ✅ Ready to Use  
**Last Updated:** May 10, 2026
