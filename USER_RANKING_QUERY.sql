-- User Ranking Query
-- Ranks users based on their points in descending order (highest points = Rank #1)

-- Query 1: Get user rank and total users
-- This query returns the rank of a specific user and the total number of users
SELECT 
  ap.system_id,
  ap.email,
  ap.points,
  ap.campus_id,
  COUNT(*) OVER () as total_users,
  ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank
FROM account_points ap
WHERE ap.email = $1  -- Replace with user email
LIMIT 1;

-- Query 2: Get top 10 ranked users
-- This query returns the top 10 users by points
SELECT 
  ap.system_id,
  ap.email,
  ap.points,
  ap.campus_id,
  ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank,
  ua.first_name,
  ua.last_name
FROM account_points ap
LEFT JOIN user_accounts ua ON ap.system_id = ua.system_id
ORDER BY ap.points DESC, ap.updated_at DESC
LIMIT 10;

-- Query 3: Get user rank with surrounding users (top 5 above and below)
-- This query returns a user's rank with 5 users above and 5 users below
WITH ranked_users AS (
  SELECT 
    ap.system_id,
    ap.email,
    ap.points,
    ap.campus_id,
    ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank,
    ua.first_name,
    ua.last_name
  FROM account_points ap
  LEFT JOIN user_accounts ua ON ap.system_id = ua.system_id
)
SELECT *
FROM ranked_users
WHERE rank >= (SELECT rank - 5 FROM ranked_users WHERE email = $1)
  AND rank <= (SELECT rank + 5 FROM ranked_users WHERE email = $1)
ORDER BY rank ASC;

-- Query 4: Get user rank with total users count
-- This is the most useful query for dashboard display
WITH ranked_users AS (
  SELECT 
    ap.system_id,
    ap.email,
    ap.points,
    ap.campus_id,
    ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank
  FROM account_points ap
),
total_count AS (
  SELECT COUNT(*) as total_users FROM account_points
)
SELECT 
  ru.system_id,
  ru.email,
  ru.points,
  ru.campus_id,
  ru.rank,
  tc.total_users
FROM ranked_users ru
CROSS JOIN total_count tc
WHERE ru.email = $1;

-- Query 5: Get leaderboard with pagination
-- This query returns a paginated leaderboard
SELECT 
  ap.system_id,
  ap.email,
  ap.points,
  ap.campus_id,
  ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank,
  ua.first_name,
  ua.last_name,
  COUNT(*) OVER () as total_users
FROM account_points ap
LEFT JOIN user_accounts ua ON ap.system_id = ua.system_id
ORDER BY ap.points DESC, ap.updated_at DESC
LIMIT $1 OFFSET $2;  -- $1 = limit (e.g., 10), $2 = offset (e.g., 0)

-- Query 6: Get user rank percentile
-- This query returns what percentile the user is in
WITH ranked_users AS (
  SELECT 
    ap.system_id,
    ap.email,
    ap.points,
    ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank,
    COUNT(*) OVER () as total_users
  FROM account_points ap
)
SELECT 
  system_id,
  email,
  points,
  rank,
  total_users,
  ROUND(((total_users - rank + 1) * 100.0 / total_users)::numeric, 2) as percentile
FROM ranked_users
WHERE email = $1;

-- Query 7: Get users ranked by points with all stats
-- This is the comprehensive query for dashboard
WITH ranked_users AS (
  SELECT 
    ap.system_id,
    ap.email,
    ap.points,
    ap.campus_id,
    ap.total_waste,
    ap.total_points,
    ap.updated_at,
    ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank,
    COUNT(*) OVER () as total_users
  FROM account_points ap
)
SELECT 
  ru.system_id,
  ru.email,
  ru.points,
  ru.campus_id,
  ru.total_waste,
  ru.total_points,
  ru.updated_at,
  ru.rank,
  ru.total_users,
  ROUND(((ru.total_users - ru.rank + 1) * 100.0 / ru.total_users)::numeric, 2) as percentile,
  CASE 
    WHEN ru.rank = 1 THEN '🥇 #1'
    WHEN ru.rank = 2 THEN '🥈 #2'
    WHEN ru.rank = 3 THEN '🥉 #3'
    WHEN ru.rank <= 10 THEN '⭐ Top 10'
    WHEN ru.rank <= 100 THEN '✨ Top 100'
    ELSE 'Participant'
  END as rank_badge
FROM ranked_users ru
WHERE ru.email = $1;

-- Query 8: Get rank statistics
-- This query returns ranking statistics
SELECT 
  COUNT(*) as total_users,
  MAX(ap.points) as highest_points,
  MIN(ap.points) as lowest_points,
  ROUND(AVG(ap.points)::numeric, 2) as average_points,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ap.points) as median_points,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ap.points) as percentile_75,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY ap.points) as percentile_90,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ap.points) as percentile_95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY ap.points) as percentile_99
FROM account_points ap;

-- Query 9: Get user rank with comparison to average
-- This query shows how user compares to average
WITH ranked_users AS (
  SELECT 
    ap.system_id,
    ap.email,
    ap.points,
    ROW_NUMBER() OVER (ORDER BY ap.points DESC, ap.updated_at DESC) as rank,
    COUNT(*) OVER () as total_users,
    AVG(ap.points) OVER () as avg_points
  FROM account_points ap
)
SELECT 
  system_id,
  email,
  points,
  rank,
  total_users,
  avg_points,
  (points - avg_points) as points_above_average,
  ROUND(((points - avg_points) / avg_points * 100)::numeric, 2) as percent_above_average
FROM ranked_users
WHERE email = $1;

-- Query 10: Get top users by role
-- This query returns top users grouped by role
WITH ranked_by_role AS (
  SELECT 
    ap.system_id,
    ap.email,
    ap.points,
    ap.campus_id,
    ua.role,
    ua.first_name,
    ua.last_name,
    ROW_NUMBER() OVER (PARTITION BY ua.role ORDER BY ap.points DESC, ap.updated_at DESC) as rank_in_role,
    COUNT(*) OVER (PARTITION BY ua.role) as total_in_role
  FROM account_points ap
  LEFT JOIN user_accounts ua ON ap.system_id = ua.system_id
)
SELECT *
FROM ranked_by_role
WHERE rank_in_role <= 5
ORDER BY ua.role, rank_in_role;
