# 🔧 Maintenance Mode Toggle - Simple Guide

## How It Works

There's a single variable at the top of `app.js` that controls maintenance mode:

```javascript
const MAINTENANCE_MODE = false; // ← Change this!
```

---

## ✅ To Enable Maintenance Mode

### Step 1: Open `app.js`
Find this line near the top (around line 15):
```javascript
const MAINTENANCE_MODE = false;
```

### Step 2: Change to `true`
```javascript
const MAINTENANCE_MODE = true; // ← Maintenance ON
```

### Step 3: Restart Server
```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
node app.js
```

### Result:
- ✅ **ALL** visitors are redirected to `/maintenance`
- ✅ Landing page → Maintenance page
- ✅ Dashboard → Maintenance page
- ✅ Admin pages → Maintenance page
- ✅ Everything → Maintenance page

---

## ❌ To Disable Maintenance Mode (Go Live)

### Step 1: Open `app.js`
Find this line:
```javascript
const MAINTENANCE_MODE = true;
```

### Step 2: Change to `false`
```javascript
const MAINTENANCE_MODE = false; // ← Maintenance OFF
```

### Step 3: Restart Server
```bash
node app.js
```

### Result:
- ✅ Website works normally
- ✅ All pages accessible
- ✅ Users can log in and use the system

---

## 📋 Quick Reference

| Mode | Setting | What Happens |
|------|---------|--------------|
| **Normal** | `MAINTENANCE_MODE = false` | Website works normally |
| **Maintenance** | `MAINTENANCE_MODE = true` | Everyone sees maintenance page |

---

## 🎯 Example Scenarios

### Scenario 1: Scheduled Maintenance
```javascript
// Before maintenance window
const MAINTENANCE_MODE = false; // Website is live

// During maintenance (e.g., 2 AM - 4 AM)
const MAINTENANCE_MODE = true; // Show maintenance page

// After maintenance
const MAINTENANCE_MODE = false; // Website is live again
```

### Scenario 2: Emergency Updates
```javascript
// Something broke, need to fix it
const MAINTENANCE_MODE = true; // Take site offline

// Fix the issue...

// All fixed!
const MAINTENANCE_MODE = false; // Bring site back online
```

### Scenario 3: Testing Maintenance Page
```javascript
// Want to see how it looks?
const MAINTENANCE_MODE = true; // Enable temporarily

// Check http://localhost:3000

// Done testing
const MAINTENANCE_MODE = false; // Disable
```

---

## 🔍 What Gets Redirected?

### When `MAINTENANCE_MODE = true`:

**Redirected to Maintenance:**
- ✅ `/` (landing page)
- ✅ `/dashboard`
- ✅ `/login`
- ✅ `/rewards`
- ✅ `/admin/*` (all admin pages)
- ✅ Any other page

**NOT Redirected (Still Works):**
- ✅ `/maintenance` (the maintenance page itself)
- ✅ `/css/*` (stylesheets)
- ✅ `/js/*` (JavaScript files)
- ✅ `/images/*` (images)
- ✅ `/fonts/*` (fonts)

This ensures the maintenance page displays correctly with all its styles and assets!

---

## 💡 Pro Tips

### Tip 1: Plan Ahead
```javascript
// Add a comment with your maintenance schedule
const MAINTENANCE_MODE = false; // Next maintenance: Sunday 2 AM - 4 AM
```

### Tip 2: Test First
Before actual maintenance:
1. Set `MAINTENANCE_MODE = true`
2. Visit `http://localhost:3000`
3. Verify maintenance page looks good
4. Set `MAINTENANCE_MODE = false`
5. Proceed with actual maintenance when ready

### Tip 3: Quick Toggle
Keep this at the top of `app.js` for easy access:
```javascript
// ============================================
// MAINTENANCE MODE TOGGLE
// ============================================
// true  = Maintenance mode ON (show maintenance page)
// false = Maintenance mode OFF (normal operation)
const MAINTENANCE_MODE = false; // ← CHANGE THIS
// ============================================
```

---

## 🚨 Important Notes

1. **Always restart the server** after changing `MAINTENANCE_MODE`
2. **Test the maintenance page** before actual maintenance
3. **Communicate with users** about scheduled maintenance
4. **Keep maintenance short** - users will be waiting!

---

## 📝 Current Status

Check the top of your `app.js` file:

```javascript
const MAINTENANCE_MODE = false; // ← Current setting
```

- `false` = Website is **LIVE** ✅
- `true` = Website is in **MAINTENANCE** 🔧

---

## 🎨 Customize Maintenance Message

Want to change the maintenance message? Edit `templates/MAINTENANCE.HTML`:

**Line ~270** - Main message:
```html
<p class="maintenance-message">
  We're currently performing scheduled maintenance...
</p>
```

**Line ~280** - Return time:
```html
<span>We'll be back shortly</span>
<!-- Change to: -->
<span>We'll be back at 4:00 AM</span>
<span>Expected return: 2 hours</span>
```

---

## ✅ Summary

**To Enable Maintenance:**
1. Open `app.js`
2. Change `const MAINTENANCE_MODE = false;` to `true`
3. Restart server: `node app.js`

**To Disable Maintenance:**
1. Open `app.js`
2. Change `const MAINTENANCE_MODE = true;` to `false`
3. Restart server: `node app.js`

**That's it!** Simple one-line toggle! 🎉
