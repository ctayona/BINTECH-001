# Redemption Error Fix - 400 Bad Request

## Error Message
```
Redemption failed: Missing required fields
api/rewards/process-redemption:1  Failed to load resource: the server responded with a status of 400 (Bad Request)
```

## Root Cause
The backend was receiving a request with missing or undefined required fields:
- `rewardId`
- `email`
- `couponCodes` (array)
- `rewardName`
- `pointsSpent`

## Fixes Applied

### 1. Frontend Improvements (templates/REWARDS.HTML)

#### Updated `proceedWithRedemption()` function:
- Added validation to ensure all required fields are present before sending
- Added detailed console logging to debug what's being sent
- Ensured `currentRedeemReward.totalPoints` is properly calculated
- Added fallback calculation: `totalPoints = pointsPerUnit * quantity`

```javascript
// Ensure all required fields are present
const rewardId = currentRedeemReward.id;
const rewardName = currentRedeemReward.name;
const pointsPerUnit = currentRedeemReward.points || 0;
const totalPoints = currentRedeemReward.totalPoints || (pointsPerUnit * quantity);

// Validate required fields
if (!rewardId || !userEmail || !rewardName || !totalPoints || couponCodes.length === 0) {
  console.error('Missing required fields:', {
    rewardId,
    userEmail,
    rewardName,
    totalPoints,
    couponCodesCount: couponCodes.length
  });
  alert('Error: Missing required information. Please try again.');
  return;
}
```

#### Updated `openModal()` function:
- Improved initialization of `currentRedeemReward` object
- Ensured `totalPoints` is always set correctly
- Added proper error handling with try-catch
- Added console logging for debugging

```javascript
const pointsValue = parseInt(points) || 0;
const quantityValue = Math.max(0, parseInt(quantity) || 0);

currentRedeemReward = {
  id: rewardId || '',
  name: rewardName || 'Reward',
  points: pointsValue,
  quantity: 1,
  totalPoints: pointsValue  // Initialize with single unit cost
};

console.log('Modal opened with reward:', currentRedeemReward);
```

#### Enhanced error handling:
- Added response status logging
- Added response data logging
- Better error messages

```javascript
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
  // ... rest of handling
})
```

### 2. Backend Improvements (controllers/rewardsController.js)

#### Updated validation in `processRedemption()`:
- Changed from simple validation to detailed field-by-field checking
- Returns specific information about which fields are missing
- Logs request body for debugging

```javascript
const missingFields = [];
if (!rewardId) missingFields.push('rewardId');
if (!email) missingFields.push('email');
if (coupons.length === 0) missingFields.push('couponCodes');
if (!rewardName) missingFields.push('rewardName');
if (!pointsSpent && pointsSpent !== 0) missingFields.push('pointsSpent');

if (missingFields.length > 0) {
  console.error('Missing required fields:', missingFields);
  console.error('Request body:', req.body);
  return res.status(400).json({
    success: false,
    message: `Missing required fields: ${missingFields.join(', ')}`,
    missingFields: missingFields,
    receivedFields: Object.keys(req.body)
  });
}
```

---

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to redeem a reward
4. Look for console logs showing:
   - `Modal opened with reward: {...}`
   - `Sending redemption request: {...}`
   - `Response status: 200` or error status
   - `Response data: {...}`

### Step 2: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to redeem a reward
4. Look for the POST request to `/api/rewards/process-redemption`
5. Click on it and check:
   - Request Headers
   - Request Body (should show all required fields)
   - Response (should show which fields are missing)

### Step 3: Check Server Logs
1. Look at server console output
2. Should see logs like:
   ```
   Missing required fields: ['pointsSpent']
   Request body: { rewardId: '...', email: '...', ... }
   ```

---

## Testing the Fix

### Test 1: Single Coupon Redemption
**Steps:**
1. Open /rewards page
2. Click "View Details" on any reward
3. Keep quantity at 1
4. Click "Redeem Now"
5. Confirm redemption

**Expected Results:**
- ✅ Console shows all required fields present
- ✅ Request sent successfully
- ✅ Coupon modal displays
- ✅ Email received

**If it fails:**
- Check console for missing fields
- Verify `currentRedeemReward` object is properly initialized
- Check that `updateTotalCost()` was called

### Test 2: Multiple Coupon Redemption
**Steps:**
1. Open /rewards page
2. Click "View Details" on any reward
3. Increase quantity to 2
4. Click "Redeem Now"
5. Confirm redemption

**Expected Results:**
- ✅ Console shows `totalPoints = pointsPerUnit * 2`
- ✅ Request sent successfully
- ✅ Coupon modal displays 2 codes
- ✅ Email received with 2 codes

**If it fails:**
- Check console for `totalPoints` value
- Verify `validateQuantity()` is being called
- Check that `updateTotalCost()` recalculates correctly

---

## Common Issues & Solutions

### Issue 1: "Missing required fields: ['pointsSpent']"

**Cause:** `currentRedeemReward.totalPoints` is not being set

**Solution:**
1. Verify `updateTotalCost()` is being called in `openModal()`
2. Check that `validateQuantity()` is updating `currentRedeemReward.quantity`
3. Ensure quantity input has proper `max` attribute set

**Debug:**
```javascript
// In browser console, after opening modal:
console.log(currentRedeemReward);
// Should show: { id: '...', name: '...', points: X, quantity: 1, totalPoints: X }
```

### Issue 2: "Missing required fields: ['rewardId']"

**Cause:** Reward ID not being passed from reward card

**Solution:**
1. Verify reward card has `data-reward-id` attribute
2. Check that `handleViewDetails()` is getting the attribute correctly
3. Ensure `openModal()` is receiving the rewardId parameter

**Debug:**
```javascript
// In browser console, click View Details button:
// Should see in console: "Modal opened with reward: { id: 'xxx', ... }"
```

### Issue 3: "Missing required fields: ['email']"

**Cause:** User email not being retrieved from session

**Solution:**
1. Verify user is logged in
2. Check that `sessionStorage.getItem('bintech_user')` returns valid data
3. Ensure user object has `email` property

**Debug:**
```javascript
// In browser console:
JSON.parse(sessionStorage.getItem('bintech_user'));
// Should show user object with email property
```

### Issue 4: "Missing required fields: ['couponCodes']"

**Cause:** Coupon codes not being generated

**Solution:**
1. Verify `generateCouponCode()` function is working
2. Check that loop is executing correct number of times
3. Ensure coupon codes array is not empty

**Debug:**
```javascript
// In browser console:
const codes = [];
for (let i = 0; i < 2; i++) {
  codes.push(generateCouponCode());
}
console.log(codes);
// Should show: ['ECO-2026-ABC123', 'ECO-2026-XYZ789']
```

---

## Request/Response Examples

### Successful Request
```json
{
  "rewardId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@umak.edu.ph",
  "userId": "student123",
  "couponCodes": ["ECO-2026-ABC123", "ECO-2026-XYZ789"],
  "rewardName": "Coffee Voucher",
  "quantity": 2,
  "pointsPerUnit": 100,
  "pointsSpent": 200
}
```

### Error Response (Missing Fields)
```json
{
  "success": false,
  "message": "Missing required fields: pointsSpent",
  "missingFields": ["pointsSpent"],
  "receivedFields": ["rewardId", "email", "userId", "couponCodes", "rewardName", "quantity", "pointsPerUnit"]
}
```

### Successful Response
```json
{
  "success": true,
  "message": "Reward redeemed successfully!",
  "redemption": {
    "rewardName": "Coffee Voucher",
    "couponCodes": ["ECO-2026-ABC123", "ECO-2026-XYZ789"],
    "pointsSpent": 200,
    "remainingPoints": 300,
    "rewardInventory": 3,
    "quantity": 2,
    "timestamp": "2026-04-30T10:30:00.000Z"
  }
}
```

---

## Verification Checklist

After applying fixes, verify:
- [ ] Browser console shows no errors
- [ ] `currentRedeemReward` object is properly initialized
- [ ] `totalPoints` is calculated correctly
- [ ] All required fields are present in request
- [ ] Request is sent to correct endpoint
- [ ] Response status is 200 (success) or appropriate error code
- [ ] Coupon modal displays after successful redemption
- [ ] Email is received with coupon codes
- [ ] Points are deducted from user account
- [ ] Reward inventory is decreased

---

## Files Modified

1. **templates/REWARDS.HTML**
   - Updated `proceedWithRedemption()` with validation and logging
   - Updated `openModal()` with better initialization
   - Enhanced error handling

2. **controllers/rewardsController.js**
   - Updated validation with detailed field checking
   - Added specific error messages
   - Added request body logging

---

## Next Steps

1. **Test the fix** - Follow testing procedures above
2. **Monitor logs** - Check server logs for any errors
3. **Verify email** - Ensure emails are being sent
4. **Check database** - Verify points and inventory are updated
5. **Deploy** - When all tests pass

---

## Support

If you still see errors:
1. Check browser console for detailed error messages
2. Check server logs for request body
3. Verify all required fields are being sent
4. Check that `currentRedeemReward` object is properly initialized
5. Verify `updateTotalCost()` is being called

The detailed error messages should now tell you exactly which field is missing!
