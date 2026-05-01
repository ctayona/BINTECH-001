-- ================================================================
-- MACHINE_SESSIONS TABLE
-- Tracks ESP32 waste sorter sessions linked to BinTECH system
-- Uses: system_id from user_accounts table (NOT uuid users table)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.machine_sessions (
  id text NOT NULL PRIMARY KEY,  -- SESSION_TIMESTAMP_TOKEN format
  user_id text NOT NULL,  -- FK to user_accounts.system_id (NOT uuid)
  hardware_device_id text NOT NULL,  -- ESP32 device identifier (e.g., BINTECH-SORTER-001)
  
  -- Session state
  is_active boolean NOT NULL DEFAULT true,
  session_started_at timestamp with time zone NOT NULL DEFAULT now(),
  session_ended_at timestamp with time zone NULL,
  
  -- Point tracking
  metal_count integer NOT NULL DEFAULT 0,
  plastic_count integer NOT NULL DEFAULT 0,
  paper_count integer NOT NULL DEFAULT 0,
  session_points numeric(10, 2) NOT NULL DEFAULT 0,
  points_transferred boolean NOT NULL DEFAULT false,
  transfer_timestamp timestamp with time zone NULL,
  
  -- Session metadata
  session_notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key to user_accounts
  CONSTRAINT machine_sessions_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.user_accounts(system_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_machine_sessions_user_id ON public.machine_sessions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_machine_sessions_hardware_device_id ON public.machine_sessions USING btree (hardware_device_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_machine_sessions_is_active ON public.machine_sessions USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_machine_sessions_started_at ON public.machine_sessions USING btree (session_started_at) TABLESPACE pg_default;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_machine_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_machine_sessions_updated_at 
BEFORE UPDATE ON public.machine_sessions 
FOR EACH ROW 
EXECUTE FUNCTION set_machine_sessions_updated_at();

-- ================================================================
-- HARDWARE_SESSION_LOGS TABLE (Optional - for auditing)
-- Logs all machine session activities
-- ================================================================

CREATE TABLE IF NOT EXISTS public.machine_session_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL,  -- FK to machine_sessions
  user_id text NOT NULL,  -- FK to user_accounts.system_id
  event_type text NOT NULL
    CHECK (event_type IN ('session_start', 'item_sorted', 'transfer_initiated', 'transfer_completed', 'session_ended', 'error')),
  event_data jsonb NULL,  -- Store detailed event information
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT machine_session_logs_pkey PRIMARY KEY (id),
  CONSTRAINT machine_session_logs_session_id_fkey FOREIGN KEY (session_id) 
    REFERENCES public.machine_sessions(id) ON DELETE CASCADE,
  CONSTRAINT machine_session_logs_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.user_accounts(system_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for logging
CREATE INDEX IF NOT EXISTS idx_machine_session_logs_session_id ON public.machine_session_logs USING btree (session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_machine_session_logs_user_id ON public.machine_session_logs USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_machine_session_logs_event_type ON public.machine_session_logs USING btree (event_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_machine_session_logs_created_at ON public.machine_session_logs USING btree (created_at) TABLESPACE pg_default;
