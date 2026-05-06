-- CONVERT REDEMPTIONS.USER_ID TO TEXT
-- Allows campus/account identifiers to be stored without UUID casting issues.
-- Run this against the existing redemptions table; do not recreate the table.

DO $$
DECLARE
	policy_record record;
BEGIN
	FOR policy_record IN
		SELECT policyname
		FROM pg_policies
		WHERE schemaname = 'public'
			AND tablename = 'redemptions'
	LOOP
		EXECUTE format('DROP POLICY IF EXISTS %I ON public.redemptions', policy_record.policyname);
	END LOOP;
END
$$;

ALTER TABLE public.redemptions
DROP CONSTRAINT IF EXISTS redemptions_user_id_fkey;

ALTER TABLE public.redemptions
ALTER COLUMN user_id TYPE text
USING user_id::text;

COMMENT ON COLUMN public.redemptions.user_id IS 'Campus/account identifier or legacy user reference stored as text';

CREATE INDEX IF NOT EXISTS idx_redemptions_user_id
ON public.redemptions USING btree (user_id);

CREATE POLICY "user can view own redemptions"
ON public.redemptions
FOR SELECT
USING (
	gmail = auth.email()
	OR user_id = auth.uid()::text
);

CREATE POLICY "user insert redemption"
ON public.redemptions
FOR INSERT
WITH CHECK (
	gmail = auth.email()
	OR user_id = auth.uid()::text
);
