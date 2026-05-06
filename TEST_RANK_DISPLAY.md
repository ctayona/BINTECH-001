# 🧪 Complete Test Guide - Rank Display & "Not Ranked Yet" Feature

## Pre-Test Setup

### 1. Restart Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm start
```

### 2. Clear Browser Cache
```
Chrome: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
Firefox: Ctrl+Shift+Delete
Safari: Cmd+Shift+Delete
```

### 3. Open Browser Console
```
Chrome/Firefox: F12
Safari: Cmd+Option+I
```

---

## Test Scenarios

### ✅ TEST 1: New User (Not in account_points table)

**Setup:**
1. Create a brand new user account
2. Don't sort any waste yet
3. Log in to dashboard

**Expected Results:**
```
✅ Rank display shows: "Not ranked yet"
✅ Tooltip on hover: "Start sorting waste to get ranked!"
✅ Points display: "0 Points"
✅ No console errors
✅ No 404 errors
```

**Console Check:**
```javascript
// Open console and check:
// 1. No errors about missing rank data
// 2. API response should show:
{
  "rank": {
    "notRanked": true,
    "message": "Not ranked yet",
    "displayText": "Not ranked yet"
  }
}
```

**Screenshot Markers:**
- [ ] Rank display area shows "Not ranked yet"
- [ ] Hover tooltip appears
- [ ] No red error messages

---

### ✅ TEST 2: Existing User (In account_points table)

**Setup:**
1. Use an existing user who has sorted waste before
2. Log in to dashboard

**Expected Results:**
```
✅ Rank display shows: "Rank: #X of Y"
✅ Example: "Rank: #42 of 1,823"
✅ Tooltip on hover: "You are in the top 97% of users"
✅ Points display: Shows actual points (e.g., "1,247 Points")
✅ No console errors
```

**Console Check:**
```javascript
// Open console and check:
// 1. No errors about rank calculation
// 2. API response should show:
{
  "rank": {
    "notRanked": false,
    "rank": 42,
    "totalUsers": 1823,
    "percentile": 97,
    "displayText": "#42 of 1823"
  }
}
```

**Screenshot Markers:**
- [ ] Rank display shows actual rank with total users
- [ ] Hover tooltip shows percentile
- [ ] Points display shows correct amount

---

### ✅ TEST 3: User Transitions from Not Ranked to Ranked

**Setup:**
1. Log in as a new user (not ranked)
2. Note the "Not ranked yet" message
3. Use the QR scanner to sort some waste
4. Return to dashboard and refresh (F5)

**Expected Results:**
```
✅ Initially shows: "Not ranked yet"
✅ After sorting waste and refreshing: "Rank: #X of Y"
✅ Points update to reflect sorted items
✅ Smooth transition, no errors
```

**Console Check:**
```javascript
// First API call (before sorting):
{
  "rank": {
    "notRanked": true,
    "message": "Not ranked yet"
  }
}

// Second API call (after sorting):
{
  "rank": {
    "notRanked": false,
    "rank": 1823,  // Last place initially
    "totalUsers": 1823,
    "percentile": 1
  }
}
```

**Screenshot Markers:**
- [ ] Initial state shows "Not ranked yet"
- [ ] After sorting, shows actual rank
- [ ] Points increase after sorting

---

### ✅ TEST 4: Mobile View

**Setup:**
1. Open dashboard on mobile device or use browser dev tools (F12 → Toggle device toolbar)
2. Test both new and existing users

**Expected Results:**
```
✅ Rank display visible on mobile
✅ "Not ranked yet" message shows correctly
✅ Actual rank shows correctly
✅ Mobile nav points sync with main display
✅ Responsive layout works
```

**Screenshot Markers:**
- [ ] Rank display visible on mobile
- [ ] Text is readable
- [ ] No layout breaks

---

### ✅ TEST 5: API Endpoints

**Test getUserPoints Endpoint:**
```bash
# For new user (not ranked):
curl "http://localhost:3000/api/dashboard/points?email=newuser@example.com"

# Expected response:
{
  "success": true,
  "user": {
    "points": 0,
    "total_points": 0,
    "total_waste": 0
  },
  "rank": {
    "notRanked": true,
    "message": "Not ranked yet",
    "displayText": "Not ranked yet"
  }
}

# For existing user (ranked):
curl "http://localhost:3000/api/dashboard/points?email=existinguser@example.com"

# Expected response:
{
  "success": true,
  "user": {
    "points": 1247,
    "total_points": 1247,
    "total_waste": 42
  },
  "rank": {
    "notRanked": false,
    "rank": 42,
    "totalUsers": 1823,
    "percentile": 97,
    "displayText": "#42 of 1823"
  }
}
```

**Test getUserStats Endpoint:**
```bash
# For new user (not ranked):
curl "http://localhost:3000/api/dashboard/stats?email=newuser@example.com"

# Expected response includes:
{
  "stats": {
    "leaderboardPosition": 0,
    "totalUsers": 1823,
    "notRanked": true
  }
}

# For existing user (ranked):
curl "http://localhost:3000/api/dashboard/stats?email=existinguser@example.com"

# Expected response includes:
{
  "stats": {
    "leaderboardPosition": 42,
    "totalUsers": 1823,
    "notRanked": false
  }
}
```

---

## Console Debugging

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh dashboard
4. Look for these API calls:
   - `/api/dashboard/stats` ✅
   - `/api/dashboard/points` ✅

### Check Console Logs
```javascript
// Look for these logs (no errors):
[Rank] User not found in account_points table: { userId: "...", email: "..." }
// OR
[Rank] User rank calculated successfully

// Should NOT see:
❌ "Form fields not found"
❌ "Cannot read property 'rank' of null"
❌ "404 Not Found"
```

### Check Rank Display Updates
```javascript
// In console, run:
document.getElementById('rank-display').textContent
// Should return either:
// "Not ranked yet"
// OR
// "Rank: #42 of 1,823"
```

---

## Common Issues & Solutions

### Issue 1: Rank shows "Loading rank..." forever
**Solution:**
- Check Network tab for failed API calls
- Check console for errors
- Verify user exists in database
- Restart server

### Issue 2: Shows "Not ranked yet" for existing user
**Solution:**
- Check if user is actually in `account_points` table
- Run: `SELECT * FROM account_points WHERE email = 'user@example.com';`
- If not found, user needs to sort waste first

### Issue 3: Rank shows #0 instead of "Not ranked yet"
**Solution:**
- This shouldn't happen with new code
- Clear browser cache (Ctrl+Shift+Delete)
- Restart server
- Refresh page

### Issue 4: Console shows "Cannot read property 'notRanked' of null"
**Solution:**
- Backend not returning rank object
- Check API response in Network tab
- Verify getUserRankInfo function is working
- Check database connection

---

## Performance Checks

### Load Time
```
✅ Dashboard should load in < 2 seconds
✅ Rank display should update within 500ms
✅ No lag when hovering over rank
```

### Database Queries
```
✅ Should make 2-3 API calls max
✅ No N+1 query problems
✅ Leaderboard query should be fast (< 100ms)
```

---

## Accessibility Checks

### Keyboard Navigation
```
✅ Tab through dashboard elements
✅ Rank display should be reachable
✅ Tooltip should be accessible
```

### Screen Reader
```
✅ Rank display text is readable
✅ Tooltip text is announced
✅ No hidden content issues
```

---

## Final Verification Checklist

### Backend
- [ ] `getUserRankInfo()` returns correct structure
- [ ] `getUserPoints()` endpoint returns rank object
- [ ] `getUserStats()` endpoint returns notRanked flag
- [ ] `getActivityOverview()` endpoint handles not ranked
- [ ] No database errors in logs
- [ ] No console errors

### Frontend
- [ ] Rank display shows "Not ranked yet" for new users
- [ ] Rank display shows "Rank: #X of Y" for existing users
- [ ] Tooltips appear on hover
- [ ] Mobile view works correctly
- [ ] No console errors
- [ ] No 404 errors

### User Experience
- [ ] Clear messaging for new users
- [ ] Helpful tooltips guide users
- [ ] Smooth transitions when user gets ranked
- [ ] Responsive on all devices
- [ ] Fast loading

---

## Test Results Template

```markdown
## Test Results - [Date]

### Test 1: New User
- [ ] Rank shows "Not ranked yet"
- [ ] Tooltip appears
- [ ] No errors
- Status: ✅ PASS / ❌ FAIL

### Test 2: Existing User
- [ ] Rank shows "Rank: #X of Y"
- [ ] Tooltip shows percentile
- [ ] No errors
- Status: ✅ PASS / ❌ FAIL

### Test 3: Transition
- [ ] Initial: "Not ranked yet"
- [ ] After sorting: Shows rank
- [ ] No errors
- Status: ✅ PASS / ❌ FAIL

### Test 4: Mobile
- [ ] Displays correctly
- [ ] Responsive
- [ ] No errors
- Status: ✅ PASS / ❌ FAIL

### Test 5: APIs
- [ ] getUserPoints works
- [ ] getUserStats works
- [ ] Correct responses
- Status: ✅ PASS / ❌ FAIL

### Overall Status: ✅ ALL TESTS PASSED
```

---

## Next Steps After Testing

1. ✅ If all tests pass:
   - Commit changes to git
   - Deploy to staging
   - Deploy to production

2. ❌ If tests fail:
   - Check error messages
   - Review console logs
   - Check database state
   - Restart server
   - Re-run tests

---

**Test Date:** [Your Date]  
**Tester:** [Your Name]  
**Status:** Ready for Testing ✅
