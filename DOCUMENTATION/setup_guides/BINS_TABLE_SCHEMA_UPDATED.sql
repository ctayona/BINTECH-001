-- Updated bins table with latitude and longitude for map placement
CREATE TABLE public.bins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  location text NULL,
  latitude numeric(10, 8) NULL,
  longitude numeric(11, 8) NULL,
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
  CONSTRAINT bins_pkey PRIMARY KEY (id),
  CONSTRAINT bins_code_key UNIQUE (code),
  CONSTRAINT bins_created_by_fkey FOREIGN KEY (created_by) REFERENCES admin_accounts (id) ON DELETE SET NULL,
  CONSTRAINT bins_status_check CHECK ((status = ANY (ARRAY['active'::text, 'maintenance'::text, 'inactive'::text])))
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bins_code ON public.bins USING btree (code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_bins_status ON public.bins USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_bins_zone_id ON public.bins USING btree (zone_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_bins_location ON public.bins USING btree (latitude, longitude) TABLESPACE pg_default;

-- Create trigger for updated_at timestamp
CREATE TRIGGER trg_bins_updated_at
BEFORE UPDATE ON bins
FOR EACH ROW
EXECUTE FUNCTION set_bins_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.bins IS 'Waste collection bins with location tracking for map display';
COMMENT ON COLUMN public.bins.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN public.bins.code IS 'Unique bin code (e.g., BIN-0001)';
COMMENT ON COLUMN public.bins.location IS 'Human-readable location description';
COMMENT ON COLUMN public.bins.latitude IS 'Latitude coordinate for map placement (WGS84)';
COMMENT ON COLUMN public.bins.longitude IS 'Longitude coordinate for map placement (WGS84)';
COMMENT ON COLUMN public.bins.status IS 'Bin status: active, maintenance, or inactive';
COMMENT ON COLUMN public.bins.capacity IS 'Bin capacity in liters';
COMMENT ON COLUMN public.bins.filled_percentage IS 'Current fill level as percentage (0-100)';
COMMENT ON COLUMN public.bins.last_collected_at IS 'Timestamp of last collection';
COMMENT ON COLUMN public.bins.created_by IS 'Admin user who created the bin';
COMMENT ON COLUMN public.bins.created_at IS 'Timestamp when bin was created';
COMMENT ON COLUMN public.bins.updated_at IS 'Timestamp when bin was last updated';
COMMENT ON COLUMN public.bins.cleared_at IS 'Timestamp when bin was last cleared';
COMMENT ON COLUMN public.bins.zone_id IS 'Zone identifier for bin grouping';
COMMENT ON COLUMN public.bins.last_maintenance_at IS 'Timestamp of last maintenance';
