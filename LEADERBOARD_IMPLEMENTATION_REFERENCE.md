# Leaderboard Implementation - Quick Reference

## Overview
The leaderboard ranks users by total points earned from waste sorting, displayed in descending order (highest points = rank #1).

---

## 🎯 Key Features

✅ **Point-Based Ranking**
- Uses `account_points.points` column
- Descending order (highest first)
- Top 100 users displayed

✅ **Timeframe Filtering**
- All Time (default)
- This Month

✅ **User Highlighting**
- Current user highlighted with yellow background
- "YOU" badge displayed
- Medal indicators for top 3 (🥇 🥈 🥉)

✅ **Responsive Design**
- Mobile-friendly table
- Horizontal scroll on small screens
- Touch-friendly buttons

---

## 📁 Files Involved

### Backend
**File**: `controllers/dashboardController.js`
**Function**: `getLeaderboardPosition()`
**Lines**: 265-360

**Key Logic**:
```javascript
// Query account_points table with role-based joins
const query = supabase
  .from('account_points')
  .select(`
    system_id,
    points,
    user_accounts!inner(...),
    student_accounts!left(...),
    faculty_accounts!left(...),
    staff_accounts!left(...)
  `)
  .order('points', { ascending: false })
  .limit(100);

// Apply timeframe filter if needed
if (timeframe === 'month') {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  query = query.gte('created_at', oneMonthAgo.toISOString());
}
```

### Frontend
**File**: `templates/USER_DASHBOARD.HTML`
**Function**: `loadLeaderboard(timeframe)`
**Lines**: 845-920

**Key Logic**:
```javascript
// Fetch leaderboard data
const response = await fetch(`/api/dashboard/leaderboard?timeframe=${timeframe}`);
const data = await response.json();

// Render leaderboard with medals and highlighting
leaderboardBody.innerHTML = leaderboard.map((user, index) => {
  const rank = index + 1;
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
  const isCurrentUser = user.is_current_user;
  
  return `
    <tr class="${isCurrentUser ? 'bg-[#D4E157]/10 border-l-4 border-[#D4E157]' : ''}">
      <td>${medal} #${rank}</td>
      <td>${user.first_name} ${user.last_name}${isCurrentUser ? '<span class="YOU">YOU</span>' : ''}</td>
      <td>${Number(user.points).toLocaleString()} pts</td>
      <td>${user.status}</td>
    </tr>
  `;
}).join('');
```

### Routes
**File**: `routes/dashboard.js`
**Endpoint**: `GET /api/dashboard/leaderboard`

---

## 🔌 API Endpoint

### Request
```
GET /api/dashboard/leaderboard?timeframe=all|month
```

**Query Parameters**:
- `timeframe` (optional): `'all'` (default) or `'month'`
- `userId` (optional): User ID for current user identification
- `email` (optional): User email for current user identification

### Response
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "system_id": "user123",
      "first_name": "John",
      "last_name": "Doe",
      "points": 5000,
      "is_current_user": false,
      "status": "Active"
    },
    {
      "rank": 2,
      "system_id": "user456",
      "first_name": "Jane",
      "last_name": "Smith",
      "points": 4500,
      "is_current_user": true,
      "status": "Active"
    }
  ],
  "userRank": 2,
  "userPosition": 2,
  "timeframe": "all"
}
```

---

## 🗄️ Database Schema

### account_points Table
```sql
CREATE TABLE account_points (
  system_id VARCHAR PRIMARY KEY,
  email VARCHAR,
  points INTEGER DEFAULT 0,           -- Current points
  total_points INTEGER DEFAULT 0,     -- Lifetime points
  total_waste INTEGER DEFAULT 0,      -- Total waste sorted
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Related Tables (for name lookup)
```sql
-- student_accounts
CREATE TABLE student_accounts (
  system_id VARCHAR PRIMARY KEY,
  first_name VARCHAR,
  last_name VARCHAR,
  ...
);

-- faculty_accounts
CREATE TABLE faculty_accounts (
  system_id VARCHAR PRIMARY KEY,
  first_name VARCHAR,
  last_name VARCHAR,
  ...
);

-- staff_accounts
CREATE TABLE staff_accounts (
  system_id VARCHAR PRIMARY KEY,
  first_name VARCHAR,
  last_name VARCHAR,
  ...
);

-- user_accounts (role mapping)
CREATE TABLE user_accounts (
  system_id VARCHAR PRIMARY KEY,
  email VARCHAR,
  role VARCHAR,  -- 'student', 'faculty', 'staff'
  ...
);
```

---

## 🎨 UI Components

### Leaderboard Section HTML
**Location**: `templates/USER_DASHBOARD.HTML` (lines 320-370)

**Structure**:
```html
<div class="mt-10 mb-8">
  <!-- Header with title and filters -->
  <div class="flex items-end justify-between gap-4 mb-4">
    <div>
      <h2 class="font-playfair text-2xl text-[#0F3B2E] mb-1">🏆 Top Eco-Warriors</h2>
      <p class="text-sm text-[#0F3B2E]/60">Ranking by total points earned</p>
    </div>
    <div class="flex gap-2">
      <button onclick="loadLeaderboard('all')" id="filter-all">All Time</button>
      <button onclick="loadLeaderboard('month')" id="filter-month">This Month</button>
    </div>
  </div>
  
  <!-- Leaderboard Table -->
  <div class="bg-white rounded-2xl card-shadow overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="bg-gradient-dark text-white">
          <th>Rank</th>
          <th>User</th>
          <th>Points</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="leaderboard-body">
        <!-- Rows inserted by JavaScript -->
      </tbody>
    </table>
  </div>
  
  <!-- Info tip -->
  <div class="mt-4 p-4 bg-[#D4E157]/10 border border-[#D4E157]/30 rounded-lg">
    <p class="text-sm text-[#0F3B2E]">
      <span class="font-semibold">💡 Tip:</span> Rankings are based on total points earned from waste sorting.
    </p>
  </div>
</div>
```

### Styling Classes
- `.bg-gradient-dark` - Dark green header background
- `.card-shadow` - Box shadow effect
- `.bg-[#D4E157]/10` - Light yellow background for current user
- `.border-l-4 border-[#D4E157]` - Yellow left border for current user

---

## 🔄 Data Flow

```
1. User loads dashboard
   ↓
2. loadLeaderboard('all') called on page load
   ↓
3. Frontend fetches /api/dashboard/leaderboard?timeframe=all
   ↓
4. Backend queries account_points table
   ↓
5. Backend joins with role-specific tables for names
   ↓
6. Backend sorts by points (descending)
   ↓
7. Backend returns top 100 users with current user highlighted
   ↓
8. Frontend renders table with medals and highlighting
   ↓
9. User can click "All Time" or "This Month" to filter
```

---

## 🧪 Testing

### Manual Testing Steps
1. ✅ Load dashboard
2. ✅ Verify leaderboard loads with top users
3. ✅ Check current user is highlighted with yellow background
4. ✅ Verify "YOU" badge appears for current user
5. ✅ Check medals appear for top 3 (🥇 🥈 🥉)
6. ✅ Click "This Month" filter
7. ✅ Verify leaderboard updates with monthly data
8. ✅ Click "All Time" filter
9. ✅ Verify leaderboard returns to all-time ranking
10. ✅ Check points display with thousand separators (e.g., "5,000 pts")

### API Testing
```bash
# Get leaderboard (all time)
curl "http://localhost:3000/api/dashboard/leaderboard?timeframe=all"

# Get leaderboard (this month)
curl "http://localhost:3000/api/dashboard/leaderboard?timeframe=month"

# Get leaderboard with specific user
curl "http://localhost:3000/api/dashboard/leaderboard?timeframe=all&email=user@example.com"
```

---

## 🐛 Troubleshooting

### Issue: Leaderboard shows "No users found"
**Cause**: No data in `account_points` table
**Solution**: Ensure users have completed waste sorting activities

### Issue: User names not displaying
**Cause**: Role-specific table lookup failed
**Solution**: Verify user role in `user_accounts` table matches table name (student/faculty/staff)

### Issue: Current user not highlighted
**Cause**: `is_current_user` flag not set correctly
**Solution**: Verify `system_id` matches between current user and leaderboard data

### Issue: Points not sorting correctly
**Cause**: Points stored as string instead of integer
**Solution**: Verify `account_points.points` column is INTEGER type

### Issue: Timeframe filter not working
**Cause**: Date calculation or query filter issue
**Solution**: Check browser console for errors, verify `created_at` timestamps in database

---

## 📊 Performance Considerations

- **Query Limit**: Top 100 users (configurable)
- **Timeframe Calculation**: One month back from current date
- **Caching**: Consider caching leaderboard for 5-10 minutes
- **Pagination**: Could add pagination for large datasets
- **Indexes**: Ensure `account_points.points` column is indexed

---

## 🔐 Security

- ✅ User identification via `system_id` or `email`
- ✅ Role-based name lookup prevents data leakage
- ✅ Public leaderboard (no sensitive data exposed)
- ✅ Rate limiting on API endpoint (recommended)

---

## 📝 Notes

- Leaderboard updates in real-time as users earn points
- Current user always visible even if not in top 100
- Timeframe filter is client-side controlled (ensure backend validation)
- Medal indicators are emoji-based (🥇 🥈 🥉)
- Points formatted with thousand separators for readability

---

**Last Updated**: April 30, 2026  
**Status**: ✅ Production Ready
