-- Add Student User Account
-- Insert a new student record into the user_accounts table

INSERT INTO public.user_accounts (
  system_id,
  campus_id,
  role,
  email,
  password,
  google_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'STUDENT-001',
  'student',
  'student@umak.edu.ph',
  NULL,
  NULL,
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Alternative: Multiple student users
-- INSERT INTO public.user_accounts (campus_id, role, email, password, google_id, created_at, updated_at) 
-- VALUES 
-- ('STUDENT-001', 'student', 'student1@umak.edu.ph', NULL, NULL, now(), now()),
-- ('STUDENT-002', 'student', 'student2@umak.edu.ph', NULL, NULL, now(), now()),
-- ('STUDENT-003', 'student', 'student3@umak.edu.ph', NULL, NULL, now(), now())
-- ON CONFLICT (email) DO NOTHING;

-- Create associated account_points record for the student
INSERT INTO public.account_points (
  system_id,
  email,
  campus_id,
  points,
  total_points,
  total_waste,
  updated_at
)
SELECT 
  user_accounts.system_id,
  user_accounts.email,
  user_accounts.campus_id,
  0,
  0,
  0,
  now()
FROM public.user_accounts
WHERE user_accounts.email = 'student@umak.edu.ph'
  AND user_accounts.role = 'student'
ON CONFLICT (email) DO NOTHING;
