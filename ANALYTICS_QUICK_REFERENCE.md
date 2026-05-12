# Analytics Page - Quick Reference

## Access the Analytics Page
- **URL**: `http://localhost:3000/admin/analytics`
- **Navigation**: Click "Analytics" in the admin sidebar (replaces "Collections")
- **Requirements**: Admin or Head role

## Features at a Glance

### 📊 Key Metrics
- Total Waste Sorted (kg)
- Total Points Generated (EcoPoints)
- Active Users
- Rewards Redeemed

### 📅 Date Range Filter
- Default: Last 30 days
- Customizable: Select "From Date" and "To Date"
- Click "Apply Filter" to update data

### 📈 Charts (Placeholders)
- Waste Sorting Trends
- Material Distribution
- User Activity
- Rewards Distribution

### 💾 Export Options
- **CSV Export**: Download as comma-separated values
- **PDF Export**: Download as formatted PDF report
- **Excel Export**: Download as Excel spreadsheet

## File Locations
- Frontend: `templates/ADMIN_ANALYTICS.html`
- Route: `app.js` (line ~70)
- Navigation: `templates/ADMIN_DASHBOARD.html` (sidebar)

## Styling
- Color Scheme: Forest green (#1a3a2f) + Teal (#3d8b7a)
- Font: Plus Jakarta Sans
- Framework: Tailwind CSS v3.4.17
- Responsive: Mobile, Tablet, Desktop

## Backend Integration
When ready to add real data:

1. Create endpoint: `GET /api/admin/analytics`
2. Create endpoint: `GET /api/admin/export-report`
3. Update JavaScript functions in ADMIN_ANALYTICS.html:
   - `loadAnalyticsData()` - fetches metrics
   - `exportReport()` - generates exports

## Admin Protection
- Checks user role (admin/head)
- Redirects unauthorized users to home page
- Displays admin name and initials in profile card

## Current Status
✅ Frontend complete and ready
⏳ Backend endpoints pending
⏳ Chart visualizations pending
⏳ Export functionality pending

## Quick Customization
- Change colors: Edit Tailwind config in `<script>` tag
- Add metrics: Add new cards in metrics grid
- Modify date range: Edit `initializeDateFilters()` function
- Update sidebar: Edit navigation links in sidebar section
