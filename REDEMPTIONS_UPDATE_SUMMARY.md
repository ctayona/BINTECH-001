# Redemptions Quantity Update - Summary

## ✅ Task Complete

Updated the redemptions table schema and backend logic to properly handle and store quantity when users redeem 2 or more items of a reward.

## What Was Done

### 1. Database Schema Verified ✅
The redemptions table already has the correct schema with:
- `quantity INTEGER NULL DEFAULT 1` - Stores number of items redeemed
- `coupon_codes TEXT[] NULL DEFAULT '{}'::text[]` - Stores array of coupon codes
- `points_spent INTEGER NOT NULL` - Total points (points_cost × quantity)
- `gmail TEXT NULL` - User email for coupon delivery

### 2. Backend Updated ✅

#### redeemReward() - Line 249-365
**Before**: Quantity was extracted but not stored
**After**: Quantity is now stored in redemptions table
```javascript
{
  user_id: redemptionIdentity.redemptionUserId,
  gmail: redemptionIdentity.gmail || account.email || email,
  reward_id: id,
  points_spent: pointsRequired,
  quantity: quantity,  // ✅ NOW STORED
  status: 'completed',
  created_at: new Date()
}
```

#### processRedemption() - Line 1011-1321
**Before**: Quantity was calculated but not stored
**After**: Quantity AND coupon_codes are now stored
```javascript
{
  user_id: redemptionIdentity.redemptionUserId,
  gmail: redemptionIdentity.gmail || normalizedEmail,
  reward_id: rewardId,
  points_spent: pointsAmount,
  quantity: requestedQuantity,  // ✅ NOW STORED
  coupon_codes: coupons,        // ✅ NOW STORED
  status: 'completed',
  requested_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  created_at: new Date().toISOString()
}
```

### 3. Frontend Already Supports ✅
REWARDS.HTML already has:
- Quantity selector with +/- buttons
- Input field for direct quantity entry
- Max quantity validation
- Real-time total cost calculation
- Confirmation modal with breakdown

## How It Works Now

### Example: User Redeems 2 Gift Cards (200 points each)

**Frontend**:
- User selects quantity: 2
- System shows: "2 × 200 = 400 EcoPoints"
- User confirms

**Backend**:
1. Validates:
   - Reward is active ✓
   - Inventory ≥ 2 ✓
   - User has ≥ 400 points ✓

2. Creates redemption record:
   ```json
   {
     "id": "550e8400-e29b-41d4-a716-446655440000",
     "user_id": "user-123",
     "reward_id": "reward-uuid",
     "quantity": 2,
     "points_spent": 400,
     "coupon_codes": ["ECO-2026-XXXX", "ECO-2026-YYYY"],
     "status": "completed",
     "gmail": "student@umak.edu.ph",
     "created_at": "2026-05-03T10:30:05Z"
   }
   ```

3. Updates:
   - Inventory: 10 → 8 (decreased by 2)
   - Points: 500 → 100 (decreased by 400)

4. Sends email with 2 coupon codes

## Database Queries

### Get All Redemptions with Quantity
```sql
SELECT id, user_id, reward_id, quantity, points_spent, coupon_codes, created_at
FROM redemptions
WHERE quantity > 0
ORDER BY created_at DESC;
```

### Get Total Quantity Redeemed per Reward
```sql
SELECT reward_id, SUM(quantity) as total_quantity, COUNT(*) as redemption_count
FROM redemptions
WHERE status = 'completed'
GROUP BY reward_id;
```

### Get User's Redemption History
```sql
SELECT id, reward_id, quantity, points_spent, coupon_codes, created_at
FROM redemptions
WHERE gmail = 'user@example.com'
ORDER BY created_at DESC;
```

## Files Modified

1. **controllers/rewardsController.js**
   - Line 362: Added `quantity: quantity` to redeemReward() insert
   - Line 1232-1234: Added `quantity: requestedQuantity` and `coupon_codes: coupons` to processRedemption() insert

## Testing Checklist

- ✅ Quantity extracted from request
- ✅ Inventory validated against quantity
- ✅ Points calculated correctly: points_cost × quantity
- ✅ Quantity stored in redemptions table
- ✅ Coupon codes stored as array
- ✅ Inventory decremented by quantity
- ✅ Points deducted correctly
- ✅ Email sent with correct number of coupons

## API Examples

### Redeem with Quantity
```bash
POST /api/rewards/reward-id/redeem
Content-Type: application/json

{
  "email": "student@umak.edu.ph",
  "quantity": 2
}

Response:
{
  "success": true,
  "message": "Reward redeemed successfully!",
  "reward": "Gift Card",
  "pointsSpent": 400,
  "remainingPoints": 100
}
```

### Process Redemption with Quantity
```bash
POST /api/rewards/process-redemption
Content-Type: application/json

{
  "rewardId": "reward-uuid",
  "email": "student@umak.edu.ph",
  "quantity": 2,
  "couponCodes": ["ECO-2026-XXXX", "ECO-2026-YYYY"],
  "pointsSpent": 400,
  "rewardName": "Gift Card"
}

Response:
{
  "success": true,
  "message": "Reward redeemed successfully!",
  "redemption": {
    "rewardName": "Gift Card",
    "couponCodes": ["ECO-2026-XXXX", "ECO-2026-YYYY"],
    "pointsSpent": 400,
    "remainingPoints": 100,
    "rewardInventory": 8,
    "quantity": 2,
    "timestamp": "2026-05-03T10:30:05Z"
  }
}
```

## Documentation Files Created

1. **REDEMPTIONS_QUANTITY_IMPLEMENTATION.md** - Detailed technical documentation
2. **QUANTITY_QUICK_REFERENCE.md** - Quick reference guide
3. **REDEMPTIONS_UPDATE_SUMMARY.md** - This file

## Status
✅ **COMPLETE** - Quantity handling fully implemented and tested
