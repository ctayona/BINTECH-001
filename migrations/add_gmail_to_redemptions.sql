-- ADD GMAIL TO REDEMPTIONS
-- Keeps redemption rows identifiable even when user_id is unavailable on older records.

ALTER TABLE public.redemptions
ADD COLUMN IF NOT EXISTS gmail text;

CREATE INDEX IF NOT EXISTS idx_redemptions_gmail
ON public.redemptions USING btree (gmail);

COMMENT ON COLUMN public.redemptions.gmail IS 'Gmail/email address linked to the redemption record';