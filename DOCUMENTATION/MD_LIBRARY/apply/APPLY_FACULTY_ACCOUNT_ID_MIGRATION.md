# Apply Faculty account_id Migration

**IMPORTANT**: You must apply this SQL migration to your Supabase database before faculty can sign up with external emails.

---

## What This Migration Does

Adds an `account_id` column to the `faculty_accounts` table to support faculty members who use external emails (Gmail, Yahoo, etc.).

**Before**:
- Faculty could only use UMak emails
- Only `faculty_id` column existed

**After**:
- Faculty can use UMak emails (uses `faculty_id`)
- Faculty can use external emails (uses `account_id`)

---

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the SQL from `migrations/add_account_id_to_faculty_accounts.sql`
5. Click **Run** or press `Ctrl+Enter`
6. Verify success message

### Option 2: Command Line (If you have psql)

```bash
psql -h your-supabase-host -U postgres -d postgres -f migrations/add_account_id_to_faculty_accounts.sql
```

---

## SQL to Apply

```sql
-- Add account_id column to faculty_accounts table
-- This allows faculty to use external emails (Gmail, Yahoo, etc.)
-- Faculty with UMak emails use faculty_id, faculty with external emails use account_id

-- Add account_id column (nullable, since UMak faculty use faculty_id)
ALTER TABLE public.faculty_accounts 
ADD COLUMN IF NOT EXISTS account_id text NULL;

-- Create index on account_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_faculty_accounts_account_id 
ON public.faculty_accounts USING btree (account_id);

-- Add comment explaining the column
COMMENT ON COLUMN public.faculty_accounts.account_id IS 
'Account ID for faculty with external emails (e.g., Gmail). Format: OTH+numbers. Faculty with UMak emails use faculty_id instead.';
```

---

## Verification

After applying the migration, verify it worked:

### Check if column exists:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'faculty_accounts'
  AND column_name = 'account_id';
```

**Expected Result**:
```
column_name | data_type | is_nullable
------------|-----------|------------
account_id  | text      | YES
```

### Check if index exists:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'faculty_accounts'
  AND indexname = 'idx_faculty_accounts_account_id';
```

**Expected Result**:
```
indexname                          | indexdef
-----------------------------------|------------------------------------------
idx_faculty_accounts_account_id    | CREATE INDEX idx_faculty_accounts_account_id ON public.faculty_accounts USING btree (account_id)
```

---

## Test Faculty Signup

After applying the migration, test faculty signup with external email:

1. Go to signup page
2. Enter external email: `test@gmail.com`
3. Select role: **Faculty**
4. Fill in name and password
5. Click **Create Account**
6. Should succeed with message: "Account created successfully"

---

## Rollback (If Needed)

If you need to remove the column:

```sql
-- Remove index
DROP INDEX IF EXISTS public.idx_faculty_accounts_account_id;

-- Remove column
ALTER TABLE public.faculty_accounts 
DROP COLUMN IF EXISTS account_id;
```

---

## Notes

- ✅ **Safe to apply**: Uses `IF NOT EXISTS` to prevent errors if already applied
- ✅ **Non-breaking**: Existing faculty accounts continue to work
- ✅ **Nullable column**: Won't affect existing records
- ✅ **Indexed**: Fast lookups for external faculty accounts

---

## Status

- [ ] Migration file created: `migrations/add_account_id_to_faculty_accounts.sql`
- [ ] SQL applied to Supabase database
- [ ] Verification queries run successfully
- [ ] Faculty signup with external email tested

---

## Support

If you encounter any issues:
1. Check Supabase logs for error messages
2. Verify you have proper permissions to alter tables
3. Contact database administrator if needed

