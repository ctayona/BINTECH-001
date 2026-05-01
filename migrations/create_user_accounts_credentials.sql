-- Create user_accounts table for regular user login credentials
-- This table is separate from admin_accounts and is used by /auth/login for non-admin users.

CREATE TABLE IF NOT EXISTS public.user_accounts (
  system_id uuid NOT NULL DEFAULT gen_random_uuid(),
  campus_id character varying(50) NULL,
  role character varying(20) NOT NULL,
  email character varying(255) NOT NULL,
  password text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  google_id text NULL,
  CONSTRAINT user_accounts_pkey PRIMARY KEY (system_id),
  CONSTRAINT user_accounts_campus_id_key UNIQUE (campus_id),
  CONSTRAINT user_accounts_email_key UNIQUE (email),
  CONSTRAINT user_accounts_google_id_key UNIQUE (google_id)
) TABLESPACE pg_default;

-- Ensure trigger function exists for updated_at maintenance
-- Safe for existing data: this only defines function logic and does not alter table rows.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_user_accounts_updated_at'
      AND tgrelid = 'public.user_accounts'::regclass
  ) THEN
    CREATE TRIGGER trg_user_accounts_updated_at
    BEFORE UPDATE ON public.user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;
