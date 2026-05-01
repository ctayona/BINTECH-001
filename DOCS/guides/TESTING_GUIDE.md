# Testing Guide - 404 Error Fix & Multiple Coupon Generation

## Quick Start Testing

### Test 1: Verify 404 Error is Fixed

**Steps:**
1. Open your browser
2. Navigate to `http://localhost:3000/rewards` (or your app URL)
3. Open Developer Tools (F12 or Right-click → Inspect)
4. Go to the Console tab
5. Look for any 404 errors

**Expected Results:**
- ✅ NO 404 errors for `data_sdk.js` or `element_sdk.js`
- ✅ Console shows: `[DataSDK] Initialized`
- ✅ Console shows: `[ElementSDK] Initialized`
- ✅ Page loads without errors

**If you see 404 errors:**
- Check that files exist: `public/_sdk/element_sdk.js` and `public/_sdk/data_sdk.js`
- Verify app.js has `app.use(express.static(path.join(__dirname, 'public')));`
- Restart the server

---

### Test 2: Single Coupon Redemption (Quantity = 1)

**Prerequisites:**
- User must be logged in
- User must have sufficient points
- Reward must be in stock

**Steps:**
1. Navigate to Rewards page
2. Click "View Details" on any reward
3. Set Quantity to 1 (default)
4. Click "Redeem Now"
5. Confirm redemption in the confirmation modal
6. Check the coupon modal

**Expected Results:**
- ✅ Coupon modal displays ONE coupon code
- ✅ Code format: `ECO-YYYY-XXXXXX` (e.g., `ECO-2026-ABC123`)
- ✅ Expiry date shows 30 days from today
- ✅ Email received with single coupon code
- ✅ Points deducted from user account
- ✅ Reward inventory decreased by 1

**Email Verification:**
- Subject: `BinTECH Reward Redeemed: ECO-2026-ABC123`
- Body shows: Single coupon code in large format
- Includes: Reward name, points spent, remaining points

---

### Test 3: Multiple Coupon Redemption (Quantity = 2)

**Prerequisites:**
- User must be logged in
- User must have sufficient points (2x reward cost)
- Reward must have at least 2 items in stock

**Steps:**
1. Navigate to Rewards page
2. Click "View Details" on any reward
3. Click the "+" button to increase quantity to 2
4. Verify Total Cost is updated (2x the single cost)
5. Click "Redeem Now"
6. Confirm redemption in the confirmation modal
7. Check the coupon modal

**Expected Results:**
- ✅ Coupon modal displays TWO coupon codes
- ✅ Each code labeled: "Coupon 1: ECO-2026-ABC123", "Coupon 2: ECO-2026-XYZ789"
- ✅ Each code is UNIQUE (different random characters)
- ✅ Expiry date shows 30 days from today
- ✅ Email received with both coupon codes
- ✅ Points deducted: 2x reward cost
- ✅ Reward inventory decreased by 2

**Email Verification:**
- Subject: `BinTECH Reward Redeemed: 2 Coupons`
- Body shows: Both coupon codes with labels
- Includes: Reward name, total points spent, remaining points
- Grammar: "Coupon codes" (plural), "keep these coupon codes safe"

---

### Test 4: Multiple Coupon Redemption (Quantity = 3+)

**Prerequisites:**
- User must be logged in
- User must have sufficient points (3x+ reward cost)
- Reward must have at least 3+ items in stock

**Steps:**
1. Navigate to Rewards page
2. Click "View Details" on any reward
3. Increase quantity to 3 (or more)
4. Verify Total Cost is updated correctly
5. Click "Redeem Now"
6. Confirm redemption
7. Check the coupon modal

**Expected Results:**
- ✅ Coupon modal displays ALL coupon codes
- ✅ Each code labeled: "Coupon 1:", "Coupon 2:", "Coupon 3:", etc.
- ✅ All codes are UNIQUE
- ✅ Email received with all coupon codes
- ✅ Points deducted: 3x+ reward cost
- ✅ Reward inventory decreased by 3+

**Email Verification:**
- Subject: `BinTECH Reward Redeemed: 3 Coupons` (or appropriate number)
- Body shows: All coupon codes with proper numbering
- Proper pluralization throughout

---

### Test 5: Verify Coupon Uniqueness

**Steps:**
1. Redeem the same reward multiple times with quantity = 1
2. Note the coupon codes from each redemption
3. Compare all codes

**Expected Results:**
- ✅ Each coupon code is UNIQUE
- ✅ No duplicate codes across different redemptions
- ✅ Format is consistent: `ECO-YYYY-XXXXXX`

**Example:**
```
Redemption 1: ECO-2026-ABC123
Redemption 2: ECO-2026-XYZ789
Redemption 3: ECO-2026-QWE456
```

---

### Test 6: Verify Points Calculation

**Steps:**
1. Note current points balance
2. Redeem a reward with quantity = 2
3. Check new points balance
4. Verify calculation

**Expected Results:**
- ✅ Points deducted = (Reward Cost × Quantity)
- ✅ New Balance = Old Balance - Points Deducted
- ✅ Email shows correct remaining points

**Example:**
```
Old Balance: 500 points
Reward Cost: 100 points
Quantity: 2
Points Deducted: 200 points
New Balance: 300 points
```

---

### Test 7: Verify Inventory Update

**Steps:**
1. Note current inventory for a reward
2. Redeem with quantity = 2
3. Refresh the page
4. Check inventory again

**Expected Results:**
- ✅ Inventory decreased by 2
- ✅ If inventory reaches 0, reward shows "Out of Stock"
- ✅ Reward is deactivated if inventory = 0

**Example:**
```
Before: 5 available
After: 3 available
```

---

### Test 8: Error Handling - Insufficient Points

**Steps:**
1. Note current points balance
2. Try to redeem a reward that costs more than available points
3. Observe the modal

**Expected Results:**
- ✅ Redeem button turns RED
- ✅ Button text changes to "Insufficient Points"
- ✅ Error message shows: "You need X points but only have Y"
- ✅ Cannot proceed with redemption

---

### Test 9: Error Handling - Out of Stock

**Steps:**
1. Find a reward with 0 inventory
2. Click "View Details"
3. Observe the modal

**Expected Results:**
- ✅ Quantity shows "0"
- ✅ Redeem button is disabled
- ✅ Button text shows "Out of Stock"
- ✅ Cannot proceed with redemption

---

### Test 10: Email Delivery Verification

**Steps:**
1. Redeem a reward with quantity = 2
2. Check your email inbox
3. Open the email from BinTECH

**Expected Results:**
- ✅ Email received within 1-2 minutes
- ✅ Subject line is correct
- ✅ Both coupon codes are visible
- ✅ All details are accurate
- ✅ Email is properly formatted
- ✅ Expiry date is 30 days from today

**Email Content Checklist:**
- [ ] Reward name is correct
- [ ] All coupon codes are displayed
- [ ] Points spent is correct
- [ ] Remaining points is correct
- [ ] Expiry date is correct
- [ ] Professional formatting
- [ ] No broken images or styling

---

## Troubleshooting

### Issue: 404 Error Still Appears

**Solution:**
1. Verify files exist:
   ```bash
   ls -la public/_sdk/
   ```
2. Check app.js has static serving:
   ```javascript
   app.use(express.static(path.join(__dirname, 'public')));
   ```
3. Restart the server
4. Clear browser cache (Ctrl+Shift+Delete)
5. Hard refresh (Ctrl+F5)

### Issue: Only One Coupon Generated for Quantity > 1

**Solution:**
1. Check browser console for errors
2. Verify frontend code in REWARDS.HTML:
   ```javascript
   const couponCodes = [];
   for (let i = 0; i < quantity; i++) {
     couponCodes.push(generateCouponCode());
   }
   ```
3. Check backend receives `couponCodes` array
4. Verify email function handles array

### Issue: Email Not Received

**Solution:**
1. Check server logs for email errors
2. Verify Gmail credentials in .env:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
3. Check spam/junk folder
4. Verify email address is correct in user account

### Issue: Coupon Codes Are Duplicates

**Solution:**
1. Check `generateCouponCode()` function uses proper randomization
2. Verify each call generates new code
3. Check for caching issues

---

## Performance Metrics

**Expected Performance:**
- Page load time: < 2 seconds
- Redemption processing: < 3 seconds
- Email delivery: < 2 minutes
- Coupon generation: < 100ms per code

---

## Success Criteria

All tests should pass:
- [ ] Test 1: 404 Error Fixed
- [ ] Test 2: Single Coupon Works
- [ ] Test 3: Double Coupon Works
- [ ] Test 4: Multiple Coupons Work
- [ ] Test 5: Coupons Are Unique
- [ ] Test 6: Points Calculated Correctly
- [ ] Test 7: Inventory Updated
- [ ] Test 8: Insufficient Points Error
- [ ] Test 9: Out of Stock Error
- [ ] Test 10: Email Delivered

**If all tests pass:** ✅ Implementation is complete and working correctly!
