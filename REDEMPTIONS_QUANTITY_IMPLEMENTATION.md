# Redemptions Quantity Implementation - COMPLETE ✅

## Overview
Updated the redemptions table schema and backend logic to properly handle and store quantity when users redeem 2 or more items of a reward.

## Database Schema

### Redemptions Table Structure
```sql
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id TEXT NULL,
  reward_id UUID NULL,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quantity INTEGER NULL DEFAULT 1,
  coupon_codes TEXT[] NULL DEFAULT '{}'::text[],
  gmail TEXT NULL,
  CONSTRAINT redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT redemptions_reward_id_fkey FOREIGN KEY (reward_id) 
    REFERENCES rewards (id) ON DELETE CASCADE
);
```

### Key Fields for Quantity Handling
- **quantity** (INTEGER, DEFAULT 1): Stores the number of items redeemed
- **coupon_codes** (TEXT[], DEFAULT '{}'): Stores array of coupon codes (one per quantity)
- **points_spent** (INTEGER): Total points spent (points_cost × quantity)
- **gmail** (TEXT): User's email for coupon delivery

### Indexes
```sql
CREATE INDEX idx_redemptions_status ON public.redemptions USING btree (status);
CREATE INDEX idx_redemptions_created_at ON public.redemptions USING btree (created_at);
CREATE INDEX idx_redemptions_gmail ON public.redemptions USING btree (gmail);
CREATE INDEX idx_redemptions_user_id ON public.redemptions USING btree (user_id);
```

## Backend Implementation

### 1. redeemReward Endpoint
**File**: `controllers/rewardsController.js` (Line 249)

**Changes**:
- Extracts quantity from request: `const quantity = Math.max(1, parseInt(req.body.quantity || '1', 10) || 1);`
- Validates inventory: `if (reward.inventory < quantity)`
- Calculates total points: `const pointsRequired = Number(reward.points_cost || 0) * quantity;`
- **NOW STORES QUANTITY** in redemptions table:
  ```javascript
  {
    user_id: redemptionIdentity.redemptionUserId,
    gmail: redemptionIdentity.gmail || account.email || email,
    reward_id: id,
    points_spent: pointsRequired,
    quantity: quantity,  // ✅ ADDED
    status: 'completed',
    created_at: new Date()
  }
  ```

### 2. processRedemption Endpoint
**File**: `controllers/rewardsController.js` (Line 1011)

**Changes**:
- Extracts quantity from request: `const requestedQuantity = Math.max(1, parseInt(quantity || '1', 10) || 1);`
- Validates inventory: `if (reward.inventory < requestedQuantity)`
- Calculates total points: `const pointsAmount = Number(reward.points_cost || 0) * requestedQuantity;`
- Decrements inventory by quantity: `const newInventory = reward.inventory - requestedQuantity;`
- **NOW STORES QUANTITY AND COUPON CODES** in redemptions table:
  ```javascript
  {
    user_id: redemptionIdentity.redemptionUserId,
    gmail: redemptionIdentity.gmail || normalizedEmail,
    reward_id: rewardId,
    points_spent: pointsAmount,
    quantity: requestedQuantity,  // ✅ ADDED
    coupon_codes: coupons,        // ✅ ADDED
    status: 'completed',
    requested_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
  ```

## Frontend Implementation

### REWARDS.HTML Quantity Selector
**File**: `templates/REWARDS.HTML`

**Features**:
- Quantity control with +/- buttons
- Input field for direct quantity entry
- Max quantity validation based on available inventory
- Real-time total cost calculation: `total = points_cost × quantity`
- Confirmation modal shows breakdown: `quantity × points_cost = total_points`

**Quantity Control HTML**:
```html
<div class="quantity-control">
  <button onclick="decreaseQuantity()" class="quantity-btn">−</button>
  <input type="number" id="modal-quantity-select" min="1" max="1" value="1" 
         onchange="validateQuantity()" onkeyup="validateQuantity()">
  <button onclick="increaseQuantity()" class="quantity-btn">+</button>
</div>
<p class="text-xs text-[#0F3B2E]/50 text-center mt-3">
  Max: <span id="modal-max-quantity" class="font-bold text-[#0F3B2E]">1</span>
</p>
```

## Data Flow

### When User Redeems 2+ Quantity

1. **Frontend**: User selects quantity (e.g., 2)
2. **Frontend**: Calculates total cost: `2 × 200 = 400 points`
3. **Frontend**: Shows confirmation: "Redeeming: Reward Name, Quantity: 2, Cost: 2 × 200 = 400 EcoPoints"
4. **Backend**: Receives `{ rewardId, quantity: 2, pointsSpent: 400, ... }`
5. **Backend**: Validates:
   - Reward is active ✓
   - Inventory ≥ 2 ✓
   - User has ≥ 400 points ✓
6. **Backend**: Creates redemption record:
   ```json
   {
     "user_id": "user123",
     "reward_id": "reward-uuid",
     "quantity": 2,
     "points_spent": 400,
     "coupon_codes": ["ECO-2026-XXXX", "ECO-2026-YYYY"],
     "status": "completed",
     "gmail": "user@example.com"
   }
   ```
7. **Backend**: Updates inventory: `inventory = 10 - 2 = 8`
8. **Backend**: Deducts points: `points = 500 - 400 = 100`
9. **Backend**: Sends email with 2 coupon codes

## Query Examples

### Get All Redemptions for a User with Quantity
```sql
SELECT 
  id,
  user_id,
  reward_id,
  quantity,
  points_spent,
  coupon_codes,
  status,
  created_at
FROM redemptions
WHERE gmail = 'user@example.com'
ORDER BY created_at DESC;
```

### Get Total Quantity Redeemed for a Reward
```sql
SELECT 
  reward_id,
  SUM(quantity) as total_quantity_redeemed,
  COUNT(*) as redemption_count,
  SUM(points_spent) as total_points_spent
FROM redemptions
WHERE status = 'completed'
GROUP BY reward_id;
```

### Get Redemptions with Quantity > 1
```sql
SELECT 
  id,
  user_id,
  reward_id,
  quantity,
  points_spent,
  created_at
FROM redemptions
WHERE quantity > 1
ORDER BY created_at DESC;
```

## Files Modified

1. **controllers/rewardsController.js**
   - Line 254: Extract quantity from request
   - Line 288: Validate inventory against quantity
   - Line 334: Calculate points_spent = points_cost × quantity
   - Line 354-365: **INSERT quantity into redemptions table** ✅
   - Line 1018: Extract quantity from request
   - Line 1088: Validate inventory against quantity
   - Line 1093: Calculate pointsAmount = points_cost × requestedQuantity
   - Line 1225-1237: **INSERT quantity and coupon_codes into redemptions table** ✅

2. **templates/REWARDS.HTML**
   - Quantity selector UI (already implemented)
   - Confirmation modal shows quantity breakdown

## Testing Checklist

- ✅ User can select quantity 1-N
- ✅ Total cost updates correctly: `quantity × points_cost`
- ✅ Inventory validation: `available_inventory ≥ requested_quantity`
- ✅ Points validation: `user_points ≥ total_points_required`
- ✅ Redemption record stores quantity
- ✅ Redemption record stores coupon_codes array
- ✅ Inventory decremented by quantity
- ✅ Points deducted correctly
- ✅ Email sent with correct number of coupons
- ✅ Query returns correct quantity data

## Example Redemption Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123",
  "reward_id": "reward-uuid-456",
  "quantity": 2,
  "points_spent": 400,
  "coupon_codes": ["ECO-2026-XXXX", "ECO-2026-YYYY"],
  "status": "completed",
  "gmail": "student@umak.edu.ph",
  "requested_at": "2026-05-03T10:30:00Z",
  "completed_at": "2026-05-03T10:30:05Z",
  "created_at": "2026-05-03T10:30:05Z"
}
```

## Status
✅ **COMPLETE** - Quantity handling fully implemented in schema and backend
