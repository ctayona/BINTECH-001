# Quantity Handling - Quick Reference

## What Changed

### Database
- **redemptions table** now properly stores `quantity` field
- **coupon_codes** array stores one coupon per quantity

### Backend
- **redeemReward()**: Now stores quantity in redemptions table
- **processRedemption()**: Now stores quantity AND coupon_codes in redemptions table

### Frontend
- **REWARDS.HTML**: Already has quantity selector UI

## How It Works

### User Redeems 2 Items
1. User selects quantity: **2**
2. System calculates: `2 × 200 points = 400 points`
3. User confirms redemption
4. System creates record:
   ```
   quantity: 2
   points_spent: 400
   coupon_codes: ["ECO-2026-XXXX", "ECO-2026-YYYY"]
   ```
5. Inventory decreases by 2
6. Points deducted: 400
7. Email sent with 2 coupons

## Database Queries

### Check Redemptions with Quantity > 1
```sql
SELECT * FROM redemptions WHERE quantity > 1;
```

### Get Total Quantity Redeemed
```sql
SELECT reward_id, SUM(quantity) as total_redeemed 
FROM redemptions 
GROUP BY reward_id;
```

### Get User's Redemption History with Quantities
```sql
SELECT id, reward_id, quantity, points_spent, created_at 
FROM redemptions 
WHERE gmail = 'user@example.com' 
ORDER BY created_at DESC;
```

## Files Modified
- `controllers/rewardsController.js` (2 locations)
  - Line 362: redeemReward() - added quantity
  - Line 1232-1234: processRedemption() - added quantity and coupon_codes

## Testing
```bash
# Test with quantity 2
POST /api/rewards/reward-id/redeem
{
  "email": "user@example.com",
  "quantity": 2
}

# Or via processRedemption
POST /api/rewards/process-redemption
{
  "rewardId": "reward-uuid",
  "email": "user@example.com",
  "quantity": 2,
  "couponCodes": ["ECO-2026-XXXX", "ECO-2026-YYYY"],
  "pointsSpent": 400,
  "rewardName": "Gift Card"
}
```

## Status
✅ Complete - Quantity is now properly stored in redemptions table
