# Weekly Trends - Date Format Examples

## Before vs After

### BEFORE (Generic Week Labels):
```
WEEKLY WASTE SORTING TRENDS
Week,Metal,Plastic,Paper,Total
Week4,400,300,150,850
Week3,420,320,160,900
Week2,380,280,140,800
Week1,350,300,150,800
```

### AFTER (Actual Dates):
```
WEEKLY WASTE SORTING TRENDS
Week,Metal,Plastic,Paper,Total
Apr 27 - May 3,400,300,150,850
Apr 20 - Apr 26,420,320,160,900
Apr 13 - Apr 19,380,280,140,800
Apr 6 - Apr 12,350,300,150,800
```

---

## Chart Display

### Before:
```
Waste Sorting Trends Chart
┌─────────────────────────────────────────┐
│                                         │
│  900 ┤                    ╱╲            │
│  850 ┤        ╱╲         ╱  ╲           │
│  800 ┤       ╱  ╲       ╱    ╲          │
│  750 ┤      ╱    ╲     ╱      ╲         │
│      └─────────────────────────────────┘
│      Week4  Week3  Week2  Week1         │
└─────────────────────────────────────────┘
```

### After:
```
Waste Sorting Trends Chart
┌─────────────────────────────────────────┐
│                                         │
│  900 ┤                    ╱╲            │
│  850 ┤        ╱╲         ╱  ╲           │
│  800 ┤       ╱  ╲       ╱    ╲          │
│  750 ┤      ╱    ╲     ╱      ╲         │
│      └─────────────────────────────────┘
│  Apr27-  Apr20-  Apr13-  Apr6-          │
│  May3    Apr26   Apr19   Apr12          │
└─────────────────────────────────────────┘
```

---

## CSV Export Example

### Complete Weekly Trends Section:

```
WEEKLY PERFORMANCE TRENDS
─────────────────────────────────────────────────────────────────────────────────
Overview
Weekly trend analysis reveals patterns in waste segregation activity over the
reporting period. This data helps identify peak usage periods, seasonal variations,
and opportunities for system optimization and targeted user engagement initiatives.

Week,Metal,Plastic,Paper,Total,Weekly Average
Apr 27 - May 3,400,300,150,850,283.33
Apr 20 - Apr 26,420,320,160,900,300.00
Apr 13 - Apr 19,380,280,140,800,266.67
Apr 6 - Apr 12,350,300,150,800,283.33

Trend Analysis
Average Weekly Waste: 812.50 items
Peak Week: Apr 20 - Apr 26 with 900 items
Lowest Week: Apr 6 - Apr 12 with 800 items
Total Weekly Waste: 3250 items
```

---

## Real-World Examples

### Example 1: May 2026
```
Current Date: May 3, 2026

Week 0 (Most Recent):
- Start: May 3 - 6 = Apr 27
- End: May 3
- Label: "Apr 27 - May 3"

Week 1:
- Start: Apr 27 - 6 = Apr 21
- End: Apr 27
- Label: "Apr 21 - Apr 27"

Week 2:
- Start: Apr 21 - 6 = Apr 15
- End: Apr 21
- Label: "Apr 15 - Apr 21"

Week 3:
- Start: Apr 15 - 6 = Apr 9
- End: Apr 15
- Label: "Apr 9 - Apr 15"
```

### Example 2: December 2026
```
Current Date: Dec 15, 2026

Week 0 (Most Recent):
- Label: "Dec 9 - Dec 15"

Week 1:
- Label: "Dec 2 - Dec 8"

Week 2:
- Label: "Nov 25 - Dec 1"

Week 3:
- Label: "Nov 18 - Nov 24"
```

### Example 3: January 2027
```
Current Date: Jan 20, 2027

Week 0 (Most Recent):
- Label: "Jan 14 - Jan 20"

Week 1:
- Label: "Jan 7 - Jan 13"

Week 2:
- Label: "Dec 31 - Jan 6"

Week 3:
- Label: "Dec 24 - Dec 30"
```

---

## Benefits of Date Format

### ✅ Clarity
- Exact dates are clear and unambiguous
- No confusion about which week is which
- Easy to correlate with calendar events

### ✅ Context
- Can relate to specific events or campaigns
- Understand seasonal patterns
- Identify anomalies with specific dates

### ✅ Professional
- Looks more polished in reports
- Suitable for executive presentation
- Better for stakeholder communication

### ✅ Accuracy
- Dynamically calculated based on current date
- Always shows correct date ranges
- No manual updates needed

### ✅ Consistency
- Same format across all exports
- Works in CSV, PDF, and Excel
- Consistent with other date displays

---

## How Dates Are Calculated

### Algorithm:
```
For each week (0, 1, 2, 3):
  weekStart = today - (week * 7 + 6) days
  weekEnd = today - (week * 7) days
  label = format(weekStart) + " - " + format(weekEnd)
```

### Example Calculation (May 3, 2026):
```
Week 0:
  weekStart = May 3 - (0 * 7 + 6) = May 3 - 6 = Apr 27
  weekEnd = May 3 - (0 * 7) = May 3
  label = "Apr 27 - May 3"

Week 1:
  weekStart = May 3 - (1 * 7 + 6) = May 3 - 13 = Apr 20
  weekEnd = May 3 - (1 * 7) = May 3 - 7 = Apr 26
  label = "Apr 20 - Apr 26"

Week 2:
  weekStart = May 3 - (2 * 7 + 6) = May 3 - 20 = Apr 13
  weekEnd = May 3 - (2 * 7) = May 3 - 14 = Apr 19
  label = "Apr 13 - Apr 19"

Week 3:
  weekStart = May 3 - (3 * 7 + 6) = May 3 - 27 = Apr 6
  weekEnd = May 3 - (3 * 7) = May 3 - 21 = Apr 12
  label = "Apr 6 - Apr 12"
```

---

## Date Format Details

### Format String:
```javascript
toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
```

### Output Examples:
- "Jan 1" (January 1st)
- "Feb 14" (February 14th)
- "Mar 31" (March 31st)
- "Apr 27" (April 27th)
- "May 3" (May 3rd)
- "Dec 25" (December 25th)

### Format Pattern:
- Month: 3-letter abbreviation (Jan, Feb, Mar, etc.)
- Day: Numeric without leading zero (1, 2, 3, etc.)
- Separator: " - " (space, dash, space)

---

## Testing

### To Verify the Change:

1. **In Charts:**
   - Go to `/admin/analytics`
   - Select date range and click "Apply Filter"
   - Look at chart x-axis labels
   - Should show date ranges like "Apr 27 - May 3"

2. **In CSV Export:**
   - Click "Export as CSV"
   - Open file in text editor
   - Find "WEEKLY PERFORMANCE TRENDS" section
   - Should show dates instead of "Week 1, 2, 3, 4"

3. **In PDF Export:**
   - Click "Export as PDF"
   - Open PDF file
   - Find "Weekly Performance Trends" section
   - Should show dates in the table

4. **In Excel Export:**
   - Click "Export as Excel"
   - Open Excel file
   - Go to "Weekly Trends" sheet
   - Should show dates in first column

---

## Status: ✅ COMPLETE

Weekly Performance Trends now displays actual dates instead of generic week labels, making reports more informative and professional.

**Date Format**: "MMM DD - MMM DD" (e.g., "Apr 27 - May 3")
**Automatic**: Dynamically calculated based on current date
**Consistent**: Works across all exports and charts
