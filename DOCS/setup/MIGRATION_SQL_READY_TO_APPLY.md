# Migration SQL - Ready to Apply to Supabase

## 🎯 What to Do

1. Go to https://app.supabase.com
2. Select your BinTECH project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. **Copy the entire SQL block below**
6. **Paste it into the query editor**
7. **Click Run**
8. Done! The table is created.

---

## 📋 SQL to Copy and Paste

```sql
-- Create admin_accounts_archive_history table
-- This table stores immutable snapshots of archived admin accounts

CREATE TABLE IF NOT EXISTS public.admin_accounts_archive_history (
  archive_id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NULL,
  email text NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_by_email text NULL,
  archive_reason text NULL,
  previous_role text NULL,
  snapshot jsonb NOT NULL,
  CONSTRAINT admin_accounts_archive_history_pkey PRIMARY KEY (archive_id)
) TABLESPACE pg_default;

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_admin_archive_history_email 
ON public.admin_accounts_archive_history USING btree (email) TABLESPACE pg_default;

-- Create index on archived_at (descending) for recent archives
CREATE INDEX IF NOT EXISTS idx_admin_archive_history_archived_at 
ON public.admin_accounts_archive_history USING btree (archived_at DESC) TABLESPACE pg_default;
```

---

## ✅ Verification Steps

After running the SQL, verify the table was created:

1. Click **Table Editor** in the left sidebar
2. Scroll down to find `admin_accounts_archive_history`
3. Click on it to verify:
   - ✅ Table name: `admin_accounts_archive_history`
   - ✅ Column: `archive_id` (UUID, Primary Key)
   - ✅ Column: `admin_id` (UUID, nullable)
   - ✅ Column: `email` (text, not null)
   - ✅ Column: `archived_at` (timestamp with time zone)
   - ✅ Column: `archived_by_email` (text, nullable)
   - ✅ Column: `archive_reason` (text, nullable)
   - ✅ Column: `previous_role` (text, nullable)
   - ✅ Column: `snapshot` (jsonb, not null)
   - ✅ Index: `idx_admin_archive_history_email`
   - ✅ Index: `idx_admin_archive_history_archived_at`

---

## 🧪 Test the Feature

After the table is created, test the archival feature:

1. Go to http://localhost:3000/admin/accounts (or your admin URL)
2. Click the **Admins** tab
3. Click **Archive** on any admin account
4. Confirm the archive action
5. Click the **Archive History** tab
6. You should see the archived account listed
7. Click **View Snapshot** to see the full account data
8. Click **Restore** to restore the account

---

## 📊 What Each Column Does

| Column | Type | Purpose |
|--------|------|---------|
| `archive_id` | UUID | Unique identifier for each archive record (Primary Key) |
| `admin_id` | UUID | ID of the archived admin account |
| `email` | text | Email address of the archived account |
| `archived_at` | timestamp | When the account was archived |
| `archived_by_email` | text | Email of the person who archived the account |
| `archive_reason` | text | Optional reason for archiving |
| `previous_role` | text | Role of the account before archiving |
| `snapshot` | jsonb | Complete account data at time of archival |

---

## 🚀 Index Performance

The two indexes ensure fast queries:

1. **`idx_admin_archive_history_email`**
   - Allows fast lookups by email address
   - Used when searching for specific archived accounts

2. **`idx_admin_archive_history_archived_at DESC`**
   - Allows fast retrieval of recent archives
   - Descending order means newest archives are retrieved first

---

## ⏱️ Time Required

- **Copy SQL:** 30 seconds
- **Paste into Supabase:** 30 seconds
- **Run query:** 10-30 seconds
- **Verify table:** 30 seconds
- **Total:** 2-3 minutes

---

## 🆘 Troubleshooting

### Error: "Table already exists"
- This is fine! The `CREATE TABLE IF NOT EXISTS` clause handles this
- The table already exists, no action needed
- You can proceed to test the feature

### Error: "Permission denied"
- Make sure you're logged into Supabase with the correct account
- Make sure you have admin/owner permissions on the project
- Try logging out and logging back in

### Error: "Syntax error"
- Make sure you copied the entire SQL block
- Make sure there are no extra characters
- Try copying again and pasting into a fresh query

### Table doesn't appear in Table Editor
- Refresh the page (F5)
- Click on a different table, then click back
- Wait a few seconds for the table list to update

### Archive History tab shows error
- Refresh the page
- Check browser console for error messages
- Verify the table exists in Supabase Table Editor
- Check that you have Admin role

---

## 📝 Notes

- The `CREATE TABLE IF NOT EXISTS` clause means you can run this SQL multiple times without errors
- The `DEFAULT gen_random_uuid()` means each archive gets a unique ID automatically
- The `DEFAULT now()` means the archive timestamp is set automatically
- The JSONB snapshot stores the complete account data for restoration

---

## ✨ What Happens After Migration

Once the table is created:

1. **Archive Functionality Works**
   - Click Archive button on any admin account
   - Account is marked as archived
   - Full snapshot is stored in the database

2. **Archive History Works**
   - Archive History tab shows all archived accounts
   - Can search by email
   - Can sort by date
   - Supports pagination

3. **Restore Functionality Works**
   - Click Restore button on archived account
   - Account is restored to active status
   - Data is restored from snapshot

4. **Feature is Complete**
   - All functionality is working
   - All endpoints are responding
   - All UI components are functional

---

## 🎉 Summary

This SQL creates the database table needed for the Admin Accounts Archival feature. Once applied, the feature will be fully functional and ready to use.

**Time to apply:** 2-3 minutes
**Difficulty:** Very easy (copy and paste)
**Risk:** None (uses `IF NOT EXISTS` clause)

