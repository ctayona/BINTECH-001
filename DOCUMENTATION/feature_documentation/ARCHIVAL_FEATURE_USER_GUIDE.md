# Admin Accounts Archival Feature - User Guide

## Overview

The Admin Accounts Archival Feature allows head administrators to archive inactive or removed admin accounts while preserving their complete data for future reference or restoration.

---

## How to Use

### 1. Archive an Admin Account

**Who can do this**: Head administrators only

**Steps**:
1. Go to `/admin/accounts`
2. Click on the **Admins** tab
3. Find the admin account you want to archive
4. Click the **Archive** button (trash icon)
5. Enter an optional reason for archiving
6. Click **Confirm Archive**

**What happens**:
- The account is marked as archived
- A complete snapshot of the account is saved
- The account is removed from the active admins list
- The action is logged with timestamp and who performed it

### 2. View Archive History

**Who can do this**: Admin and head administrators

**Steps**:
1. Go to `/admin/accounts`
2. Click on the **Archive History** tab
3. View the list of all archived accounts
4. Use the search box to find specific accounts by email

**Information displayed**:
- Email address
- Date archived
- Who archived it
- Reason for archiving (if provided)
- Action buttons (View, Restore)

### 3. View Account Snapshot

**Who can do this**: Admin and head administrators

**Steps**:
1. Go to Archive History tab
2. Click **View** button on any archived account
3. A modal will show the complete account data as it was when archived

**What you can see**:
- All account fields (name, email, phone, etc.)
- Profile picture
- Google ID
- Role at time of archival
- All metadata

### 4. Restore an Archived Account

**Who can do this**: Head administrators only

**Steps**:
1. Go to Archive History tab
2. Click **Restore** button on the account you want to restore
3. Enter an optional reason for restoration
4. Click **Confirm Restore**

**What happens**:
- The account is restored to active status
- All data from the snapshot is restored
- The account reappears in the active admins list
- The restoration is logged

---

## Important Notes

### Restrictions

- ❌ **Cannot archive your own account** - You cannot archive the account you're currently logged in with
- ❌ **Cannot archive head accounts** - Head administrator accounts cannot be archived
- ❌ **Only head admins can archive/restore** - Regular admins can only view archive history

### Data Preservation

- ✅ **Complete snapshots** - All account data is preserved in JSONB format
- ✅ **Immutable history** - Archive history cannot be modified or deleted
- ✅ **Full restoration** - Archived accounts can be fully restored with all original data

### Permissions

| Action | User Role | Allowed |
|--------|-----------|---------|
| View Archive History | Admin | ✅ Yes |
| View Archive History | Head | ✅ Yes |
| View Account Snapshot | Admin | ✅ Yes |
| View Account Snapshot | Head | ✅ Yes |
| Archive Account | Admin | ❌ No |
| Archive Account | Head | ✅ Yes |
| Restore Account | Admin | ❌ No |
| Restore Account | Head | ✅ Yes |

---

## API Reference

### Get Archive History

```
GET /api/admin/accounts/archive-history
```

**Query Parameters**:
- `limit` (optional): Number of records per page (default: 50, max: 200)
- `offset` (optional): Starting position (default: 0)
- `search` (optional): Search by email
- `sort` (optional): Sort field (archived_at, email, archived_by_email)
- `order` (optional): Sort order (asc, desc)

**Response**:
```json
{
  "success": true,
  "archives": [
    {
      "archive_id": "uuid",
      "admin_id": "uuid",
      "email": "admin@example.com",
      "archived_at": "2026-04-30T15:27:57.365+00:00",
      "archived_by_email": "head@example.com",
      "archive_reason": "Inactive account",
      "previous_role": "admin"
    }
  ],
  "total": 4,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

### Get Archive Snapshot

```
GET /api/admin/accounts/archive-history/:archive_id
```

**Response**:
```json
{
  "success": true,
  "archive": {
    "archive_id": "uuid",
    "admin_id": "uuid",
    "email": "admin@example.com",
    "archived_at": "2026-04-30T15:27:57.365+00:00",
    "archived_by_email": "head@example.com",
    "archive_reason": "Inactive account",
    "previous_role": "admin",
    "snapshot": {
      "id": "uuid",
      "email": "admin@example.com",
      "full_name": "John Doe",
      "role": "admin",
      "phone": "+1234567890",
      "Google_ID": "...",
      "Profile_Picture": "...",
      "created_at": "2026-01-01T00:00:00+00:00",
      "updated_at": "2026-04-30T15:27:57.365+00:00"
    }
  }
}
```

### Archive Account

```
POST /api/admin/accounts/:id/archive
```

**Body**:
```json
{
  "archive_reason": "Optional reason for archiving"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account archived successfully",
  "archive_id": "uuid",
  "archived_account": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "archived_at": "2026-04-30T15:27:57.365+00:00",
    "archived_by": "head@example.com"
  }
}
```

### Restore Account

```
POST /api/admin/accounts/archive-history/:archive_id/restore
```

**Body**:
```json
{
  "restore_reason": "Optional reason for restoration"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account restored successfully",
  "restored_account": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "restored_at": "2026-04-30T15:27:57.365+00:00",
    "restored_by": "head@example.com"
  }
}
```

---

## Troubleshooting

### "Access denied: admin role required"
- **Cause**: You don't have admin or head role
- **Solution**: Contact a head administrator to grant you admin access

### "Cannot archive your own account"
- **Cause**: You tried to archive the account you're logged in with
- **Solution**: Log in with a different admin account to archive this one

### "Head accounts cannot be archived"
- **Cause**: You tried to archive a head administrator account
- **Solution**: Only regular admin accounts can be archived

### "Email is already in use by another active account"
- **Cause**: You tried to restore an account but the email is now used by another active account
- **Solution**: Archive or delete the other account first, then restore

---

## Best Practices

1. **Always provide a reason** - When archiving accounts, include a reason for future reference
2. **Review before archiving** - Check the account details before archiving
3. **Document changes** - Keep notes of why accounts were archived
4. **Regular reviews** - Periodically review archived accounts to see if any should be restored
5. **Backup important data** - If an account has important data, export it before archiving

---

## Support

For issues or questions about the archival feature, contact your system administrator.

