-- ================================================================
-- ADD user_email TO machine_sessions
-- Makes session ownership easier to inspect in admin and logs.
-- ================================================================

ALTER TABLE public.machine_sessions
ADD COLUMN IF NOT EXISTS user_email text;

-- Backfill existing rows from user_accounts
UPDATE public.machine_sessions ms
SET user_email = ua.email
FROM public.user_accounts ua
WHERE ms.user_id = ua.system_id
  AND (ms.user_email IS NULL OR ms.user_email = '');

-- Helpful index for filtering/searching session owner by email
CREATE INDEX IF NOT EXISTS idx_machine_sessions_user_email
ON public.machine_sessions USING btree (user_email);

COMMENT ON COLUMN public.machine_sessions.user_email IS 'Email of user linked via user_accounts.system_id at session start time';
