# Analytics Metrics Implementation - COMPLETE ✅

## Overview
Updated the analytics dashboard to use correct data sources from the database schema. All metrics now pull from the appropriate tables with proper calculations.

## Metrics Implementation

### 1. Total Waste Sorted ✅
**Source**: `machine_sessions` table
**Calculation**: SUM(metal_count + plastic_count + paper_count)
**Formula**: 
```sql
SELECT SUM(metal_count + plastic_count + paper_count) as total_waste_sorted
FROM machine_sessions
WHERE started_at BETWEEN dateFrom AND dateTo;
```

**Example**:
- Session 1: metal=5, plastic=3, paper=2 → 10 items
- Session 2: metal=8, plastic=4, paper=1 → 13 items
- **Total: 23 items sorted**

### 2. Total Points Generated ✅
**Source**: `machine_sessions` table
**Calculation**: SUM(total_points)
**Formula**:
```sql
SELECT SUM(total_points) as total_points_generated
FROM machine_sessions
WHERE started_at BETWEEN dateFrom AND dateTo;
```

**Example**:
- Session 1: 50 points
- Session 2: 75 points
- **Total: 125 points**

### 3. Active Users ✅
**Source**: `user_accounts` table
**Calculation**: COUNT(system_id) WHERE status = 'active'
**Formula**:
```sql
SELECT COUNT(system_id) as active_users
FROM user_accounts
WHERE status = 'active';
```

**Example**:
- Total users: 500
- Active users: 350
- Suspended users: 150
- **Active: 350 users**

### 4. Rewards Redeemed ✅
**Source**: `redemptions` table
**Calculation**: SUM(quantity) WHERE status = 'completed'
**Formula**:
```sql
SELECT SUM(quantity) as rewards_redeemed
FROM redemptions
WHERE status = 'completed'
  AND completed_at BETWEEN dateFrom AND dateTo;
```

**Example**:
- Redemption 1: quantity=2 (2 gift cards)
- Redemption 2: quantity=1 (1 voucher)
- Redemption 3: quantity=3 (3 items)
- **Total: 6 items redeemed**

## Backend Implementation

### Updated getDashboardSummary() - Line 321
**File**: `controllers/adminController.js`

**Changes**:
1. Added query for active users (status = 'active')
2. Added query for completed redemptions with quantity sum
3. Added calculation for total waste sorted from machine_sessions
4. Updated systemStatistics object with new metrics

```javascript
// Active users: count only users with status = 'active'
supabase.from('user_accounts').select('system_id', { head: true, count: 'exact' }).eq('status', 'active'),

// Rewards redeemed: sum of quantity from completed redemptions
supabase.from('redemptions').select('quantity').eq('status', 'completed')

// Calculate total waste sorted from machine_sessions
const totalWasteSortedFromSessions = (machineSessionsData || []).reduce((sum, session) => {
  return sum + (Number(session.metal_count || 0) + Number(session.plastic_count || 0) + Number(session.paper_count || 0));
}, 0);

// Updated systemStatistics
const systemStatistics = {
  totalAccounts: ...,
  totalUserAccounts: ...,
  totalAdminAccounts: ...,
  totalSessions: ...,
  totalRedeemableRewards: ...,
  totalCollections: ...,
  activeUsers: Number(activeUsersStats.count || 0),
  totalRewardsRedeemed: totalRewardsRedeemed,
  totalWasteSortedFromSessions: totalWasteSortedFromSessions
};
```

### New getAnalytics() Endpoint - Line 3826+
**File**: `controllers/adminController.js`

**Purpose**: Provides analytics data with date range filtering for the analytics page

**Endpoint**: `GET /api/admin/analytics?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`

**Response**:
```json
{
  "success": true,
  "analytics": {
    "totalWasteSorted": 23,
    "totalPointsGenerated": 125,
    "activeUsers": 350,
    "rewardsRedeemed": 6,
    "dateRange": {
      "from": "2026-04-03",
      "to": "2026-05-03"
    },
    "timestamp": "2026-05-03T10:30:00Z"
  }
}
```

### Route Addition
**File**: `routes/admin.js`

**Added**:
```javascript
// Analytics API (for analytics page with date range filtering)
router.get('/analytics', adminController.getAnalytics);
```

## Frontend Integration

### ADMIN_ANALYTICS.html Updates
**File**: `templates/ADMIN_ANALYTICS.html`

**JavaScript Function** (already in place):
```javascript
async function loadAnalyticsData(dateFrom, dateTo) {
  try {
    const response = await fetch(`/api/admin/analytics?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    const result = await response.json();
    
    if (result.success) {
      document.getElementById('metricWasteSorted').textContent = result.analytics.totalWasteSorted;
      document.getElementById('metricPointsGenerated').textContent = result.analytics.totalPointsGenerated;
      document.getElementById('metricActiveUsers').textContent = result.analytics.activeUsers;
      document.getElementById('metricRewardsRedeemed').textContent = result.analytics.rewardsRedeemed;
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}
```

## Database Queries

### Query 1: Total Waste Sorted
```sql
SELECT 
  SUM(metal_count + plastic_count + paper_count) as total_waste_sorted,
  COUNT(*) as total_sessions,
  AVG(metal_count + plastic_count + paper_count) as avg_per_session
FROM machine_sessions
WHERE started_at >= '2026-04-03'::date
  AND started_at < '2026-05-04'::date;
```

### Query 2: Total Points Generated
```sql
SELECT 
  SUM(total_points) as total_points,
  COUNT(*) as sessions_with_points,
  AVG(total_points) as avg_points_per_session
FROM machine_sessions
WHERE started_at >= '2026-04-03'::date
  AND started_at < '2026-05-04'::date;
```

### Query 3: Active Users
```sql
SELECT 
  COUNT(system_id) as active_users,
  COUNT(CASE WHEN role = 'student' THEN 1 END) as active_students,
  COUNT(CASE WHEN role = 'faculty' THEN 1 END) as active_faculty,
  COUNT(CASE WHEN role = 'staff' THEN 1 END) as active_staff
FROM user_accounts
WHERE status = 'active';
```

### Query 4: Rewards Redeemed
```sql
SELECT 
  SUM(quantity) as total_redeemed,
  COUNT(*) as redemption_count,
  AVG(quantity) as avg_quantity_per_redemption,
  SUM(points_spent) as total_points_spent
FROM redemptions
WHERE status = 'completed'
  AND completed_at >= '2026-04-03'::date
  AND completed_at < '2026-05-04'::date;
```

## Data Flow

### Dashboard Summary (Real-time)
```
GET /api/admin/summary
  ↓
getDashboardSummary()
  ├─ Query machine_sessions (all time)
  ├─ Query user_accounts (status = 'active')
  ├─ Query redemptions (status = 'completed')
  ├─ Calculate totals
  └─ Return systemStatistics with:
      - activeUsers
      - totalRewardsRedeemed
      - totalWasteSortedFromSessions
```

### Analytics Page (Date Range)
```
GET /api/admin/analytics?dateFrom=2026-04-03&dateTo=2026-05-03
  ↓
getAnalytics()
  ├─ Query machine_sessions (dateFrom to dateTo)
  ├─ Query user_accounts (status = 'active')
  ├─ Query redemptions (status = 'completed', dateFrom to dateTo)
  ├─ Calculate totals
  └─ Return analytics with:
      - totalWasteSorted
      - totalPointsGenerated
      - activeUsers
      - rewardsRedeemed
```

## Files Modified

| File | Location | Change |
|------|----------|--------|
| controllers/adminController.js | Line 321-370 | Updated getDashboardSummary() with correct data sources |
| controllers/adminController.js | Line 3826+ | Added new getAnalytics() endpoint |
| routes/admin.js | Line 26 | Added analytics route |

## Testing

### Test 1: Dashboard Summary
```bash
curl http://localhost:3000/api/admin/summary
```

Expected response includes:
- `systemStatistics.activeUsers` (count of active users)
- `systemStatistics.totalRewardsRedeemed` (sum of quantities)
- `totalWasteSorted` (sum of material counts)

### Test 2: Analytics with Date Range
```bash
curl "http://localhost:3000/api/admin/analytics?dateFrom=2026-04-03&dateTo=2026-05-03"
```

Expected response:
```json
{
  "success": true,
  "analytics": {
    "totalWasteSorted": 150,
    "totalPointsGenerated": 500,
    "activeUsers": 350,
    "rewardsRedeemed": 25,
    "dateRange": {
      "from": "2026-04-03",
      "to": "2026-05-03"
    }
  }
}
```

### Test 3: Analytics with Default Date Range (Last 30 days)
```bash
curl http://localhost:3000/api/admin/analytics
```

Should return data for the last 30 days automatically.

## Verification Checklist

- ✅ Total Waste Sorted: SUM(metal_count + plastic_count + paper_count)
- ✅ Total Points Generated: SUM(total_points) from machine_sessions
- ✅ Active Users: COUNT where status = 'active'
- ✅ Rewards Redeemed: SUM(quantity) where status = 'completed'
- ✅ Date range filtering works correctly
- ✅ Default date range (last 30 days) works
- ✅ Dashboard summary includes new metrics
- ✅ Analytics page loads data correctly

## Example Data

### Machine Sessions
```json
{
  "id": "session-1",
  "metal_count": 5,
  "plastic_count": 3,
  "paper_count": 2,
  "total_points": 50,
  "started_at": "2026-05-03T10:00:00Z"
}
```

### User Accounts
```json
{
  "system_id": "user-123",
  "email": "student@umak.edu.ph",
  "status": "active",
  "role": "student"
}
```

### Redemptions
```json
{
  "id": "redemption-1",
  "quantity": 2,
  "points_spent": 400,
  "status": "completed",
  "completed_at": "2026-05-03T11:00:00Z"
}
```

## Status
✅ **COMPLETE** - All metrics properly implemented with correct data sources
