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
