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
