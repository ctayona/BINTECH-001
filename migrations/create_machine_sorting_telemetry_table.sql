-- Combined telemetry table for BINTECH-SORTER-001
-- Stores live capacity, cumulative material counts, and generated points in one row per machine.

create table if not exists public.machine_sorting_telemetry (
  machine_id text primary key,
  metal_fill_percentage integer not null default 0,
  plastic_fill_percentage integer not null default 0,
  paper_fill_percentage integer not null default 0,
  metal_status text not null default 'ACTIVE',
  plastic_status text not null default 'ACTIVE',
  paper_status text not null default 'ACTIVE',
  metal_count integer not null default 0,
  plastic_count integer not null default 0,
  paper_count integer not null default 0,
  total_waste_sorted integer not null default 0,
  total_points_generated numeric(12,2) not null default 0,
  last_session_id text,
  last_user_id text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_machine_sorting_telemetry_updated_at
  on public.machine_sorting_telemetry (updated_at desc);
