# Timestamp Implementation Guide

## Quick Reference

### Format
**MM/DD/YYYY | hh:mm AM/PM**

Examples:
- `04/30/2026 | 02:45 PM`
- `01/05/2026 | 09:30 AM`
- `12/31/2026 | 11:59 PM`
- `04/30/2026 | 12:00 AM`

---

## Where Timestamps Appear

### 1. User Accounts Table
**Location:** Admin Dashboard → Account Management → Users Tab

**Columns:**
- **Created:** Shows when account was created
- **Updated:** Shows when account was last modified

**Example:**
```
Email                          | Campus ID | Role    | Points | Created              | Updated              | Actions
user@example.com              | 12345     | student | 150    | 04/30/2026 | 02:45 PM | 04/30/2026 | 03:15 PM | View Edit Points Delete
```

### 2. Admin Accounts Table
**Location:** Admin Dashboard → Account Management → Admins Tab

**Columns:**
- **Created:** Shows when admin account was created
- **Updated:** Shows when admin account was last modified

**Example:**
```
Full Name    | Email              | Role  | Phone        | Created              | Updated              | Actions
John Doe     | admin@example.com  | admin | 555-1234     | 04/30/2026 | 02:45 PM | 04/30/2026 | 03:15 PM | View Edit Archive
```

### 3. View Account Modal
**Location:** Click "View" button on any account row

**Timestamps Section:**
```
Timestamps
Created: 04/30/2026 | 02:45 PM
Updated: 04/30/2026 | 03:15 PM
System ID: 550e8400-e29b-41d4-a716-446655440000
```

---

## How Timestamps Work

### Automatic Management
Timestamps are **automatically managed by the database**. You don't need to do anything special.

**When Creating an Account:**
- `created_at` is automatically set to the current date and time
- `updated_at` is automatically set to the current date and time

**When Updating an Account:**
- `created_at` remains unchanged (never modified)
- `updated_at` is automatically updated to the current date and time

### Read-Only in UI
Timestamps are **read-only** in all modals:
- ✅ View Modal: Timestamps displayed as read-only text
- ✅ Edit Modal: No timestamp fields present
- ✅ Add Modal: No timestamp fields present

You cannot manually edit timestamps from the UI. They are always managed by the database.

---

## Technical Details

### Function: `formatDateForDisplay()`
**File:** `public/js/timestampUtils.js`

**Purpose:** Converts database timestamps to readable format

**Input:**
- ISO timestamp: `2026-04-30T14:45:30Z`
- Date-only: `2026-04-30`
- Null/undefined: Returns "—"

**Output:**
- Formatted: `04/30/2026 | 02:45 PM`
- Invalid: `—`

**Features:**
- Converts UTC to local time
- Pads single-digit months/days with zeros
- Converts 24-hour to 12-hour AM/PM format
- Handles timezone differences automatically

### Function: `formatDate()`
**File:** `templates/ADMIN_ACCOUNTS.html`

**Purpose:** Wrapper function for frontend use

**Code:**
```javascript
function formatDate(value) {
  if (!value) return '—';
  return timestampUtils.formatDateForDisplay(value) || '—';
}
```

**Usage:**
```html
<td>${formatDate(account.created_at)}</td>
<td>${formatDate(account.updated_at)}</td>
```

---

## Database Schema

### User Accounts Table
```sql
CREATE TABLE user_accounts (
  ...
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  ...
);

-- Trigger to auto-update updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON user_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Admin Accounts Table
```sql
CREATE TABLE admin_accounts (
  ...
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  ...
);

-- Trigger to auto-update updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON admin_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Testing

### Run Tests
```bash
npm test -- public/js/timestampUtils.test.js
```

### Test Coverage
- ✅ ISO timestamp formatting
- ✅ Date-only formatting
- ✅ Null/undefined handling
- ✅ Invalid date handling
- ✅ Timezone conversion
- ✅ Format validation
- ✅ Edge cases (midnight, noon, etc.)

### Expected Output
```
PASS  public/js/timestampUtils.test.js
  ✓ 10 tests passing
  ✓ 0 tests failing
```

---

## Troubleshooting

### Timestamps Show "—"
**Cause:** Null or invalid timestamp value

**Solution:** Check database for null values in `created_at` or `updated_at` columns

### Timestamps Show Wrong Time
**Cause:** Timezone difference between server and browser

**Solution:** The function automatically converts UTC to local time. Check browser timezone settings.

### Timestamps Not Updating
**Cause:** Database trigger not working

**Solution:** Verify `set_updated_at()` trigger exists and is enabled on the table

### Format Doesn't Match
**Cause:** Old version of `timestampUtils.js` cached

**Solution:** Clear browser cache and reload the page

---

## Format Specification

### Date Component: MM/DD/YYYY
- **MM:** Two-digit month (01-12)
- **DD:** Two-digit day (01-31)
- **YYYY:** Four-digit year

Examples:
- January 5, 2026 → `01/05/2026`
- December 31, 2026 → `12/31/2026`
- April 30, 2026 → `04/30/2026`

### Time Component: hh:mm AM/PM
- **hh:** Two-digit hour (01-12)
- **mm:** Two-digit minute (00-59)
- **AM/PM:** Meridiem indicator

Examples:
- 9:30 AM → `09:30 AM`
- 2:45 PM → `02:45 PM`
- 12:00 AM (midnight) → `12:00 AM`
- 12:00 PM (noon) → `12:00 PM`

### Separator: |
- Pipe character with spaces: ` | `
- Separates date and time components

### Complete Format
```
MM/DD/YYYY | hh:mm AM/PM
04/30/2026 | 02:45 PM
```

---

## Implementation Checklist

- ✅ `formatDateForDisplay()` function updated
- ✅ Format: MM/DD/YYYY | hh:mm AM/PM
- ✅ User Accounts table displays timestamps
- ✅ Admin Accounts table displays timestamps
- ✅ View modal displays timestamps (read-only)
- ✅ Edit modal has no timestamp fields
- ✅ Add modal has no timestamp fields
- ✅ Database manages timestamps automatically
- ✅ Tests verify correct formatting
- ✅ No syntax errors
- ✅ No breaking changes

---

## Support

For issues or questions about timestamp formatting:

1. Check the test file: `public/js/timestampUtils.test.js`
2. Review the function: `public/js/timestampUtils.js`
3. Check database triggers: Verify `set_updated_at()` trigger exists
4. Clear browser cache and reload

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-30 | Initial implementation - MM/DD/YYYY \| hh:mm AM/PM format |

---

## Related Documentation

- `TASK_7_COMPLETION_REPORT.md` - Detailed completion report
- `TIMESTAMP_FORMAT_UPDATE.md` - Technical update summary
- `public/js/timestampUtils.js` - Source code
- `public/js/timestampUtils.test.js` - Test suite
