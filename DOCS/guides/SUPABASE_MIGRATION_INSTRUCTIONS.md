# Supabase Migration Instructions - Admin Archive History Table

## 🚀 How to Apply the Migration

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the SQL**
   ```sql
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

   CREATE INDEX IF NOT EXISTS idx_admin_archive_history_email 
   ON public.admin_accounts_archive_history USING btree (email) TABLESPACE pg_default;

   CREATE INDEX IF NOT EXISTS idx_admin_archive_history_archived_at 
   ON public.admin_accounts_archive_history USING btree (archived_at DESC) TABLESPACE pg_default;
   ```

4. **Execute the Query**
   - Click "Run" button (or Ctrl+Enter)
   - Wait for confirmation

5. **Verify Success**
   - You should see "Query executed successfully"
   - Check the "Table Editor" to see the new table

### Option 2: Using Migration Files

1. **File Location**
   - Migration file: `migrations/create_admin_archive_history_table.sql`

2. **Apply Migration**
   - If using a migration tool, run:
   ```bash
   # Using Supabase CLI
   supabase migration up
   ```

3. **Or manually in SQL Editor**
   - Copy contents of `migrations/create_admin_archive_history_table.sql`
   - Paste into Supabase SQL Editor
   - Execute

---

## 📋 What Gets Created

### Table: `admin_accounts_archive_history`

**Columns**:
| Column | Type | Default | Nullable | Purpose |
|--------|------|---------|----------|---------|
| `archive_id` | UUID | gen_random_uuid() | NO | Primary key, unique identifier |
| `admin_id` | UUID | — | YES | Foreign key to original admin account |
| `email` | TEXT | — | NO | Admin email address |
| `archived_at` | TIMESTAMPTZ | now() | NO | When the account was archived |
| `archived_by_email` | TEXT | — | YES | Email of admin who archived it |
| `archive_reason` | TEXT | — | YES | Optional reason for archival |
| `previous_role` | TEXT | — | YES | Role before archival (admin/head) |
| `snapshot` | JSONB | — | NO | Full account data snapshot |

**Primary Key**: `archive_id`

### Indexes Created

1. **`idx_admin_archive_history_email`**
   - Type: B-tree
   - Column: `email`
   - Purpose: Fast email lookups

2. **`idx_admin_archive_history_archived_at`**
   - Type: B-tree (descending)
   - Column: `archived_at DESC`
   - Purpose: Fast retrieval of recent archives

---

## ✅ Verification Steps

### Step 1: Check Table Exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'admin_accounts_archive_history';
```

**Expected Result**: One row with `admin_accounts_archive_history`

### Step 2: Check Columns
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'admin_accounts_archive_history'
ORDER BY ordinal_position;
```

**Expected Result**: 8 rows with all columns listed above

### Step 3: Check Indexes
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'admin_accounts_archive_history';
```

**Expected Result**: 3 rows (primary key + 2 indexes)

### Step 4: Test Insert
```sql
INSERT INTO public.admin_accounts_archive_history (
  admin_id,
  email,
  archived_by_email,
  archive_reason,
  previous_role,
  snapshot
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'test@example.com',
  'head@example.com',
  'Test archive',
  'admin',
  '{"email": "test@example.com", "role": "admin"}'::jsonb
);
```

**Expected Result**: `INSERT 0 1` (one row inserted)

### Step 5: Test Query
```sql
SELECT * FROM public.admin_accounts_archive_history;
```

**Expected Result**: One row with your test data

---

## 🔍 Troubleshooting

### Issue: "Table already exists"
**Solution**: This is fine! The `IF NOT EXISTS` clause prevents errors. The table won't be recreated.

### Issue: "Permission denied"
**Solution**: 
- Ensure you're using a role with table creation permissions
- Use the Supabase service role or admin role

### Issue: "Index already exists"
**Solution**: This is fine! The `IF NOT EXISTS` clause prevents errors. The index won't be recreated.

### Issue: "Column type not recognized"
**Solution**:
- Ensure you're using PostgreSQL 12+
- JSONB and UUID types are standard in modern PostgreSQL

### Issue: "TABLESPACE pg_default not found"
**Solution**:
- Remove the `TABLESPACE pg_default` clause if it causes issues
- Supabase will use the default tablespace automatically

---

## 📊 Data Structure Example

### Sample Archive Record
```json
{
  "archive_id": "660e8400-e29b-41d4-a716-446655440000",
  "admin_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.admin@example.com",
  "archived_at": "2026-04-30T10:00:00Z",
  "archived_by_email": "head@example.com",
  "archive_reason": "Account no longer needed",
  "previous_role": "admin",
  "snapshot": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.admin@example.com",
    "role": "admin",
    "full_name": "John Admin",
    "First_Name": "John",
    "Last_Name": "Admin",
    "phone": "+1234567890",
    "Google_ID": null,
    "Profile_Picture": null,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-04-30T09:00:00Z"
  }
}
```

---

## 🔐 Security Considerations

### Immutability
- Archive records should never be updated or deleted
- Consider adding a policy to prevent modifications:

```sql
-- Prevent updates to archive records
CREATE POLICY "Archive records are immutable" 
ON public.admin_accounts_archive_history 
FOR UPDATE 
USING (false);

-- Prevent deletes of archive records
CREATE POLICY "Archive records cannot be deleted" 
ON public.admin_accounts_archive_history 
FOR DELETE 
USING (false);
```

### Access Control
- Restrict access to archive history to admin users
- Use Row Level Security (RLS) if needed:

```sql
-- Enable RLS
ALTER TABLE public.admin_accounts_archive_history ENABLE ROW LEVEL SECURITY;

-- Allow admins to view archives
CREATE POLICY "Admins can view archives" 
ON public.admin_accounts_archive_history 
FOR SELECT 
USING (auth.jwt() ->> 'role' IN ('admin', 'head'));
```

---

## 📝 Next Steps

After creating the table:

1. **Deploy Backend Code**
   - Push `controllers/adminController.js` with archive functions

2. **Deploy Frontend Code**
   - Push `templates/ADMIN_ACCOUNTS.html` with UI components

3. **Test the Feature**
   - Archive an admin account
   - Verify data appears in the table
   - Test restore functionality

4. **Monitor**
   - Check Supabase logs for errors
   - Monitor table growth
   - Verify indexes are being used

---

## 📚 Related Files

- **Backend**: `controllers/adminController.js`
- **Frontend**: `templates/ADMIN_ACCOUNTS.html`
- **Migration**: `migrations/create_admin_archive_history_table.sql`
- **Documentation**: `ADMIN_ACCOUNTS_ARCHIVAL_IMPLEMENTATION.md`

---

## ✅ Completion Checklist

- [ ] Table created in Supabase
- [ ] Indexes created successfully
- [ ] Test insert successful
- [ ] Test query returns data
- [ ] Backend code deployed
- [ ] Frontend code deployed
- [ ] Feature tested end-to-end
- [ ] Archive history populated
- [ ] Restore functionality works

---

## 🎉 Success!

Once all steps are complete, the admin accounts archival feature is fully operational!

**Status**: ✅ Ready for Production
