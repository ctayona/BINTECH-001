# ⚡ Admin Dashboard Controller - Quick Reference

## File Location
`controllers/adminDashboardController.js`

## Status
✅ Complete and Production Ready

---

## API Endpoints

### Get Admin Stats
```bash
GET /api/admin/stats?email=admin@example.com
GET /api/admin/stats?adminId=uuid
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "adminPosition": 1,
    "totalAdmins": 5,
    "status": "Active"
  }
}
```

---

### Get Admin Profile
```bash
GET /api/admin/profile?email=admin@example.com
```

**Response:**
```json
{
  "success": true,
  "admin": { ... },
  "rank": {
    "rank": 1,
    "totalAdmins": 5,
    "displayText": "#1 of 5"
  }
}
```

---

### Get All Active Admins
```bash
GET /api/admin/all-active
```

**Response:**
```json
{
  "success": true,
  "admins": [
    {
      "full_name": "John Doe",
      "rank": 1,
      "displayText": "#1 of 5"
    }
  ],
  "totalAdmins": 5
}
```

---

### Get Archived Admins
```bash
GET /api/admin/archived
```

**Response:**
```json
{
  "success": true,
  "archivedAdmins": [ ... ],
  "totalArchived": 1
}
```

---

### Archive Admin
```bash
POST /api/admin/archive
Content-Type: application/json

{
  "adminIdToArchive": "uuid",
  "archiveReason": "Left the organization",
  "archivedByEmail": "admin@example.com"
}
```

---

### Restore Admin
```bash
POST /api/admin/restore
Content-Type: application/json

{
  "adminIdToRestore": "uuid",
  "restoredByEmail": "admin@example.com"
}
```

---

### Update Admin Profile
```bash
POST /api/admin/profile/update
Content-Type: application/json

{
  "adminId": "uuid",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

---

## Key Functions

### resolveAdminAccount(adminId, email)
Find admin by ID or email

### getAdminRankInfo(adminId, email)
Calculate admin rank based on creation date

### getAdminProfile(req, res)
Get complete admin profile with rank

### getAllActiveAdmins(req, res)
Get all active admins with ranks

### archiveAdminAccount(req, res)
Archive an admin account

### restoreAdminAccount(req, res)
Restore an archived admin

### updateAdminProfile(req, res)
Update admin profile information

---

## Admin Ranking

**Basis:** Creation date (first admin = rank 1)

**Example:**
```
Admin 1 (2024-01-01) → Rank #1 of 5
Admin 2 (2024-01-02) → Rank #2 of 5
Admin 3 (2024-01-03) → Rank #3 of 5
```

**Percentile:** Position relative to all active admins

---

## Database Table

**Table:** `admin_accounts`

**Key Fields:**
- `id` - UUID primary key
- `email` - Unique email
- `full_name` - Admin full name
- `role` - 'admin' or 'head'
- `is_archived` - Boolean flag
- `archived_at` - Archive timestamp
- `created_at` - Creation timestamp

---

## Error Responses

**Admin Not Found:**
```json
{ "success": false, "message": "Admin account not found" }
```

**Admin Archived:**
```json
{ "success": false, "message": "This admin account has been archived" }
```

**Missing Parameters:**
```json
{ "success": false, "message": "Admin ID or email is required" }
```

---

## Usage Example

```javascript
// Get admin profile with rank
const response = await fetch('/api/admin/profile?email=admin@example.com');
const data = await response.json();

if (data.success) {
  console.log(`Admin: ${data.admin.fullName}`);
  console.log(`Rank: ${data.rank.displayText}`);
  console.log(`Status: ${data.admin.isArchived ? 'Archived' : 'Active'}`);
}
```

---

## Integration Steps

1. **Import Controller:**
```javascript
const adminDashboardController = require('./controllers/adminDashboardController');
```

2. **Add Routes:**
```javascript
app.get('/api/admin/stats', adminDashboardController.getAdminStats);
app.get('/api/admin/profile', adminDashboardController.getAdminProfile);
app.get('/api/admin/all-active', adminDashboardController.getAllActiveAdmins);
app.get('/api/admin/archived', adminDashboardController.getArchivedAdmins);
app.post('/api/admin/archive', adminDashboardController.archiveAdminAccount);
app.post('/api/admin/restore', adminDashboardController.restoreAdminAccount);
app.post('/api/admin/profile/update', adminDashboardController.updateAdminProfile);
```

3. **Use in Frontend:**
```javascript
// Fetch admin data
const admin = await fetch('/api/admin/profile?email=admin@example.com');
const data = await admin.json();

// Display rank
document.getElementById('rank').textContent = data.rank.displayText;
```

---

## Performance

- ✅ Indexed queries on `is_archived` and `archived_at`
- ✅ Efficient admin lookup by ID or email
- ✅ Fast ranking calculation
- ✅ No N+1 query problems

---

## Security

- ✅ Input validation on all endpoints
- ✅ Email verification for archive operations
- ✅ Archived admin access prevention
- ✅ Proper error handling

---

## Status

✅ **Production Ready**

- All functions implemented
- Error handling included
- Database integration verified
- API endpoints documented
- Ready for deployment

---

**Version:** 1.0.0  
**Last Updated:** May 5, 2026
