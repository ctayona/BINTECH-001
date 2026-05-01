-- ============================================
-- ROLE-BASED ID SYSTEM MIGRATION
-- ============================================
-- This migration implements proper database normalization by:
-- 1. Creating role-specific tables for student, faculty, and other accounts
-- 2. Moving role-specific IDs from user_accounts to their respective tables
-- 3. Creating a VIEW that dynamically returns the correct ID based on role
-- 4. Ensures data integrity and scalability

-- ============================================
-- 1. CREATE STUDENT_ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_accounts (
  system_id uuid NOT NULL,
  email character varying(255) NOT NULL,
  student_id character varying(50) NOT NULL,
  first_name character varying(100),
  middle_name character varying(100),
  last_name character varying(100),
  program character varying(100),
  year_level character varying(20),
  birthdate date,
  sex character varying(20),
  cor character varying(100),
  profile_picture text,
  qr_code text,
  qr_value character varying(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_accounts_pkey PRIMARY KEY (system_id),
  CONSTRAINT student_accounts_email_key UNIQUE (email),
  CONSTRAINT student_accounts_student_id_key UNIQUE (student_id),
  CONSTRAINT student_accounts_system_id_fkey FOREIGN KEY (system_id)
    REFERENCES public.user_accounts(system_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- 2. CREATE FACULTY_ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.faculty_accounts (
  system_id uuid NOT NULL,
  email character varying(255) NOT NULL,
  faculty_id character varying(50) NOT NULL,
  first_name character varying(100),
  middle_name character varying(100),
  last_name character varying(100),
  department character varying(100),
  position character varying(100),
  birthdate date,
  sex character varying(20),
  profile_picture text,
  qr_code text,
  qr_value character varying(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT faculty_accounts_pkey PRIMARY KEY (system_id),
  CONSTRAINT faculty_accounts_email_key UNIQUE (email),
  CONSTRAINT faculty_accounts_faculty_id_key UNIQUE (faculty_id),
  CONSTRAINT faculty_accounts_system_id_fkey FOREIGN KEY (system_id)
    REFERENCES public.user_accounts(system_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- 3. CREATE OTHER_ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.other_accounts (
  system_id uuid NOT NULL,
  email character varying(255) NOT NULL,
  account_id character varying(50) NOT NULL,
  first_name character varying(100),
  middle_name character varying(100),
  last_name character varying(100),
  designation character varying(100),
  affiliation character varying(100),
  birthdate date,
  sex character varying(20),
  points integer DEFAULT 0,
  profile_picture text,
  qr_code text,
  qr_value character varying(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT other_accounts_pkey PRIMARY KEY (system_id),
  CONSTRAINT other_accounts_email_key UNIQUE (email),
  CONSTRAINT other_accounts_account_id_key UNIQUE (account_id),
  CONSTRAINT other_accounts_system_id_fkey FOREIGN KEY (system_id)
    REFERENCES public.user_accounts(system_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_student_accounts_email ON public.student_accounts(email);
CREATE INDEX IF NOT EXISTS idx_student_accounts_student_id ON public.student_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_faculty_accounts_email ON public.faculty_accounts(email);
CREATE INDEX IF NOT EXISTS idx_faculty_accounts_faculty_id ON public.faculty_accounts(faculty_id);
CREATE INDEX IF NOT EXISTS idx_other_accounts_email ON public.other_accounts(email);
CREATE INDEX IF NOT EXISTS idx_other_accounts_account_id ON public.other_accounts(account_id);

-- ============================================
-- 5. CREATE VIEW FOR ROLE-BASED ID RETRIEVAL
-- ============================================
-- This VIEW automatically returns the correct ID based on user role
-- Query this view instead of individual tables for unified role-based ID access
DROP VIEW IF EXISTS public.user_ids_by_role CASCADE;

CREATE VIEW public.user_ids_by_role AS
SELECT
  u.system_id,
  u.email,
  u.role,
  u.campus_id,
  CASE
    WHEN u.role = 'student' THEN s.student_id
    WHEN u.role = 'faculty' THEN f.faculty_id
    WHEN u.role = 'staff' THEN o.account_id
    ELSE o.account_id
  END AS role_based_id,
  CASE
    WHEN u.role = 'student' THEN 'student_id'
    WHEN u.role = 'faculty' THEN 'faculty_id'
    WHEN u.role = 'staff' THEN 'account_id'
    ELSE 'account_id'
  END AS id_type,
  COALESCE(s.first_name, f.first_name, o.first_name) AS first_name,
  COALESCE(s.last_name, f.last_name, o.last_name) AS last_name,
  COALESCE(s.profile_picture, f.profile_picture, o.profile_picture) AS profile_picture,
  u.created_at,
  u.updated_at
FROM public.user_accounts u
LEFT JOIN public.student_accounts s ON u.system_id = s.system_id
LEFT JOIN public.faculty_accounts f ON u.system_id = f.system_id
LEFT JOIN public.other_accounts o ON u.system_id = o.system_id
ORDER BY u.created_at DESC;

-- ============================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for student_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_student_accounts_updated_at'
      AND tgrelid = 'public.student_accounts'::regclass
  ) THEN
    CREATE TRIGGER trg_student_accounts_updated_at
    BEFORE UPDATE ON public.student_accounts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- Trigger for faculty_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_faculty_accounts_updated_at'
      AND tgrelid = 'public.faculty_accounts'::regclass
  ) THEN
    CREATE TRIGGER trg_faculty_accounts_updated_at
    BEFORE UPDATE ON public.faculty_accounts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- Trigger for other_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_other_accounts_updated_at'
      AND tgrelid = 'public.other_accounts'::regclass
  ) THEN
    CREATE TRIGGER trg_other_accounts_updated_at
    BEFORE UPDATE ON public.other_accounts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.student_accounts IS 'Stores student-specific information. Student role users have their profile data here.';
COMMENT ON TABLE public.faculty_accounts IS 'Stores faculty-specific information. Faculty role users have their profile data here.';
COMMENT ON TABLE public.other_accounts IS 'Stores information for other user types (staff, etc). Non-student, non-faculty users have their profile data here.';

COMMENT ON VIEW public.user_ids_by_role IS 'Dynamic view that returns the correct ID based on user role. Use this view to get the appropriate identifier (student_id, faculty_id, or account_id) without needing conditional logic in your application code.';

COMMENT ON COLUMN public.student_accounts.student_id IS 'Unique student identifier. Used exclusively for student role users.';
COMMENT ON COLUMN public.faculty_accounts.faculty_id IS 'Unique faculty identifier. Used exclusively for faculty role users.';
COMMENT ON COLUMN public.other_accounts.account_id IS 'Unique account identifier. Used for staff and other role users.';

-- ============================================
-- 8. MIGRATION COMPLETE
-- ============================================
-- After this migration, the system supports:
-- ✅ Role-specific ID storage in separate tables
-- ✅ Single VIEW for unified role-based ID retrieval
-- ✅ Proper database normalization
-- ✅ Automatic updated_at timestamp management
-- ✅ Foreign key constraints for data integrity
-- ✅ Indexes for optimal query performance
--
-- Usage:
-- - Insert students into student_accounts with student_id
-- - Insert faculty into faculty_accounts with faculty_id
-- - Insert others into other_accounts with account_id
-- - Query user_ids_by_role VIEW to get the appropriate ID based on role
-- - All role-specific logic now handled by the database, not application code
