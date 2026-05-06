# 📋 Admin Dashboard Controller Guide

## Overview

The `adminDashboardController.js` provides comprehensive admin account management based on the `admin_accounts` table schema.

**File:** `controllers/adminDashboardController.js`  
**Status:** ✅ Complete  
**Database Table:** `admin_accounts`

---

## Table Schema

```sql
CREATE TABLE public.admin_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NULL,
  role text NOT NULL DEFAULT 'admin'::text,
  phone text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  First_Name character varying NULL,
  Middle_Name character varying NULL,
  Last_Name character varying NULL,
  Google_ID text NULL,
  password text NOT NULL,
  auth_id uuid NULL,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamp with time zone NULL,
  archived_by_email text NULL,
  archive_reason text NULL,
  Profile_Picture text NULL,
  profile_picture text NULL,
  
  CONSTRAINT admin_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT admin_accounts_email_key UNIQUE (email),
  CONSTRAINT admin_accounts_google_id_key UNIQUE ("Google_ID"),
  CONSTRAINT admin_accounts_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'head'::text])))
);
```

---

## Functions

### 1. `resolveAdminAccount(adminId, email)`

**Purpose:** Find admin account by ID or email

**Parameters:**
- `adminId` (string, optional) - Admin UUID
- `email` (string, optional) - Admin email address

**Returns:**
```javascript
{
  id: "uuid",
  email: "admin@example.com",
  full_name: "John Doe",
  role: "admin",
  phone: "+1234567890",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  First_Name: "John",
  Middle_Name: "M",
  Last_Name: "Doe",
  is_archived: false,
  archived_at: null
}
```

**Example:**
```javascript
const admin = await resolveAdminAccount('uuid-here', 'admin@example.com');
```

---

### 2. `getAdminDashboard(req, res)`

**Purpose:** Render admin dashboard page

**Query Parameters:**
- `adminId` - Admin UUID
- `email` - Admin email

**Response:**
```html
<!-- Renders admin/dashboard template -->
```

**Example:**
```bash
GET /api/admin/dashboard?adminId=uuid-here
GET /api/admin/dashboard?email=admin@example.com
```

---

### 3. `getAdminStats(req, res)`

**Purpose:** Get admin statistics and ranking

**Query Parameters:**
- `adminId` - Admin UUID
- `email` - Admin email

**Response:**
```json
{
  "success": true,
  "stats": {
    "adminId": "uuid",
    "email": "admin@example.com",
    "fullName": "John Doe",
    "role": "admin",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "adminPosition": 1,
    "totalAdmins": 5,
    "isArchived": false,
    "memberSince": "2024-01-01T00:00:00Z",
    "status": "Active"
  },
  "source": "admin_accounts"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/admin/stats?email=admin@example.com"
```

---

### 4. `getAdminRankInfo(adminId, email)` (Helper)

**Purpose:** Calculate admin rank based on creation date

**Parameters:**
- `adminId` (string, optional) - Admin UUID
- `email` (string, optional) - Admin email

**Returns:**

Not Ranked:
```javascript
{
  notRanked: true,
  message: "Admin not found",
  isArchived: false
}
```

Ranked:
```javascript
{
  id: "uuid",
  email: "admin@example.com",
  fullName: "John Doe",
  role: "admin",
  createdAt: "2024-01-01T00:00:00Z",
  rank: 1,
  totalAdmins: 5,
  percentile: 100,
  notRanked: false,
  isArchived: false
}
```

**How Ranking Works:**
- Admins are ranked by creation date (first admin = rank 1)
- Only active (not archived) admins are included
- Percentile shows position relative to all active admins

---

### 5. `getAdminProfile(req, res)`

**Purpose:** Get complete admin profile with rank

**Query Parameters:**
- `adminId` - Admin UUID
- `email` - Admin email

**Response:**
```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "fullName": "John Doe",
    "firstName": "John",
    "middleName": "M",
    "lastName": "Doe",
    "role": "admin",
    "phone": "+1234567890",
    "profilePicture": "url-to-picture",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "isArchived": false,
    "archivedAt": null,
    "archivedByEmail": null,
    "archiveReason": null
  },
  "rank": {
    "notRanked": false,
    "rank": 1,
    "totalAdmins": 5,
    "percentile": 100,
    "displayText": "#1 of 5",
    "isArchived": false
  },
  "source": "admin_accounts"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/admin/profile?email=admin@example.com"
```

---

### 6. `getAllActiveAdmins(req, res)`

**Purpose:** Get list of all active admins with ranks

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "admins": [
    {
      "id": "uuid1",
      "email": "admin1@example.com",
      "full_name": "John Doe",
      "role": "admin",
      "phone": "+1234567890",
      "created_at": "2024-01-01T00:00:00Z",
      "is_archived": false,
      "rank": 1,
      "totalAdmins": 5,
      "displayText": "#1 of 5"
    },
    {
      "id": "uuid2",
      "email": "admin2@example.com",
      "full_name": "Jane Smith",
      "role": "head",
      "phone": "+0987654321",
      "created_at": "2024-01-02T00:00:00Z",
      "is_archived": false,
      "rank": 2,
      "totalAdmins": 5,
      "displayText": "#2 of 5"
    }
  ],
  "totalAdmins": 5,
  "source": "admin_accounts"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/admin/all-active"
```

---

### 7. `getArchivedAdmins(req, res)`

**Purpose:** Get list of all archived admins

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "archivedAdmins": [
    {
      "id": "uuid",
      "email": "archived@example.com",
      "full_name": "Old Admin",
      "role": "admin",
      "phone": "+1234567890",
      "created_at": "2023-01-01T00:00:00Z",
      "is_archived": true,
      "archived_at": "2024-01-15T00:00:00Z",
      "archived_by_email": "admin@example.com",
      "archive_reason": "Left the organization"
    }
  ],
  "totalArchived": 1,
  "source": "admin_accounts"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/admin/archived"
```

---

### 8. `archiveAdminAccount(req, res)`

**Purpose:** Archive an admin account

**Request Body:**
```json
{
  "adminIdToArchive": "uuid",
  "archiveReason": "Left the organization",
  "archivedByEmail": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin account archived successfully",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "is_archived": true,
    "archived_at": "2024-01-15T00:00:00Z",
    "archived_by_email": "admin@example.com",
    "archive_reason": "Left the organization"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/archive \
  -H "Content-Type: application/json" \
  -d '{
    "adminIdToArchive": "uuid",
    "archiveReason": "Left the organization",
    "archivedByEmail": "admin@example.com"
  }'
```

---

### 9. `restoreAdminAccount(req, res)`

**Purpose:** Restore an archived admin account

**Request Body:**
```json
{
  "adminIdToRestore": "uuid",
  "restoredByEmail": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin account restored successfully",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "is_archived": false,
    "archived_at": null,
    "archived_by_email": null,
    "archive_reason": null
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/restore \
  -H "Content-Type: application/json" \
  -d '{
    "adminIdToRestore": "uuid",
    "restoredByEmail": "admin@example.com"
  }'
```

---

### 10. `updateAdminProfile(req, res)`

**Purpose:** Update admin profile information

**Request Body:**
```json
{
  "adminId": "uuid",
  "fullName": "John Doe",
  "firstName": "John",
  "middleName": "M",
  "lastName": "Doe",
  "phone": "+1234567890",
  "profilePicture": "url-to-picture"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin profile updated successfully",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "full_name": "John Doe",
    "First_Name": "John",
    "Middle_Name": "M",
    "Last_Name": "Doe",
    "phone": "+1234567890",
    "Profile_Picture": "url-to-picture",
    "updated_at": "2024-01-15T00:00:00Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/profile/update \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "uuid",
    "fullName": "John Doe",
    "phone": "+1234567890"
  }'
```

---

## Admin Ranking System

### How It Works

1. **Ranking Basis:** Admins are ranked by creation date (first admin = rank 1)
2. **Active Only:** Only non-archived admins are included in rankings
3. **Percentile:** Shows position relative to all active admins
4. **Display Format:** "#1 of 5" means rank 1 out of 5 total admins

### Example Ranking

```
Admin 1 (Created 2024-01-01) → Rank #1 of 5 (100th percentile)
Admin 2 (Created 2024-01-02) → Rank #2 of 5 (80th percentile)
Admin 3 (Created 2024-01-03) → Rank #3 of 5 (60th percentile)
Admin 4 (Created 2024-01-04) → Rank #4 of 5 (40th percentile)
Admin 5 (Created 2024-01-05) → Rank #5 of 5 (20th percentile)
```

### Archived Admin Handling

- Archived admins are excluded from rankings
- If an admin is archived, their rank becomes "Account Archived"
- Restoring an admin recalculates their rank

---

## Error Handling

### Common Errors

**Admin Not Found:**
```json
{
  "success": false,
  "message": "Admin account not found"
}
```

**Admin Archived:**
```json
{
  "success": false,
  "message": "This admin account has been archived"
}
```

**Missing Parameters:**
```json
{
  "success": false,
  "message": "Admin ID or email is required"
}
```

**Database Error:**
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Usage Examples

### Get Admin Profile
```javascript
const response = await fetch('/api/admin/profile?email=admin@example.com');
const data = await response.json();
console.log(data.admin);
console.log(data.rank);
```

### Get All Active Admins
```javascript
const response = await fetch('/api/admin/all-active');
const data = await response.json();
data.admins.forEach(admin => {
  console.log(`${admin.full_name} - Rank: ${admin.displayText}`);
});
```

### Archive Admin
```javascript
const response = await fetch('/api/admin/archive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adminIdToArchive: 'uuid',
    archiveReason: 'Left the organization',
    archivedByEmail: 'admin@example.com'
  })
});
const data = await response.json();
console.log(data.message);
```

### Update Admin Profile
```javascript
const response = await fetch('/api/admin/profile/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adminId: 'uuid',
    fullName: 'John Doe',
    phone: '+1234567890'
  })
});
const data = await response.json();
console.log(data.admin);
```

---

## Integration with Frontend

### Display Admin Rank
```javascript
// In your admin dashboard template
if (data.rank.notRanked) {
  rankEl.textContent = data.rank.displayText;
  rankEl.title = data.rank.message;
} else {
  rankEl.textContent = `Rank: ${data.rank.displayText}`;
  rankEl.title = `You are in the top ${data.rank.percentile}% of admins`;
}
```

### Display Admin Status
```javascript
// Show if admin is archived
if (data.admin.isArchived) {
  statusEl.textContent = 'Archived';
  statusEl.classList.add('text-red-500');
} else {
  statusEl.textContent = 'Active';
  statusEl.classList.add('text-green-500');
}
```

---

## Database Indexes

The following indexes are created for performance:

```sql
CREATE INDEX idx_admin_accounts_is_archived 
  ON public.admin_accounts USING btree (is_archived);

CREATE INDEX idx_admin_accounts_archived_at 
  ON public.admin_accounts USING btree (archived_at DESC);
```

---

## Triggers

Two triggers are set up for automatic updates:

1. **`trg_admin_accounts_archive_log`** - Logs archive operations
2. **`trg_admin_accounts_updated_at`** - Updates `updated_at` timestamp

---

## Status

✅ **Complete and Production Ready**

- All functions implemented
- Error handling included
- Database integration verified
- API endpoints documented
- Ready for deployment

---

**File:** `controllers/adminDashboardController.js`  
**Version:** 1.0.0  
**Last Updated:** May 5, 2026
