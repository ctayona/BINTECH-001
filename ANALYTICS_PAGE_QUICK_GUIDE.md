# Analytics Page - Quick Guide

## Access
- **URL**: `http://localhost:3000/admin/analytics`
- **Requirements**: Admin or Head role
- **Navigation**: Click "Analytics" in admin sidebar

## Features

### 📊 Charts (4 Total)
1. **Waste Sorting Trends** - Line chart showing metal, plastic, paper over time
2. **Material Distribution** - Doughnut chart showing percentage breakdown
3. **User Activity** - Bar chart showing daily active users
4. **Rewards Distribution** - Pie chart showing reward types

### 📅 Date Filtering
- Default: Last 30 days
- Custom: Select From Date and To Date
- Click "Apply Filter" to reload data

### 📈 Key Metrics
- Total Waste Sorted (items)
- Total Points Generated (EcoPoints)
- Active Users (users)
- Rewards Redeemed (items)

### 💾 Export Options
- **CSV**: Comma-separated values (spreadsheet)
- **PDF**: Professional formatted report
- **Excel**: Excel workbook (.xlsx)

## How to Use

### View Analytics
1. Go to `/admin/analytics`
2. Page loads with last 30 days of data
3. Charts and metrics display automatically

### Change Date Range
1. Click "From Date" input
2. Select start date
3. Click "To Date" input
4. Select end date
5. Click "Apply Filter"
6. Data reloads for new date range

### Export Report
1. Select date range (or use default)
2. Click one of the export buttons:
   - "Export as CSV" → Downloads CSV file
   - "Export as PDF" → Downloads PDF file
   - "Export as Excel" → Downloads Excel file
3. File downloads automatically

## File Downloads

### CSV Format
```
BinTECH_Analytics_2026-04-03_to_2026-05-03.csv
```
Contains:
- Report header
- Date range
- Metrics table

### PDF Format
```
BinTECH_Analytics_2026-04-03_to_2026-05-03.pdf
```
Contains:
- Professional header
- Formatted metrics table
- Date range and timestamp

### Excel Format
```
BinTECH_Analytics_2026-04-03_to_2026-05-03.xlsx
```
Contains:
- Report header
- Metrics table
- Optimized column widths

## Metrics Explained

| Metric | Source | Meaning |
|--------|--------|---------|
| Total Waste Sorted | machine_sessions | Sum of all material items sorted |
| Total Points Generated | machine_sessions | Sum of all points earned |
| Active Users | user_accounts | Count of users with status='active' |
| Rewards Redeemed | redemptions | Sum of reward quantities redeemed |

## Troubleshooting

### Charts Not Showing
- Check browser console for errors
- Verify API endpoint is working
- Ensure date range is valid

### Export Not Working
- Check browser download settings
- Verify date range is selected
- Try different export format

### Data Not Loading
- Check network connection
- Verify admin authentication
- Check API response in browser console

## Browser Support
- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## Tips
- Use CSV for data analysis in Excel/Sheets
- Use PDF for sharing reports
- Use Excel for detailed data manipulation
- Default 30-day range is good for monthly reviews
- Charts update automatically when data changes

## Status
✅ Fully functional and ready to use
