-- ============================================
-- BINS TABLE SETUP FOR SUPABASE/POSTGRESQL
-- ============================================

-- Create the updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION set_bins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create bins table
CREATE TABLE IF NOT EXISTS public.bins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  location text NULL,
  status text NOT NULL DEFAULT 'active'::text,
  capacity integer NOT NULL DEFAULT 100,
  filled_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  last_collected_at timestamp with time zone NULL,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cleared_at timestamp with time zone NULL,
  zone_id uuid NULL,
  last_maintenance_at timestamp with time zone NULL,
  latitude numeric(10, 8) NULL,
  longitude numeric(11, 8) NULL,
  
  -- Constraints
  CONSTRAINT bins_pkey PRIMARY KEY (id),
  CONSTRAINT bins_code_key UNIQUE (code),
  CONSTRAINT bins_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES admin_accounts (id) ON DELETE SET NULL,
  CONSTRAINT bins_status_check CHECK (
    status = ANY (ARRAY['active'::text, 'maintenance'::text, 'inactive'::text])
  )
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bins_code 
  ON public.bins USING btree (code) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_bins_status 
  ON public.bins USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_bins_location 
  ON public.bins USING btree (latitude, longitude) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_bins_zone_id 
  ON public.bins USING btree (zone_id) TABLESPACE pg_default;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_bins_updated_at ON bins;
CREATE TRIGGER trg_bins_updated_at 
  BEFORE UPDATE ON bins 
  FOR EACH ROW 
  EXECUTE FUNCTION set_bins_updated_at();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON public.bins TO authenticated;
-- GRANT ALL ON public.bins TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Bins table created successfully!';
  RAISE NOTICE 'Table: public.bins';
  RAISE NOTICE 'Indexes: idx_bins_code, idx_bins_status, idx_bins_location, idx_bins_zone_id';
  RAISE NOTICE 'Trigger: trg_bins_updated_at';
END $$;
