# Analytics Metrics - Quick Reference

## Metrics Overview

| Metric | Source | Calculation | Endpoint |
|--------|--------|-------------|----------|
| **Total Waste Sorted** | machine_sessions | SUM(metal + plastic + paper) | /api/admin/analytics |
| **Total Points Generated** | machine_sessions | SUM(total_points) | /api/admin/analytics |
| **Active Users** | user_accounts | COUNT(status='active') | /api/admin/analytics |
| **Rewards Redeemed** | redemptions | SUM(quantity, status='completed') | /api/admin/analytics |

## API Endpoints

### Dashboard Summary (Real-time)
```bash
GET /api/admin/summary
```
Returns all dashboard metrics including:
- systemStatistics.activeUsers
- systemStatistics.totalRewardsRedeemed
- totalWasteSorted

### Analytics (Date Range)
```bash
GET /api/admin/analytics?dateFrom=2026-04-03&dateTo=2026-05-03
```
Returns analytics for specific date range:
- totalWasteSorted
- totalPointsGenerated
- activeUsers
- rewardsRedeemed

## Database Queries

### Total Waste Sorted
```sql
SELECT SUM(metal_count + plastic_count + paper_count) 
FROM machine_sessions 
WHERE started_at BETWEEN dateFrom AND dateTo;
```

### Total Points Generated
```sql
SELECT SUM(total_points) 
FROM machine_sessions 
WHERE started_at BETWEEN dateFrom AND dateTo;
```

### Active Users
```sql
SELECT COUNT(system_id) 
FROM user_accounts 
WHERE status = 'active';
```

### Rewards Redeemed
```sql
SELECT SUM(quantity) 
FROM redemptions 
WHERE status = 'completed' 
  AND completed_at BETWEEN dateFrom AND dateTo;
```

## Frontend Integration

### Load Analytics Data
```javascript
async function loadAnalyticsData(dateFrom, dateTo) {
  const response = await fetch(`/api/admin/analytics?dateFrom=${dateFrom}&dateTo=${dateTo}`);
  const result = await response.json();
  
  if (result.success) {
    document.getElementById('metricWasteSorted').textContent = result.analytics.totalWasteSorted;
    document.getElementById('metricPointsGenerated').textContent = result.analytics.totalPointsGenerated;
    document.getElementById('metricActiveUsers').textContent = result.analytics.activeUsers;
    document.getElementById('metricRewardsRedeemed').textContent = result.analytics.rewardsRedeemed;
  }
}
```

## Files Modified
- `controllers/adminController.js` (getDashboardSummary + getAnalytics)
- `routes/admin.js` (added /analytics route)

## Testing

### Test Dashboard Summary
```bash
curl http://localhost:3000/api/admin/summary | jq '.summary.systemStatistics'
```

### Test Analytics
```bash
curl "http://localhost:3000/api/admin/analytics?dateFrom=2026-04-03&dateTo=2026-05-03" | jq '.analytics'
```

## Example Response

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
    },
    "timestamp": "2026-05-03T10:30:00Z"
  }
}
```

## Status
✅ Complete - All metrics properly implemented
