# How to Enable Full Maintenance Mode

## Option 1: Redirect All Traffic (Recommended)

Add this code to `app.js` **BEFORE** all other routes (around line 100):

```javascript
// ============================================
// MAINTENANCE MODE (Uncomment to enable)
// ============================================
/*
app.use((req, res, next) => {
  // Allow access to maintenance page and static files
  if (req.path === '/maintenance' || 
      req.path.startsWith('/css') || 
      req.path.startsWith('/js') || 
      req.path.startsWith('/images')) {
    return next();
  }
  
  // Redirect everything else to maintenance page
  return res.redirect('/maintenance');
});
*/
```

**To Enable**: Remove the `/*` and `*/` comment markers  
**To Disable**: Add the `/*` and `*/` back

---

## Option 2: Environment Variable

Add this code to `app.js` **BEFORE** all other routes:

```javascript
// ============================================
// MAINTENANCE MODE (Environment Variable)
// ============================================
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

if (MAINTENANCE_MODE) {
  app.use((req, res, next) => {
    if (req.path === '/maintenance' || 
        req.path.startsWith('/css') || 
        req.path.startsWith('/js')) {
      return next();
    }
    return res.redirect('/maintenance');
  });
}
```

**To Enable**:
```bash
# Windows PowerShell
$env:MAINTENANCE_MODE="true"
node app.js

# Windows CMD
set MAINTENANCE_MODE=true
node app.js

# Linux/Mac
MAINTENANCE_MODE=true node app.js
```

**To Disable**: Just run `node app.js` normally

---

## Option 3: Replace Landing Page Temporarily

```bash
# Backup current landing page
cp templates/LANDING_PAGE.HTML templates/LANDING_PAGE.HTML.backup

# Use maintenance page as landing page
cp templates/MAINTENANCE.HTML templates/LANDING_PAGE.HTML

# When done, restore:
cp templates/LANDING_PAGE.HTML.backup templates/LANDING_PAGE.HTML
```

---

## Current Setup

✅ **Maintenance page is accessible at**: `http://localhost:3000/maintenance`  
✅ **All other pages work normally**  
✅ **No traffic is redirected** (maintenance mode is OFF)

To enable full maintenance mode, use one of the options above!
