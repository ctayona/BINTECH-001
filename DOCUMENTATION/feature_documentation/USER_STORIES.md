# BinTECH - User Stories

| ID | User Type | Feature | User Story | Priority | Complexity | Points | Status | Details |
|---|-----------|---------|-----------|----------|------------|--------|--------|---------|
| US-01 | **Student** | Registration | Register via Email with Auto-Role | Must | Low | 3 | ☐ | Email-based role classification (student/faculty/staff). Password hashing with bcrypt. Duplicate email check. API: `POST /auth/register` |
| US-02 | | | Login with Email & Password | Must | Low | 2 | ☐ | Session-based auth. Email validation. Redirect to dashboard on success. API: `POST /auth/login` |
| US-03 | | | Update Profile & Picture | Should | Low | 2 | ☐ | Update name, email, profile picture. Image upload to Supabase storage. API: `POST /auth/update-profile` |
| US-04 | | **QR Scanning** | Scan QR Code for Waste Disposal | Must | Medium | 5 | ☐ | Scan bin QR code. Validate QR code. Alert on success/failure. Database: `disposal_history` table. API: `POST /api/qr/scan` |
| US-05 | | | Auto Credit Points on Scan | Must | Medium | 5 | ☐ | Calculate points based on waste type (plastic=10, paper=8, metal=15, etc.). Deduct points on failure. Update `account_points`. API: `POST /api/qr/scan` |
| US-06 | | | View Scan History | Should | Medium | 3 | ☐ | Display last 20 scans with date & waste type. Filter by date range. API: `GET /api/qr/history` |
| US-07 | | **Dashboard** | View Personal Dashboard Stats | Must | Medium | 5 | ☐ | Display current points, lifetime points, disposal count, user level, member since date. Tables: `account_points`, `user_accounts`. API: `GET /api/dashboard/stats` |
| US-08 | | | View Current Points Balance | Must | Low | 2 | ☐ | Show current points in header/widget. Real-time update after scan/redemption. API: `GET /api/dashboard/points` |
| US-09 | | | View Waste Disposal History | Must | Medium | 3 | ☐ | Show all disposals with waste type, quantity, points earned, timestamp. Order by newest first. API: `GET /api/dashboard/history` |
| US-10 | | | View Waste by Category | Should | Medium | 3 | ☐ | Display breakdown: Plastic (qty), Paper (qty), Metal (qty). Show top category. Table: `user_waste_category_totals`. API: `GET /api/dashboard/stats` |
| US-11 | | **Rewards** | Browse Available Rewards | Must | Medium | 3 | ☐ | Display all active rewards. Show name, description, image, points cost. Filter by category. API: `GET /api/rewards/list` |
| US-12 | | | Redeem Reward with Points | Must | Medium | 5 | ☐ | Check user has enough points. Deduct points. Create redemption record. Generate coupon code. Table: `redemptions`. API: `POST /api/rewards/:id/redeem` |
| US-13 | | | Receive Coupon Email | Should | Medium | 4 | ☐ | Send HTML email with coupon code, reward name, expiry date. Use nodemailer. API: `POST /api/rewards/send-coupon` |
| US-14 | | | View Redemption History | Should | Medium | 3 | ☐ | Show all redeemed rewards with date, points spent, coupon status. API: `GET /api/rewards/user/history` |
| US-15 | | **Leaderboard** | View Global Leaderboard | Should | Medium | 3 | ☐ | Display top 10-20 users ranked by lifetime points. Show rank, name, points. Real-time updates. API: `GET /api/dashboard/leaderboard` |
| US-16 | | | See My Ranking Position | Should | Low | 2 | ☐ | Highlight user's position on leaderboard. Show rank (e.g., #5). API: `GET /api/dashboard/leaderboard` |
| US-17 | | **Peer Transfer** | Transfer Points to Another Student | Should | Medium | 5 | ☐ | Enter recipient email, transfer amount. Validate sender has enough points. Record in `peer_transfer_logs`. API: `POST /api/rewards/transfer/peer` |
| US-18 | **Admin** | Auth | Admin Login | Must | Low | 2 | ☐ | Email & password login. Generate Bearer token. Check admin role. Protect admin routes. API: `POST /auth/login` |
| US-19 | | | Admin Profile Settings | Should | Low | 2 | ☐ | Update full name, phone, profile picture. View admin details. Table: `admin_accounts`. API: `GET/PUT /api/admin/settings` |
| US-20 | | **Bins** | Add New Collection Bin | Must | Medium | 4 | ☐ | Enter location, capacity. Auto-generate QR code. Set fill percentage. Save to `bins` table. API: `POST /api/admin/bins` |
| US-21 | | | View All Bins & Status | Must | Medium | 3 | ☐ | List bins with location, QR code, fill %, status (active/inactive). Sort by status. API: `GET /api/admin/bins` |
| US-22 | | | Update Bin Information | Should | Low | 3 | ☐ | Modify location, capacity, fill percentage, status. API: `PUT /api/admin/bins/:id` |
| US-23 | | | Delete Bins | Should | Low | 2 | ☐ | Archive/delete inactive bins. Soft delete preferred. API: `DELETE /api/admin/bins/:id` |
| US-24 | | **Collections** | Record Collection Event | Must | Medium | 4 | ☐ | Log date, bin location, weight (kg), material type, collector. Table: `collections`. API: `POST /api/admin/collection-logs` |
| US-25 | | | View Collection History | Must | Medium | 3 | ☐ | Display all collections with date, location, weight, material. Sort by newest first. API: `GET /api/admin/collections` |
| US-26 | | | Filter by Date/Bin | Should | Medium | 3 | ☐ | Filter collections by date range & bin location. Search functionality. API: `GET /api/admin/collections?date=X&bin=Y` |
| US-27 | | **Rewards** | Create New Reward | Must | Medium | 4 | ☐ | Enter name, description, points cost. Set active status. Table: `rewards`. API: `POST /api/admin/rewards` |
| US-28 | | | Upload Reward Image | Must | Medium | 3 | ☐ | Upload image file (max 5MB). Store in Supabase storage. Get public URL. Validation: JPEG/PNG/GIF/WebP. API: `POST /api/admin/upload-reward-image` |
| US-29 | | | View All Rewards | Must | Medium | 2 | ☐ | List all rewards (active & inactive). Show name, image, points cost, status. API: `GET /api/admin/rewards` |
| US-30 | | | Update Reward | Should | Low | 3 | ☐ | Modify name, description, points cost, image, status. API: `PUT /api/admin/rewards/:id` |
| US-31 | | | Delete Reward | Should | Low | 2 | ☐ | Archive or delete reward. API: `DELETE /api/admin/rewards/:id` |
| US-32 | | **Schedules** | Create Collection Schedule | Should | Medium | 5 | ☐ | Set date, time, assign bins, assign collector. Table: `schedules`. API: `POST /api/admin/schedule` |
| US-33 | | | Assign Bins to Route | Should | Medium | 4 | ☐ | Select multiple bins for single schedule. Set priority. API: `POST /api/admin/schedule` |
| US-34 | | | View Schedules | Should | Medium | 2 | ☐ | Display all schedules with date, bins, assigned collector, status. API: `GET /api/admin/schedule` |
| US-35 | | **Users** | View All User Accounts | Must | Medium | 3 | ☐ | List all users with email, campus ID, current points, lifetime points, role. Paginate if needed. API: `GET /api/admin/users/all` |
| US-36 | | | Adjust Student Points | Must | Low | 3 | ☐ | Add/deduct points manually. Record adjustment reason. Update `account_points`. API: `PUT /api/admin/user-points/:email` |
| US-37 | | | Deactivate/Reactivate Account | Should | Low | 2 | ☐ | Set user account status (active/inactive). API: `PUT /api/admin/accounts/:email` |
| US-38 | | | Search & Filter Users | Should | Medium | 2 | ☐ | Search by email, name, campus ID. Filter by role, status. API: `GET /api/admin/users/all?search=X&role=Y` |
| US-39 | | **Analytics** | View Dashboard Summary | Must | Low | 2 | ☐ | Display KPIs: total bins, active bins, today's collections, active routes. API: `GET /api/admin/summary` |
| US-40 | | | View Collections Today | Must | Low | 2 | ☐ | Count & weight collected today. Real-time updates. API: `GET /api/admin/summary` |
| US-41 | | | View Weekly Trends | Should | Medium | 4 | ☐ | Bar chart: weight collected per day last 7 days. Table: `collections`. API: `GET /api/admin/summary` |
| US-42 | | | View Waste Distribution | Should | Medium | 3 | ☐ | Pie/bar chart: waste by type (plastic, paper, metal, etc.). Table: `user_waste_category_totals`. API: `GET /api/admin/summary` |
| US-43 | **Public** | Landing | Landing Page Overview | Should | Low | 2 | ☐ | Display project name, tagline, key features, benefits. Call-to-action buttons. Route: `GET /` |
| US-44 | | | Call-to-Action (Login/Register) | Should | Low | 1 | ☐ | Login/Register buttons on landing. Link to login page. Route: `GET /login` → `/` |
| US-45 | | | How It Works Page | Could | Low | 2 | ☐ | Visual step-by-step guide. Show user journey. Route: `GET /how-it-works` |
| US-46 | | | Public Rewards Catalog | Should | Low | 2 | ☐ | Display available rewards (no login). Show name, image, points cost. Route: `GET /rewards` |

---

## Summary
- **Total Stories:** 46
- **Must Have:** 17 (37%)
- **Should Have:** 23 (50%)
- **Could Have:** 6 (13%)
- **Total Points:** 155

## How to Use
1. Copy this table into your project management tool (Jira, Azure DevOps, Trello)
2. Update Status column as work progresses: ☐ → 🔄 → ✅
3. Each story includes API endpoint and database table references
4. Stories are ordered by priority, then by user type
