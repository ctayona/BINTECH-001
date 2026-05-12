-- Account points + waste category totals (gamification-ready)
-- Safe to run multiple times.

-- Keep/update the shared trigger function used by account_points.updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.account_points (
  system_id uuid NOT NULL,
  email character varying(255) NOT NULL,
  campus_id character varying(50) NULL,
  points integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NULL DEFAULT now(),
  total_waste integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  CONSTRAINT account_points_pkey PRIMARY KEY (system_id),
  CONSTRAINT account_points_campus_id_key UNIQUE (campus_id),
  CONSTRAINT account_points_email_key UNIQUE (email),
  CONSTRAINT fk_account_points_user FOREIGN KEY (system_id) REFERENCES user_accounts (system_id) ON DELETE CASCADE,
  CONSTRAINT fk_account_points_campus FOREIGN KEY (campus_id) REFERENCES user_accounts (campus_id) ON DELETE SET NULL,
  CONSTRAINT fk_account_points_email FOREIGN KEY (email) REFERENCES user_accounts (email) ON DELETE CASCADE,
  CONSTRAINT chk_points_nonnegative CHECK ((points >= 0)),
  CONSTRAINT chk_total_points_nonnegative CHECK ((total_points >= 0)),
  CONSTRAINT chk_total_waste_nonnegative CHECK ((total_waste >= 0))
) TABLESPACE pg_default;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_account_points_updated_at'
      AND tgrelid = 'public.account_points'::regclass
  ) THEN
    CREATE TRIGGER trg_account_points_updated_at
    BEFORE UPDATE ON account_points
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- Per-user category totals for quick gamification analytics
-- One row per (user, category) with running quantity.
CREATE TABLE IF NOT EXISTS public.user_waste_category_totals (
  system_id uuid NOT NULL,
  category_type character varying(50) NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NULL DEFAULT now(),
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_waste_category_totals_pkey PRIMARY KEY (system_id, category_type),
  CONSTRAINT fk_user_waste_category_totals_user FOREIGN KEY (system_id) REFERENCES user_accounts (system_id) ON DELETE CASCADE,
  CONSTRAINT chk_user_waste_category_quantity_nonnegative CHECK ((quantity >= 0)),
  CONSTRAINT chk_user_waste_category_type_valid CHECK (
    category_type IN (
      'Plastic',
      'Metal',
      'Paper',
      'Glass',
      'Organic',
      'E-Waste',
      'Other'
    )
  )
) TABLESPACE pg_default;

-- Optimized index for "top category by user" queries.
CREATE INDEX IF NOT EXISTS idx_user_waste_category_top
  ON public.user_waste_category_totals (system_id, quantity DESC);

CREATE INDEX IF NOT EXISTS idx_user_waste_category_type
  ON public.user_waste_category_totals (category_type);

CREATE OR REPLACE FUNCTION public.set_last_updated()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_user_waste_category_totals_last_updated'
      AND tgrelid = 'public.user_waste_category_totals'::regclass
  ) THEN
    CREATE TRIGGER trg_user_waste_category_totals_last_updated
    BEFORE UPDATE ON public.user_waste_category_totals
    FOR EACH ROW
    EXECUTE FUNCTION set_last_updated();
  END IF;
END
$$;

-- Example top-category query:
-- SELECT category_type, quantity
-- FROM public.user_waste_category_totals
-- WHERE system_id = '<user-system-id>'
-- ORDER BY quantity DESC
-- LIMIT 1;

-- Waste type pointing system
CREATE TABLE IF NOT EXISTS public.waste_types (
  type text NOT NULL,
  points_per_item numeric(5, 2) NOT NULL,
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT waste_types_pkey PRIMARY KEY (type)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_waste_types_type
  ON public.waste_types USING btree (type) TABLESPACE pg_default;

-- User input records for waste submissions
-- Stores waste type, quantity, recorded timestamp, and optional user linkage.
CREATE TABLE IF NOT EXISTS public.user_waste_submissions (
  submission_id uuid NOT NULL DEFAULT gen_random_uuid(),
  system_id uuid NULL,
  waste_type text NOT NULL,
  quantity integer NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_waste_submissions_pkey PRIMARY KEY (submission_id),
  CONSTRAINT fk_user_waste_submissions_user FOREIGN KEY (system_id) REFERENCES user_accounts (system_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_waste_submissions_type FOREIGN KEY (waste_type) REFERENCES waste_types (type) ON DELETE RESTRICT,
  CONSTRAINT chk_user_waste_submissions_quantity_positive CHECK (quantity > 0)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_waste_submissions_user_recorded_at
  ON public.user_waste_submissions USING btree (system_id, recorded_at DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_waste_submissions_type_recorded_at
  ON public.user_waste_submissions USING btree (waste_type, recorded_at DESC) TABLESPACE pg_default;

-- Default pointing system for supported dashboard categories
INSERT INTO public.waste_types (type, points_per_item, description)
VALUES
  ('Plastic', 1.00, 'Plastic recyclables'),
  ('Paper', 0.80, 'Paper recyclables'),
  ('Metal', 1.50, 'Metal recyclables')
ON CONFLICT (type) DO UPDATE
SET
  points_per_item = EXCLUDED.points_per_item,
  description = EXCLUDED.description;

-- Ensure faculty.test@umak.edu.ph exists in account_points
INSERT INTO public.account_points (system_id, email, campus_id, points, total_waste, total_points)
SELECT
  ua.system_id,
  ua.email,
  ua.campus_id,
  COALESCE(ap.points, 0),
  COALESCE(ap.total_waste, 0),
  COALESCE(ap.total_points, 0)
FROM public.user_accounts ua
LEFT JOIN public.account_points ap ON ap.system_id = ua.system_id
WHERE ua.email = 'faculty.test@umak.edu.ph'
ON CONFLICT (system_id) DO NOTHING;

-- Add category totals for faculty.test@umak.edu.ph with all waste categories
DO $$
DECLARE
  v_system_id uuid;
BEGIN
  SELECT ua.system_id
  INTO v_system_id
  FROM public.user_accounts ua
  WHERE ua.email = 'faculty.test@umak.edu.ph'
  LIMIT 1;

  IF v_system_id IS NOT NULL THEN
    INSERT INTO public.user_waste_category_totals (system_id, category_type, quantity)
    VALUES
      (v_system_id, 'Plastic', 15),
      (v_system_id, 'Metal', 8),
      (v_system_id, 'Paper', 12),
      (v_system_id, 'Glass', 5),
      (v_system_id, 'Organic', 20),
      (v_system_id, 'E-Waste', 3),
      (v_system_id, 'Other', 4)
    ON CONFLICT (system_id, category_type) DO UPDATE
    SET quantity = EXCLUDED.quantity;

    UPDATE public.account_points ap
    SET
      total_waste = COALESCE((
        SELECT SUM(uw.quantity)
        FROM public.user_waste_category_totals uw
        WHERE uw.system_id = v_system_id
      ), 0),
      updated_at = now()
    WHERE ap.system_id = v_system_id;
  END IF;
END
$$;

-- Seed sample category totals for one existing user who already has points.
-- Runs only if a qualifying user exists and that user has no category rows yet.
DO $$
DECLARE
  v_system_id uuid;
BEGIN
  SELECT ap.system_id
  INTO v_system_id
  FROM public.account_points ap
  WHERE COALESCE(ap.points, 0) > 0
  ORDER BY ap.points DESC, ap.updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_system_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_waste_category_totals uw
      WHERE uw.system_id = v_system_id
    ) THEN
      INSERT INTO public.user_waste_category_totals (system_id, category_type, quantity)
      VALUES
        (v_system_id, 'Plastic', 14),
        (v_system_id, 'Paper', 9),
        (v_system_id, 'Metal', 6)
      ON CONFLICT (system_id, category_type) DO NOTHING;

      UPDATE public.account_points ap
      SET
        total_waste = GREATEST(
          COALESCE(ap.total_waste, 0),
          COALESCE((
            SELECT SUM(uw.quantity)
            FROM public.user_waste_category_totals uw
            WHERE uw.system_id = v_system_id
          ), 0)
        ),
        updated_at = now()
      WHERE ap.system_id = v_system_id;
    END IF;
  END IF;
END
$$;

-- Example total points computation per user:
-- SELECT
--   uws.system_id,
--   SUM(uws.quantity * wt.points_per_item) AS computed_points
-- FROM public.user_waste_submissions uws
-- JOIN public.waste_types wt ON wt.type = uws.waste_type
-- GROUP BY uws.system_id;
