-- ================================================================
-- FIX MACHINE_SESSIONS TABLE
-- Change the foreign key from users table to user_accounts.system_id
-- Supports system_id, campus_id, and email lookups
-- ================================================================

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.machine_sessions 
DROP CONSTRAINT IF EXISTS machine_sessions_user_id_fkey;

-- Step 2: Change the user_id column type from UUID to TEXT to match system_id
-- First, we need to drop the column and recreate it as TEXT
-- But first, let's back up any data and remove it temporarily

-- Check if table has data
-- ALTER TABLE public.machine_sessions 
-- RENAME COLUMN user_id TO user_id_old;

-- For a simpler approach: just change the constraint and add support for text user IDs
-- Modify the user_id column to be nullable first
ALTER TABLE public.machine_sessions 
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Step 3: Add the corrected foreign key constraint pointing to user_accounts.system_id
ALTER TABLE public.machine_sessions 
ADD CONSTRAINT machine_sessions_user_id_fkey FOREIGN KEY (user_id) 
  REFERENCES public.user_accounts(system_id) ON DELETE CASCADE;

-- Step 4: Create helpful comment to document the field
COMMENT ON COLUMN public.machine_sessions.user_id IS 'Foreign key to user_accounts.system_id - can also be matched with campus_id or email for lookups';

-- Step 5: Ensure indexes are in place for performance
CREATE INDEX IF NOT EXISTS idx_machine_sessions_user_id ON public.machine_sessions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_machine_sessions_is_active ON public.machine_sessions USING btree (status) WHERE status = 'active' TABLESPACE pg_default;

-- Step 6: Update any orphaned records (if they exist)
-- This will set user_id to NULL for any records that don't have a matching user_accounts entry
-- Uncomment if needed:
-- UPDATE public.machine_sessions 
-- SET user_id = NULL 
-- WHERE user_id NOT IN (SELECT system_id FROM public.user_accounts);
