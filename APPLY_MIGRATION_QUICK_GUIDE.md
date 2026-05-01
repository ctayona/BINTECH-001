# Quick Guide: Apply Archive History Migration to Supabase

## 🎯 Goal
Create the `admin_accounts_archive_history` table in Supabase so the archival feature works.

## ⏱️ Time Required
2-3 minutes

## 📋 Steps

### 1. Open Supabase Dashboard
- Go to https://app.supabase.com
- Sign in with your credentials
- Select your BinTECH project

### 2. Navigate to SQL Editor
- Click **SQL Editor** in the left sidebar
- Click **New Query** button

### 3. Copy the Migration SQL
Copy this entire SQL block:

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

### 4. Paste into SQL Editor
- Paste the SQL into the query editor
- You should see the SQL highlighted with syntax coloring

### 5. Execute the Query
- Click the **Run** button (or press Ctrl+Enter)
- Wait for the query to complete
- You should see a success message

### 6. Verify Table Creation
- Click **Table Editor** in the left sidebar
- Scroll down to find `admin_accounts_archive_history`
- Click on it to verify the columns and indexes

## ✅ Verification Checklist

After running the migration, verify:

- [ ] Table `admin_accounts_archive_history` exists in Table Editor
- [ ] Table has 8 columns: archive_id, admin_id, email, archived_at, archived_by_email, archive_reason, previous_role, snapshot
- [ ] `archive_id` is the primary key (UUID)
- [ ] Two indexes exist: `idx_admin_archive_history_email` and `idx_admin_archive_history_archived_at`
- [ ] No error messages in the SQL Editor

## 🧪 Test the Feature

Once the table is created:

1. Go to http://localhost:3000/admin/accounts (or your admin URL)
2. Click the **Admins** tab
3. Click **Archive** on any admin account
4. Confirm the archive action
5. Click the **Archive History** tab
6. You should see the archived account listed
7. Click **View Snapshot** to see the full account data
8. Click **Restore** to restore the account

## 🆘 Troubleshooting

### Error: "Table already exists"
- This is fine! The `CREATE TABLE IF NOT EXISTS` clause handles this
- The table already exists, no action needed

### Error: "Permission denied"
- Make sure you're logged into Supabase with the correct account
- Make sure you have admin/owner permissions on the project

### Table doesn't appear in Table Editor
- Refresh the page (F5)
- Click on a different table, then click back
- Check the SQL Editor for any error messages

### Archive History tab shows "No archived accounts"
- This is correct! You haven't archived any accounts yet
- Try archiving an admin account to test

## 📞 Need Help?

If you encounter issues:
1. Check the error message in the SQL Editor
2. Verify the SQL syntax is correct
3. Make sure you're in the correct Supabase project
4. Check that you have the necessary permissions

