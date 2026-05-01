# User Ranking - Quick Reference

## What Was Implemented

✅ User ranking system based on `account_points.points` column
✅ Ranks users in descending order (highest points = Rank #1)
✅ Displays rank on dashboard with badge and position
✅ Calculates percentile for each user
✅ Includes rank tiers (🥇, 🥈, 🥉, ⭐, ✨)

## Rank Display

### Dashboard Display
```
Rank: 🥇 #1 of 1,823
```

### Rank Tiers
- 🥇 #1 = Rank 1
- 🥈 #2 = Rank 2
- 🥉 #3 = Rank 3
- ⭐ Top 10 = Rank ≤ 10
- ✨ Top 100 = Rank ≤ 100
- Participant = Rank > 100

## API Endpoints

### Get User Points and Rank
```
GET /api/dashboard/points?userId=xxx&email=user@example.com
```

Response includes:
- User points
- Rank number
- Total users
- Percentile
- Rank badge

### Get Leaderboard Position
```
GET /api/dashboard/leaderboard-position?userId=xxx&email=user@example.com
```

Response includes:
- Rank
- Total users
- Percentile
- Rank badge

## SQL Query

```sql
-- Get user rank with total users
WITH ranked_users AS (
  SELECT 
    ap.system_id,
    ap.email,
    ap.points,
    ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank
  FROM account_points ap
),
total_count AS (
  SELECT COUNT(*) as total_users FROM account_points
)
SELECT 
  ru.system_id,
  ru.email,
  ru.points,
  ru.rank,
  tc.total_users
FROM ranked_users ru
CROSS JOIN total_count tc
WHERE ru.email = $1;
```

## Files Modified

1. **controllers/dashboardController.js**
   - Added `getUserRankInfo()` function
   - Updated `getLeaderboardPosition()`
   - Updated `getUserPoints()`

2. **templates/USER_DASHBOARD.HTML**
   - Updated `loadUserPointsFromAccountPoints()`
   - Rank now displays with badge

3. **USER_RANKING_QUERY.sql** (New)
   - 10 SQL queries for ranking

## How It Works

1. User loads dashboard
2. Frontend calls `/api/dashboard/points`
3. Backend calculates rank using ROW_NUMBER()
4. Frontend displays rank with badge
5. Rank updates when points change

## Testing

### Test Endpoint
```bash
curl "http://localhost:3000/api/dashboard/points?email=student@umak.edu.ph"
```

### Expected Response
```json
{
  "success": true,
  "user": {
    "points": 1247
  },
  "rank": {
    "rank": 42,
    "totalUsers": 1823,
    "percentile": 97,
    "rankBadge": "✨ Top 100",
    "displayText": "#42 of 1,823"
  }
}
```

## Ranking Algorithm

```
1. Get all users from account_points table
2. Sort by points DESC (highest first)
3. Find user's position in sorted list
4. Rank = position + 1
5. Percentile = (total_users - rank + 1) / total_users * 100
6. Assign badge based on rank
```

## Performance

- Uses efficient `ROW_NUMBER()` window function
- Recommended indexes:
  - `account_points(points DESC)`
  - `account_points(email)`
  - `account_points(system_id)`

## Troubleshooting

| Issue | Solution |
|---|---|
| Rank not showing | Check `/api/dashboard/points` endpoint |
| Wrong rank | Verify points in `account_points` table |
| Slow loading | Add indexes on points column |
| Rank badge missing | Check rank value in response |

## Status

✅ **Complete and Ready for Production**

---

**Date:** April 30, 2026
**Version:** 1.0.0
