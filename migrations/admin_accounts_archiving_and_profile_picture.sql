-- Admin accounts archiving + profile picture support
-- Run this in Supabase SQL editor.

BEGIN;

-- 1) Add profile picture column for admin profile image editing
ALTER TABLE public.admin_accounts
ADD COLUMN IF NOT EXISTS "Profile_Picture" text NULL;

-- Compatibility: some code paths use lowercase profile_picture
ALTER TABLE public.admin_accounts
ADD COLUMN IF NOT EXISTS profile_picture text NULL;

-- 2) Add archive metadata columns (keeps original row for audit/history)
ALTER TABLE public.admin_accounts
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS archived_by_email text NULL,
ADD COLUMN IF NOT EXISTS archive_reason text NULL;

-- 3) Backfill archive flags for rows already marked as role='archived'
UPDATE public.admin_accounts
SET is_archived = true,
    archived_at = COALESCE(archived_at, now())
WHERE lower(COALESCE(role, '')) = 'archived';

-- 4) Indexes for fast active/archive filtering
CREATE INDEX IF NOT EXISTS idx_admin_accounts_is_archived
ON public.admin_accounts (is_archived);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_archived_at
ON public.admin_accounts (archived_at DESC);

-- 5) Archive history table (immutable snapshots)
CREATE TABLE IF NOT EXISTS public.admin_accounts_archive_history (
  archive_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NULL,
  email text NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by_email text NULL,
  archive_reason text NULL,
  previous_role text NULL,
  snapshot jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_archive_history_email
ON public.admin_accounts_archive_history (email);

CREATE INDEX IF NOT EXISTS idx_admin_archive_history_archived_at
ON public.admin_accounts_archive_history (archived_at DESC);

-- 6) Trigger function to auto-log snapshot when account is archived
CREATE OR REPLACE FUNCTION public.log_admin_account_archive()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    (COALESCE(NEW.is_archived, false) = true AND COALESCE(OLD.is_archived, false) = false)
    OR
    (lower(COALESCE(NEW.role, '')) = 'archived' AND lower(COALESCE(OLD.role, '')) <> 'archived')
  ) THEN
    NEW.is_archived := true;
    NEW.archived_at := COALESCE(NEW.archived_at, now());

    INSERT INTO public.admin_accounts_archive_history (
      admin_id,
      email,
      archived_at,
      archived_by_email,
      archive_reason,
      previous_role,
      snapshot
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, OLD.email),
      COALESCE(NEW.archived_at, now()),
      NEW.archived_by_email,
      NEW.archive_reason,
      OLD.role,
      to_jsonb(OLD)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_accounts_archive_log ON public.admin_accounts;
CREATE TRIGGER trg_admin_accounts_archive_log
BEFORE UPDATE ON public.admin_accounts
FOR EACH ROW
EXECUTE FUNCTION public.log_admin_account_archive();

COMMIT;
