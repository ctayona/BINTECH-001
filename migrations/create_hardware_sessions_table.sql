-- ================================================================
-- HARDWARE_SESSIONS TABLE
-- Tracks QR-based sessions between users and ESP32 devices
-- ================================================================

CREATE TABLE IF NOT EXISTS public.hardware_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,  -- FK to users
  hardware_device_id text NOT NULL,  -- ESP32 device identifier (from QR code)
  qr_code_data text NOT NULL,  -- The QR code scanned by user
  session_token text UNIQUE NOT NULL,  -- Unique token for this session
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_transfer', 'transferred', 'expired', 'cancelled')),
  
  -- Point transfer tracking
  points_earned numeric(10, 2) NOT NULL DEFAULT 0,
  points_transferred numeric(10, 2) NOT NULL DEFAULT 0,
  transfer_timestamp timestamp with time zone NULL,
  
  -- Session metadata
  items_sorted integer NOT NULL DEFAULT 0,
  waste_types_detected text[] NULL,  -- Array of waste types detected by ESP32
  session_notes text NULL,
  
  -- Timestamps
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  ended_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT hardware_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT hardware_sessions_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT hardware_sessions_points_earnings_check CHECK (points_earned >= 0),
  CONSTRAINT hardware_sessions_points_transferred_check CHECK (points_transferred >= 0)
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hardware_sessions_user_id ON public.hardware_sessions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_hardware_sessions_hardware_device_id ON public.hardware_sessions USING btree (hardware_device_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_hardware_sessions_session_token ON public.hardware_sessions USING btree (session_token) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_hardware_sessions_status ON public.hardware_sessions USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_hardware_sessions_started_at ON public.hardware_sessions USING btree (started_at) TABLESPACE pg_default;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_hardware_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hardware_sessions_updated_at 
BEFORE UPDATE ON public.hardware_sessions 
FOR EACH ROW 
EXECUTE FUNCTION set_hardware_sessions_updated_at();

-- ================================================================
-- HARDWARE_SESSION_LOG TABLE (Optional - for auditing)
-- Logs all point transfers and session activities
-- ================================================================

CREATE TABLE IF NOT EXISTS public.hardware_session_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,  -- FK to hardware_sessions
  user_id uuid NOT NULL,  -- FK to users
  event_type text NOT NULL
    CHECK (event_type IN ('session_start', 'items_sorted', 'transfer_initiated', 'transfer_completed', 'session_ended')),
  event_data jsonb NULL,  -- Store detailed event information
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT hardware_session_logs_pkey PRIMARY KEY (id),
  CONSTRAINT hardware_session_logs_session_id_fkey FOREIGN KEY (session_id) 
    REFERENCES public.hardware_sessions(id) ON DELETE CASCADE,
  CONSTRAINT hardware_session_logs_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for logging
CREATE INDEX IF NOT EXISTS idx_hardware_session_logs_session_id ON public.hardware_session_logs USING btree (session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_hardware_session_logs_user_id ON public.hardware_session_logs USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_hardware_session_logs_event_type ON public.hardware_session_logs USING btree (event_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_hardware_session_logs_created_at ON public.hardware_session_logs USING btree (created_at) TABLESPACE pg_default;
