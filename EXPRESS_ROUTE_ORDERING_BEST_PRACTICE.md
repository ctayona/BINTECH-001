# Express Route Ordering - Best Practice Guide

## The Problem We Fixed

When defining routes in Express, the order matters. Routes are matched in the order they are defined, and the first matching route is used.

### Example of the Bug

```javascript
// WRONG ORDER - Bug!
router.get('/accounts/:email', adminController.getAccountDetails);
router.get('/accounts/archive-history', adminController.getArchiveHistory);
```

When a request comes in for `/accounts/archive-history`:
1. Express checks: Does `/accounts/archive-history` match `/accounts/:email`?
2. Answer: YES! (with `email='archive-history'`)
3. Result: Request is routed to `getAccountDetails` instead of `getArchiveHistory`
4. Error: `getAccountDetails` expects `type` parameter, which is missing

### The Fix

```javascript
// CORRECT ORDER - Works!
router.get('/accounts/archive-history', adminController.getArchiveHistory);
router.get('/accounts/:email', adminController.getAccountDetails);
```

Now when a request comes in for `/accounts/archive-history`:
1. Express checks: Does `/accounts/archive-history` match `/accounts/archive-history`?
2. Answer: YES! (exact match)
3. Result: Request is routed to `getArchiveHistory`
4. Success: Archive history is returned

---

## Best Practice: Route Ordering Rules

### Rule 1: Specific Routes Before Generic Routes
```javascript
// ✅ CORRECT
router.get('/accounts/archive-history', handler1);  // Specific
router.get('/accounts/:email', handler2);           // Generic

// ❌ WRONG
router.get('/accounts/:email', handler2);           // Generic
router.get('/accounts/archive-history', handler1);  // Specific (never reached!)
```

### Rule 2: More Specific Patterns Before Less Specific Patterns
```javascript
// ✅ CORRECT
router.get('/accounts/archive-history/:id', handler1);  // More specific
router.get('/accounts/:email', handler2);               // Less specific

// ❌ WRONG
router.get('/accounts/:email', handler2);               // Less specific
router.get('/accounts/archive-history/:id', handler1);  // More specific (never reached!)
```

### Rule 3: Static Paths Before Dynamic Paths
```javascript
// ✅ CORRECT
router.get('/accounts/settings', handler1);  // Static
router.get('/accounts/:email', handler2);    // Dynamic

// ❌ WRONG
router.get('/accounts/:email', handler2);    // Dynamic
router.get('/accounts/settings', handler1);  // Static (never reached!)
```

---

## Real-World Example: Admin Routes

### Before (Bug)
```javascript
router.get('/accounts/:email', adminController.getAccountDetails);
router.put('/accounts/:email', adminController.updateAccountDetails);
router.delete('/accounts/:email', adminController.deleteUserAccount);
router.post('/accounts/:email/convert', adminController.convertAccountType);
router.post('/accounts', adminController.createAccount);

// Archive routes - NEVER REACHED!
router.post('/accounts/:id/archive', adminController.archiveAdminAccount);
router.get('/accounts/archive-history', adminController.getArchiveHistory);
router.get('/accounts/archive-history/:archive_id', adminController.getArchiveSnapshot);
router.post('/accounts/archive-history/:archive_id/restore', adminController.restoreArchivedAccount);
```

### After (Fixed)
```javascript
// Archive routes - SPECIFIC, MATCHED FIRST
router.post('/accounts/:id/archive', adminController.archiveAdminAccount);
router.get('/accounts/archive-history', adminController.getArchiveHistory);
router.get('/accounts/archive-history/:archive_id', adminController.getArchiveSnapshot);
router.post('/accounts/archive-history/:archive_id/restore', adminController.restoreArchivedAccount);

// Generic account routes - GENERIC, MATCHED LAST
router.get('/accounts/:email', adminController.getAccountDetails);
router.put('/accounts/:email', adminController.updateAccountDetails);
router.delete('/accounts/:email', adminController.deleteUserAccount);
router.post('/accounts/:email/convert', adminController.convertAccountType);
router.post('/accounts', adminController.createAccount);
```

---

## How Express Matches Routes

Express uses a pattern matching algorithm:

1. **Exact Match** - `/accounts/archive-history` matches `/accounts/archive-history`
2. **Pattern Match** - `/accounts/archive-history` matches `/accounts/:email` (with `email='archive-history'`)
3. **First Match Wins** - The first matching route is used

### Matching Priority (Highest to Lowest)
1. Exact static paths: `/accounts/settings`
2. Exact static paths with multiple segments: `/accounts/archive-history`
3. Dynamic paths with one parameter: `/accounts/:email`
4. Dynamic paths with multiple parameters: `/accounts/:email/convert`
5. Wildcard paths: `/accounts/*`

---

## Testing Route Order

### Test Case 1: Archive History
```
Request: GET /api/admin/accounts/archive-history?limit=50&offset=0

BEFORE (Bug):
  Matched to: /accounts/:email (email='archive-history')
  Handler: getAccountDetails
  Error: "email and type=user|admin are required"

AFTER (Fixed):
  Matched to: /accounts/archive-history
  Handler: getArchiveHistory
  Success: Returns archive history
```

### Test Case 2: Get Account Details
```
Request: GET /api/admin/accounts/john@example.com?type=user

BEFORE (Works):
  Matched to: /accounts/:email (email='john@example.com')
  Handler: getAccountDetails
  Success: Returns account details

AFTER (Still Works):
  Matched to: /accounts/:email (email='john@example.com')
  Handler: getAccountDetails
  Success: Returns account details
```

---

## Common Mistakes

### Mistake 1: Putting Generic Routes First
```javascript
// ❌ WRONG
router.get('/accounts/:email', handler1);
router.get('/accounts/archive-history', handler2);  // Never reached!
```

### Mistake 2: Forgetting About Route Conflicts
```javascript
// ❌ WRONG
router.get('/users/:id', handler1);
router.get('/users/me', handler2);  // Never reached! (me is treated as :id)
```

### Mistake 3: Not Considering All Possible Paths
```javascript
// ❌ WRONG
router.get('/api/:version/users/:id', handler1);
router.get('/api/v1/users/me', handler2);  // Never reached! (me is treated as :id)
```

---

## Best Practices Summary

1. **Define specific routes before generic routes**
2. **Group related routes together**
3. **Add comments explaining route ordering**
4. **Test all routes to ensure they work correctly**
5. **Use meaningful parameter names** (`:email`, `:id`, `:archive_id`)
6. **Avoid ambiguous route patterns**

---

## Tools for Debugging Route Issues

### 1. Add Logging
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### 2. Use Express Router Debugging
```javascript
const router = express.Router({ strict: true });
```

### 3. Test Routes Manually
```bash
curl http://localhost:3000/api/admin/accounts/archive-history
curl http://localhost:3000/api/admin/accounts/john@example.com?type=user
```

---

## Conclusion

Route ordering is critical in Express. Always remember:

**Specific routes before generic routes**

This simple rule prevents many bugs and ensures your API works as expected.

