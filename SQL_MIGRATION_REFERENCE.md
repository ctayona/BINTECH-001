# SQL Migration Reference - Admin Archive History Table

## 🚀 Quick Copy-Paste SQL

### Complete Migration (Copy All)

```sql
-- ============================================
-- Create admin_accounts_archive_history table
-- ============================================

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

-- ============================================
-- Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_archive_history_email 
ON public.admin_accounts_archive_history USING btree (email) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_archive_history_archived_at 
ON public.admin_accounts_archive_history USING btree (archived_at DESC) TABLESPACE pg_default;
```

---

## 📋 Step-by-Step Instructions

### In Supabase SQL Editor:

1. **Click "New Query"**
2. **Paste the SQL above**
3. **Click "Run"**
4. **Wait for "Query executed successfully"**

---

## ✅ Verification Queries

### Check Table Exists
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'admin_accounts_archive_history';
```

### Check Columns
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_accounts_archive_history'
ORDER BY ordinal_position;
```

### Check Indexes
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'admin_accounts_archive_history';
```

### Test Insert
```sql
INSERT INTO public.admin_accounts_archive_history (
  admin_id, email, archived_by_email, archive_reason, previous_role, snapshot
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'test@example.com',
  'head@example.com',
  'Test',
  'admin',
  '{"test": true}'::jsonb
);
```

### View Data
```sql
SELECT * FROM public.admin_accounts_archive_history;
```

---

## 🔍 Table Schema

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| archive_id | uuid | gen_random_uuid() | NO |
| admin_id | uuid | — | YES |
| email | text | — | NO |
| archived_at | timestamptz | now() | NO |
| archived_by_email | text | — | YES |
| archive_reason | text | — | YES |
| previous_role | text | — | YES |
| snapshot | jsonb | — | NO |

---

## 📊 Indexes

1. **idx_admin_archive_history_email** - B-tree on email
2. **idx_admin_archive_history_archived_at** - B-tree DESC on archived_at

---

## 🎯 That's It!

The table is now ready for the archival feature to use.

**Next**: Deploy backend and frontend code.
