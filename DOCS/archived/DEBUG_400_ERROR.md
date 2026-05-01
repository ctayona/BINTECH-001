# Debugging 400 Error - Missing Required Fields

## Current Issue

You're seeing:
```
Response status: 400
Response data: {success: false, message: 'Missing required fields'}
```

But the frontend is sending all the required fields:
```
{
  rewardId: 'c067fb49-f282-4887-ad7d-3d893e10ea8c',
  email: 'jbillones.k12149156@umak.edu.ph',
  userId: 'k12149156',
  couponCodes: Array(2),
  rewardName: 'Snacks',
  quantity: 2,
  pointsPerUnit: 15,
  pointsSpent: 30
}
```

## Root Cause

The backend validation is returning a generic error message instead of the detailed one. This could be because:

1. **Server hasn't been restarted** - The code changes haven't been picked up
2. **Request body isn't being parsed** - Body parser middleware issue
3. **Field is actually missing** - One of the required fields is undefined/null

## Solution

### Step 1: Restart the Server

**CRITICAL:** You MUST restart the server for the changes to take effect.

```bash
# Stop the server (Ctrl+C)
# Then restart it:
npm start
```

### Step 2: Test with Diagnostic Endpoint

After restarting, test the diagnostic endpoint:

```javascript
// In browser console:
fetch('/api/rewards/process-redemption-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rewardId: 'test-id',
    email: 'test@example.com',
    couponCodes: ['ECO-2026-TEST'],
    rewardName: 'Test Reward',
    pointsSpent: 100
  })
})
.then(r => r.json())
.then(d => console.log('Diagnostic response:', d));
```

**Expected response:**
```json
{
  "success": true,
  "message": "Diagnostic test successful",
  "receivedBody": {
    "rewardId": "test-id",
    "email": "test@example.com",
    "couponCodes": ["ECO-2026-TEST"],
    "rewardName": "Test Reward",
    "pointsSpent": 100
  },
  "receivedFields": ["rewardId", "email", "couponCodes", "rewardName", "pointsSpent"]
}
```

If this works, the server is running the latest code.

### Step 3: Check Server Logs

After restarting, look at the server console output. You should see:

```
========== REDEMPTION REQUEST START ==========
[REDEMPTION] Full request body: {
  "rewardId": "...",
  "email": "...",
  "couponCodes": [...],
  "rewardName": "...",
  "pointsSpent": ...
}
[REDEMPTION] Extracted fields: {
  rewardId: "...",
  email: "...",
  ...
}
[REDEMPTION] Coupons array length: 2
[REDEMPTION] Validation result - Missing fields: []
[REDEMPTION] ✅ VALIDATION PASSED
```

If you see `Missing fields: []`, the validation passed and the error is coming from somewhere else.

### Step 4: Check Browser Console

After restarting the server, try redeeming again. In browser console, you should see:

```
Modal opened with reward: {id: '...', name: '...', points: 15, quantity: 2, totalPoints: 30}
Request details: {
  rewardId: true,
  email: true,
  userId: true,
  couponCodesCount: 2,
  rewardName: true,
  quantity: 2,
  pointsPerUnit: 15,
  totalPoints: 30,
  pointsSpent: 30
}
Sending redemption request: {
  rewardId: '...',
  email: '...',
  userId: '...',
  couponCodes: Array(2),
  rewardName: 'Snacks',
  quantity: 2,
  pointsPerUnit: 15,
  pointsSpent: 30
}
Response status: 200
Response data: {success: true, ...}
```

## Troubleshooting

### Issue 1: Still Getting 400 Error After Restart

**Check:**
1. Did you actually restart the server? (Stop with Ctrl+C, then `npm start`)
2. Are there any errors in the server console?
3. Is the diagnostic endpoint working?

**Solution:**
1. Kill all Node processes: `taskkill /F /IM node.exe` (Windows) or `killall node` (Mac/Linux)
2. Restart the server: `npm start`
3. Try again

### Issue 2: Diagnostic Endpoint Returns Error

**Check:**
1. Is the server running?
2. Are there any errors in the server console?

**Solution:**
1. Check server console for errors
2. Verify the endpoint URL is correct: `/api/rewards/process-redemption-test`
3. Check that the request body is valid JSON

### Issue 3: Server Console Shows Missing Fields

**Check which field is missing:**
```
[REDEMPTION] Validation result - Missing fields: ['pointsSpent (empty or missing)']
```

**Solution:**
1. Check that the frontend is sending the field
2. Verify the field value is not undefined/null/empty
3. Check the request body in browser Network tab

## Detailed Debugging

### Check Request in Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try to redeem a reward
4. Look for POST request to `/api/rewards/process-redemption`
5. Click on it
6. Go to "Request" tab
7. Check the request body - should show all fields

### Check Response in Browser Network Tab

1. Same request as above
2. Go to "Response" tab
3. Should show detailed error message with missing fields

### Check Server Logs

Look for lines like:
```
[REDEMPTION] Full request body: {...}
[REDEMPTION] Validation result - Missing fields: [...]
```

This tells you exactly what the server received and what's missing.

## Common Issues & Solutions

### Issue: "Missing required fields: pointsSpent"

**Cause:** `pointsSpent` is not being sent or is undefined

**Solution:**
1. Check that `currentRedeemReward.totalPoints` is being set
2. Verify `updateTotalCost()` is being called
3. Check that quantity is being updated correctly

**Debug:**
```javascript
// In browser console after opening modal:
console.log('currentRedeemReward:', currentRedeemReward);
// Should show: {id: '...', name: '...', points: 15, quantity: 1, totalPoints: 15}
```

### Issue: "Missing required fields: couponCodes"

**Cause:** Coupon codes array is empty

**Solution:**
1. Check that `generateCouponCode()` is working
2. Verify the loop is executing
3. Check that coupon codes are being added to array

**Debug:**
```javascript
// In browser console:
const codes = [];
for (let i = 0; i < 2; i++) {
  codes.push(generateCouponCode());
}
console.log('Generated codes:', codes);
// Should show: ['ECO-2026-ABC123', 'ECO-2026-XYZ789']
```

### Issue: "Missing required fields: rewardId"

**Cause:** Reward ID not being passed from modal

**Solution:**
1. Check that `currentRedeemReward.id` is set
2. Verify reward card has `data-reward-id` attribute
3. Check that `openModal()` is receiving the ID

**Debug:**
```javascript
// In browser console after opening modal:
console.log('currentRedeemReward.id:', currentRedeemReward.id);
// Should show the reward ID, not empty string
```

## Next Steps

1. **Restart the server** - This is the most important step
2. **Test the diagnostic endpoint** - Verify the server is running latest code
3. **Check server logs** - See what the server is receiving
4. **Check browser console** - See what the frontend is sending
5. **Check Network tab** - See the actual request and response

## Success Indicators

✅ **When it's working:**
- Diagnostic endpoint returns success
- Server logs show "VALIDATION PASSED"
- Browser console shows "Response status: 200"
- Coupon modal displays
- Email is received

---

## Important Notes

1. **Always restart the server** after making code changes
2. **Check server logs** - They tell you exactly what's happening
3. **Use the diagnostic endpoint** - It helps verify the server is running latest code
4. **Check browser console** - It shows what the frontend is sending

---

## Files Modified

- `controllers/rewardsController.js` - Added detailed logging
- `routes/rewards.js` - Added diagnostic endpoint and logging middleware
- `templates/REWARDS.HTML` - Added detailed request logging

---

## Support

If you still see errors after following these steps:
1. Check server logs for detailed error messages
2. Check browser console for what's being sent
3. Use the diagnostic endpoint to verify server is working
4. Make sure you restarted the server

The detailed logging should now tell you exactly what's wrong!
