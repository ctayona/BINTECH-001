# Export Functions - Testing Guide

## ✅ Quick Test Steps

### Step 1: Navigate to Analytics Page
```
URL: http://localhost:3000/admin/analytics
```

### Step 2: Select Date Range
```
From Date: [Select any date]
To Date: [Select a date after the From date]
```

### Step 3: Click "Apply Filter"
```
Button: "Apply Filter"
Expected: Data loads, charts appear, metrics display
```

### Step 4: Check Browser Console
```
Open: Developer Tools (F12)
Go to: Console tab
Look for: "✓ Analytics data loaded:" message
This confirms currentAnalyticsData has all the data
```

### Step 5: Test CSV Export
```
Button: "Export as CSV"
Expected: File downloads as "BinTECH_Analytics_[dateFrom]_to_[dateTo].csv"
Content: Should include:
  - Report header
  - Key metrics
  - Waste breakdown table
  - User distribution table
  - Rewards distribution table
  - Weekly trends table
  - Report metadata
```

### Step 6: Test PDF Export
```
Button: "Export as PDF"
Expected: File downloads as "BinTECH_Analytics_[dateFrom]_to_[dateTo].pdf"
Content: Should include:
  - Professional styled tables
  - Color-coded sections
  - All data from CSV
  - Print-ready quality
```

### Step 7: Test Excel Export
```
Button: "Export as Excel"
Expected: File downloads as "BinTECH_Analytics_[dateFrom]_to_[dateTo].xlsx"
Content: Should include 5 sheets:
  1. Summary - Report info and key metrics
  2. Waste Breakdown - Material distribution
  3. User Distribution - Users by role
  4. Rewards Distribution - Redemptions by status
  5. Weekly Trends - 4 weeks of data
```

---

## 🔍 Troubleshooting

### Issue: Export buttons don't work
**Solution**: 
1. Check browser console for errors
2. Make sure data is loaded (check for "✓ Analytics data loaded" message)
3. Verify date range is selected
4. Click "Apply Filter" first

### Issue: Export file is empty
**Solution**:
1. Check that data loaded successfully
2. Verify `currentAnalyticsData` has data in console
3. Check that helper functions are defined (calculateMaterialTotals, etc.)

### Issue: Export file has no data tables
**Solution**:
1. Verify sessionData, userData, redemptionData are populated
2. Check that the analytics endpoints are returning data
3. Verify the helper functions are calculating correctly

### Issue: PDF export doesn't work
**Solution**:
1. Check that html2pdf.js library is loaded
2. Verify browser supports PDF generation
3. Check browser console for errors

### Issue: Excel export doesn't work
**Solution**:
1. Check that XLSX.js library is loaded
2. Verify browser supports Excel generation
3. Check browser console for errors

---

## 📊 Expected Data in Exports

### CSV Export Should Include:
```
REPORT HEADER
- Report Title
- Report Period
- Generated Date
- Confidentiality

KEY METRICS SUMMARY
- Total Waste Sorted: [number]
- Active Users: [number]
- Rewards Redeemed: [number]

WASTE BREAKDOWN BY MATERIAL TYPE
- Metal: [count] [percentage]
- Plastic: [count] [percentage]
- Paper: [count] [percentage]
- Total: [count] 100%

USER DISTRIBUTION BY ROLE
- Student: [count] [percentage]
- Faculty: [count] [percentage]
- Staff: [count] [percentage]
- Total: [count] 100%

REWARDS DISTRIBUTION BY STATUS
- Completed: [count] [percentage]
- Pending: [count] [percentage]
- Cancelled: [count] [percentage]
- Total: [count] 100%

WEEKLY WASTE SORTING TRENDS
- Week 4: Metal [n], Plastic [n], Paper [n], Total [n]
- Week 3: Metal [n], Plastic [n], Paper [n], Total [n]
- Week 2: Metal [n], Plastic [n], Paper [n], Total [n]
- Week 1: Metal [n], Plastic [n], Paper [n], Total [n]

REPORT METADATA
- Data Source: BinTECH Database
- Report Format: CSV
- Organization: University of Makati
```

### PDF Export Should Include:
- All CSV data with professional styling
- Color-coded tables
- Gradient backgrounds
- Professional typography
- Print-ready quality

### Excel Export Should Include:
- Sheet 1: Summary (report info + key metrics)
- Sheet 2: Waste Breakdown (material distribution)
- Sheet 3: User Distribution (users by role)
- Sheet 4: Rewards Distribution (redemptions by status)
- Sheet 5: Weekly Trends (4 weeks of data)

---

## ✅ Success Criteria

Export is working correctly when:
- ✅ File downloads automatically
- ✅ File has correct name format
- ✅ File contains all expected data
- ✅ Tables are properly formatted
- ✅ Percentages are calculated correctly
- ✅ No errors in browser console
- ✅ Data matches what's displayed on page

---

## 🐛 Debug Commands

### Check if currentAnalyticsData exists:
```javascript
console.log(currentAnalyticsData);
```

### Check if helper functions exist:
```javascript
console.log(typeof calculateMaterialTotals);
console.log(typeof calculateUsersByRole);
console.log(typeof calculateRewardTotals);
console.log(typeof calculateWeeklyTotals);
```

### Check if export functions exist:
```javascript
console.log(typeof exportAsCSV);
console.log(typeof exportAsPDF);
console.log(typeof exportAsExcel);
```

### Manually trigger export:
```javascript
exportAsCSV('2026-05-01', '2026-05-31');
exportAsPDF('2026-05-01', '2026-05-31');
exportAsExcel('2026-05-01', '2026-05-31');
```

---

## 📝 Test Checklist

- [ ] CSV export downloads
- [ ] CSV file has correct name
- [ ] CSV file contains all sections
- [ ] CSV file has waste breakdown table
- [ ] CSV file has user distribution table
- [ ] CSV file has rewards distribution table
- [ ] CSV file has weekly trends table
- [ ] PDF export downloads
- [ ] PDF file has correct name
- [ ] PDF file has professional styling
- [ ] PDF file contains all data
- [ ] Excel export downloads
- [ ] Excel file has correct name
- [ ] Excel file has 5 sheets
- [ ] Excel sheets have correct data
- [ ] All percentages are correct
- [ ] All totals equal 100%
- [ ] No errors in console

---

## 🎯 Expected Behavior

### When you click "Export as CSV":
1. Browser console shows: "Exporting report as CSV..."
2. File downloads automatically
3. Filename: `BinTECH_Analytics_[dateFrom]_to_[dateTo].csv`
4. File opens in text editor or Excel
5. Contains all report sections and data

### When you click "Export as PDF":
1. Browser console shows: "Exporting report as PDF..."
2. File downloads automatically
3. Filename: `BinTECH_Analytics_[dateFrom]_to_[dateTo].pdf`
4. File opens in PDF reader
5. Contains professional styled tables and data

### When you click "Export as Excel":
1. Browser console shows: "Exporting report as Excel..."
2. File downloads automatically
3. Filename: `BinTECH_Analytics_[dateFrom]_to_[dateTo].xlsx`
4. File opens in Excel
5. Contains 5 sheets with organized data

---

**Status**: ✅ Ready for Testing

All export functions are now fixed and should work correctly. Follow these steps to verify everything is working as expected.
