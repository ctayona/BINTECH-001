# 🚀 BinTECH - COMPLETE RENDER DEPLOYMENT GUIDE

**Last Updated**: May 1, 2026  
**Status**: PRODUCTION READY  
**Project**: BinTECH - Intelligent Waste Segregation & Incentive Platform

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Project Overview](#project-overview)
3. [Architecture & Integration](#architecture--integration)
4. [Render Deployment Process](#render-deployment-process)
5. [Environment Variables Setup](#environment-variables-setup)
6. [Database Configuration](#database-configuration)
7. [ESP32 Hardware Integration](#esp32-hardware-integration)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
10. [Rollback & Disaster Recovery](#rollback--disaster-recovery)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Required Accounts & Access
- [ ] GitHub account created
- [ ] Render account created (free tier available)
- [ ] Supabase account with active project
- [ ] Google Cloud Console project with OAuth credentials
- [ ] Gmail account (for email notifications - optional)

### Project Requirements
- [ ] `package.json` verified ✓
- [ ] `.gitignore` configured ✓
- [ ] `Procfile` created ✓
- [ ] `.env` file is NOT committed ✓
- [ ] ESP32 firmware file saved ✓
- [ ] All dependencies installed locally

### Git Repository
- [ ] Local git repository initialized ✓
- [ ] All files committed
- [ ] Ready to push to GitHub

---

## 📊 PROJECT OVERVIEW

### What is BinTECH?

BinTECH is a **full-stack waste management gamification platform** that:
- ♻️ Enables intelligent waste segregation through IoT hardware
- ⭐ Rewards users with points for proper disposal
- 📊 Provides real-time leaderboards and analytics
- 🏫 Designed for college campus deployment
- 🔌 Integrates ESP32 hardware with web dashboard

### Tech Stack

```
┌─────────────────────────────────────────────┐
│            CLIENT (Browser)                 │
│   HTML5 | CSS3 (Tailwind) | JavaScript      │
└─────────────────────────────────────────────┘
                      ↓ HTTPS
┌─────────────────────────────────────────────┐
│      BACKEND (Node.js + Express)            │
│      Running on: Render Web Service         │
│      Port: 3000 (Render assigns)            │
└─────────────────────────────────────────────┘
       ↓ REST API      ↓ WebSocket
┌──────────────────┐  ┌─────────────────────┐
│ Supabase (Psql)  │  │  ESP32 Hardware     │
│ Database         │  │  (Local Network)    │
└──────────────────┘  └─────────────────────┘
```

### Core Features

**User Features:**
- ✓ User registration & authentication (Google OAuth + Email)
- ✓ QR code scanning for waste disposal
- ✓ Real-time point tracking
- ✓ Leaderboard rankings
- ✓ Reward browsing & redemption
- ✓ Profile management with photo upload
- ✓ Password recovery system

**Admin Features:**
- ✓ Bin management (create, edit, monitor)
- ✓ Collection tracking with weights & timestamps
- ✓ Reward catalog management
- ✓ Schedule management for collections
- ✓ Analytics dashboard & reporting
- ✓ User management & archival

**Hardware Features:**
- ✓ ESP32-based waste material detection
- ✓ Metal/Plastic/Paper classification
- ✓ Ultrasonic bin occupancy detection
- ✓ Real-time point crediting
- ✓ Bin capacity telemetry
- ✓ WiFi connectivity & backend sync

---

## 🏗️ ARCHITECTURE & INTEGRATION

### API Endpoints

#### ESP32 Hardware Endpoints (Called by IoT Device)
```
POST   /api/waste-sorter/api/session/update
  ↳ Update points earned in active session
  ↳ Payload: {machineId, sessionId, metalCount, plasticCount, 
              paperCount, totalPoints, binCapacities}

GET    /api/waste-sorter/api/device/:deviceId/session
  ↳ Sync active session from backend
  ↳ Response: {success, session: {sessionId, isActive, pointsEarned}}

POST   /api/waste-sorter/api/bin-capacity
  ↳ Push real-time bin fill percentages
  ↳ Payload: {machineId, capacities: {metal, plastic, paper}}

POST   /api/waste-sorter/api/bin-warning
  ↳ Notify when bins reach full capacity
  ↳ Payload: {machineId, binType, isFull, fillPercentage, timestamp}
```

#### User Dashboard Endpoints
```
GET    /api/dashboard/user
  ↳ Get user stats & leaderboard position

POST   /api/rewards/redeem
  ↳ Redeem reward with points

GET    /api/leaderboard
  ↳ Get top rankings
```

#### Admin Endpoints
```
POST   /api/admin/bins
GET    /api/admin/bins

POST   /api/admin/rewards
GET    /api/admin/rewards

GET    /api/admin/analytics
```

### Database Schema

**Core Tables:**
- `users` - User accounts with Google OAuth integration
- `user_sessions` - Active session tracking
- `waste_disposal_events` - Individual item disposals
- `rewards` - Reward catalog
- `redemption_history` - Point tracking
- `bins` - Physical bin inventory
- `collection_logs` - Collection history
- `hardware_sessions` - ESP32 device sessions

---

## 🚀 RENDER DEPLOYMENT PROCESS

### STEP 1: Prepare GitHub Repository

#### 1.1 Create GitHub Repository
```bash
# Go to https://github.com/new
# Repository name: bintech
# Description: Intelligent Waste Segregation & Incentive Platform
# Do NOT initialize with README (we have one)
# Click "Create repository"
```

#### 1.2 Get GitHub Personal Access Token
```
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click "Generate new token"
3. Name: "Render Deployment"
4. Scopes: Select "repo" (full repo access)
5. Click "Generate token"
6. COPY the token immediately (you won't see it again!)
```

#### 1.3 Push Code to GitHub
```bash
cd d:\tample

git remote add origin https://github.com/YOUR_USERNAME/bintech.git
git branch -M main
git push -u origin main

# When prompted for password: paste your Personal Access Token (not password)
# Successfully pushed? Verify at https://github.com/YOUR_USERNAME/bintech
```

### STEP 2: Create Render Web Service

#### 2.1 Sign Up for Render
```
1. Go to https://render.com
2. Click "Sign up"
3. Select "Sign up with GitHub" (easiest)
4. Authorize Render to access your GitHub account
5. Verify email (check inbox)
```

#### 2.2 Create Web Service
```
1. In Render Dashboard → Click "New +" → Select "Web Service"
2. Click "Build and deploy from a Git repository"
3. Click "Connect GitHub Account" (if not already connected)
4. Search for and select: bintech
5. Configure settings:
   - Name: bintech (or preferred name)
   - Environment: Node
   - Region: Select closest to your users
     • US East: ashburn (Virginia)
     • US West: oregon
     • Europe: frankfurt
     • Asia-Pacific: singapore
   - Branch: main
   - Build Command: npm install
   - Start Command: npm start
6. Do NOT click Deploy yet → Go to Step 3 first
```

### STEP 3: Configure Environment Variables

#### 3.1 Add Environment Variables in Render

In Render Dashboard → Your service → "Environment" tab → Click "Add Environment Variable"

Add each variable individually:

```
NODE_ENV
value: production

PORT
value: (Leave blank - Render sets this automatically)

SUPABASE_URL
value: https://your-project.supabase.co
(Get from: Supabase Dashboard → Settings → API → Project URL)

SUPABASE_ANON_KEY
value: eyJhbGc... (long key)
(Get from: Supabase Dashboard → Settings → API → anon public)

SUPABASE_SERVICE_ROLE_KEY
value: eyJhbGc... (different long key)
(Get from: Supabase Dashboard → Settings → API → service_role secret)
⚠️ KEEP THIS SECRET! Don't share publicly!

GOOGLE_CLIENT_ID
value: 123456789-abc...@apps.googleusercontent.com
(Get from: Google Cloud Console → APIs & Services → Credentials)

GOOGLE_CLIENT_SECRET
value: GOCSPX-xxxxx...
(Get from: Google Cloud Console → APIs & Services → Credentials)
⚠️ KEEP THIS SECRET!

GOOGLE_CALLBACK_URL
value: https://bintech.onrender.com/auth/google/callback
⚠️ Replace "bintech" with your actual Render service name!
⚠️ This must match Google Console authorized redirect URI!

VITE_GOOGLE_CLIENT_ID
value: (same as GOOGLE_CLIENT_ID)

JWT_SECRET
value: (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

SESSION_SECRET
value: (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

FRONTEND_URL
value: https://bintech.onrender.com
(Replace "bintech" with your actual service name)

EMAIL_HOST
value: smtp.gmail.com
(Optional - only if using email notifications)

EMAIL_PORT
value: 587
(Optional)

EMAIL_USER
value: your-email@gmail.com
(Optional - use App Password, not regular password)

EMAIL_PASSWORD
value: your-app-password
(Optional - Google App Password from: Account → Security → App Passwords)
```

#### 3.2 Generate Secrets Locally

Open a terminal and run:
```bash
node -e "console.log('JWT_SECRET: ' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET: ' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into Render environment variables.

### STEP 4: Update Google OAuth Configuration

#### 4.1 Get Render URL
After deploying (Step 5), your URL will be:
```
https://bintech.onrender.com  (or your custom service name)
```

#### 4.2 Update in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click your Web application OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add:
   ```
   https://bintech.onrender.com/auth/google/callback
   ```
6. Click "Save"
7. Update Render env var `GOOGLE_CALLBACK_URL` to match

### STEP 5: Deploy!

#### 5.1 Trigger Deployment
```
1. In Render Dashboard → Your service
2. Click the "Deploy" button
3. Watch the build logs scroll
   • "Installing dependencies..." - npm install
   • "Building..." - preparing app
   • "Started" - app is running
4. Wait for status to show "Live"
```

**Build Time**: 2-5 minutes (first time longer)

**Live Indicator**: When you see "Live" in green, your app is deployed!

#### 5.2 Access Your App
```
Visit: https://bintech.onrender.com
(or your custom service name if different)
```

---

## 🔧 ENVIRONMENT VARIABLES SETUP

### Where to Find Each Value

#### Supabase Variables
**How to get:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to "Settings" → "API"
4. You'll see:
   - Project URL → `SUPABASE_URL`
   - "anon public" key → `SUPABASE_ANON_KEY`
   - "service_role secret" key → `SUPABASE_SERVICE_ROLE_KEY`

#### Google OAuth Variables
**How to get:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create new)
3. Enable "Google+ API"
4. Go to "APIs & Services" → "Credentials"
5. Click "Create Credentials" → "OAuth 2.0 Client ID"
6. Choose "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for local testing)
   - `https://bintech.onrender.com/auth/google/callback` (for production)
8. You'll get:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

#### Email Variables (Optional)
**For Gmail:**
1. Go to Google Account → [Security Settings](https://myaccount.google.com/security)
2. Enable "2-Step Verification"
3. Go to "App passwords"
4. Generate app password for "Mail"
5. Copy password (16 characters with spaces)
6. Use as `EMAIL_PASSWORD`
7. Use your Gmail address as `EMAIL_USER`

---

## 🗄️ DATABASE CONFIGURATION

### Supabase Setup

#### 1. Create Tables

Your project should have these tables already created. If not, run in Supabase SQL Editor:

**users table**
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255),
  full_name VARCHAR(255),
  profile_picture_url TEXT,
  points INT DEFAULT 0,
  total_disposed_items INT DEFAULT 0,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waste_disposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  machine_id VARCHAR(255),
  material_type VARCHAR(50),
  points_awarded DECIMAL(10, 2),
  weight_kg DECIMAL(10, 2),
  disposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INT NOT NULL,
  quantity_available INT,
  reward_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS redemption_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id),
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Verify Connection

Run locally first:
```bash
npm install
npm start
# Visit http://localhost:3000
# Check if database queries work
```

---

## 🔌 ESP32 HARDWARE INTEGRATION

### Hardware Setup

The ESP32 firmware is in: `ESP32_WASTE_SORTER.ino`

#### 1. Configure ESP32 for Your Backend

Edit these lines in the Arduino code:
```cpp
// Line 7-8: Change to your Render URL
const String BACKEND_URL = "https://bintech.onrender.com";

// Lines 13-21: Add your WiFi networks
const char* ssids[] = {
  "Your_WiFi_SSID_1",
  "Your_WiFi_SSID_2",
  ""
};

const char* passwords[] = {
  "Your_WiFi_Password_1",
  "Your_WiFi_Password_2",
  ""
};

// Line 25: Machine ID (unique identifier)
const String MACHINE_ID = "BINTECH-SORTER-001";
```

#### 2. Upload to ESP32

1. Install Arduino IDE
2. Add ESP32 board support
3. Install required libraries:
   - ESP32Servo
   - WiFi
   - WebServer
   - ArduinoJson
   - HTTPClient
4. Open `ESP32_WASTE_SORTER.ino`
5. Select Board: "ESP32 Dev Module"
6. Select COM port
7. Click Upload

#### 3. Test Hardware Connection

Once deployed to Render:
1. Power on ESP32 device
2. Watch Serial Monitor for connection status
3. Check Render logs for incoming requests
4. Verify points are being recorded

### ESP32 API Flow

```
ESP32 Device
    ↓
[Every 5 seconds]
    ↓
POST /api/waste-sorter/api/session/update
    ↓ (sends points & counts)
Backend receives → stores in Supabase
    ↓
Response: {status: "success"}
    ↓
ESP32 continues scanning for waste
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Check Website Access

**Test these URLs:**

1. **Landing Page**
   ```
   https://bintech.onrender.com/
   Expected: Page loads, no 500 errors
   ```

2. **How It Works**
   ```
   https://bintech.onrender.com/how-it-works
   Expected: Information page loads
   ```

3. **Rewards Page**
   ```
   https://bintech.onrender.com/rewards
   Expected: Reward catalog displays
   ```

### 2. Test Authentication

1. **Google Sign-In**
   - Click "Sign in with Google"
   - Should redirect to Google login
   - After login, should return to dashboard
   - Check user is created in Supabase

2. **Email/Password Registration**
   - Click "Sign up"
   - Fill form with test data
   - Create account
   - Verify in Supabase → users table

### 3. Test Core Features

1. **User Dashboard**
   - Log in as test user
   - Check stats display
   - Verify points calculation

2. **Leaderboard**
   - Check rankings display
   - Verify sorting order

3. **Profile Management**
   - Update profile info
   - Test profile picture upload (optional)

4. **Admin Panel** (if you have admin account)
   - Log in as admin
   - Access `/admin/dashboard`
   - Test bin management

### 4. Check Logs

In Render Dashboard:
1. Go to "Logs" tab
2. Look for errors
3. Common issues:
   ```
   Error: Cannot connect to SUPABASE_URL
   → Check env variables

   Error: Invalid GOOGLE credentials
   → Verify Google Console setup

   TypeError: env.VARIABLE_NAME is undefined
   → Variable not set in Render
   ```

---

## 📊 MONITORING & TROUBLESHOOTING

### Common Issues & Solutions

#### Issue 1: 503 Service Unavailable

**Cause**: Service is starting or free tier cold start

**Solution**:
```
- Wait 30-60 seconds
- Refresh page
- First request on free tier takes time
- Upgrade to paid tier to prevent sleeping
```

#### Issue 2: "Cannot connect to database"

**Cause**: Supabase credentials are wrong

**Solution**:
```
1. Verify SUPABASE_URL in Render env vars
2. Verify SUPABASE_ANON_KEY is correct
3. Check Supabase project is active
4. Restart service: Settings → Restart Web Service
```

#### Issue 3: "Google OAuth failed"

**Cause**: Redirect URI mismatch

**Solution**:
```
1. Copy your Render URL: https://bintech.onrender.com
2. Go to Google Cloud Console
3. Update redirect URI to: https://bintech.onrender.com/auth/google/callback
4. Save changes
5. Update Render env var GOOGLE_CALLBACK_URL
6. Clear browser cache and try again
```

#### Issue 4: Build Fails with "module not found"

**Cause**: Dependency missing in package.json

**Solution**:
```bash
npm install --save missing-package
git add .
git commit -m "Add missing dependency"
git push origin main
# Render auto-redeploys
```

#### Issue 5: ESP32 Cannot Connect

**Cause**: Backend URL wrong or WiFi issues

**Solution**:
```
1. Update BACKEND_URL in ESP32 code to your Render URL
2. Check ESP32 WiFi credentials
3. Verify ESP32 has internet connectivity
4. Check firewall/network settings
5. Monitor Render logs for incoming requests
```

### View Logs

**In Render Dashboard:**
1. Select your service
2. Click "Logs" tab
3. Real-time logs display
4. Errors appear in red

**Useful grep patterns:**
```
[Error]         → Find all errors
[Backend]       → ESP32 backend calls
[SESSION]       → Session events
[WiFi]          → WiFi connection issues
```

### Performance Monitoring

**Check uptime & metrics:**
1. Render Dashboard → Metrics tab
2. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

---

## 🔄 CONTINUOUS DEPLOYMENT

### Workflow: Update Code & Redeploy

```bash
# 1. Make changes locally
# (edit files, test)

# 2. Commit changes
git add .
git commit -m "Describe your changes"

# 3. Push to GitHub
git push origin main

# 4. Render automatically detects push
# 5. Render automatically redeploys
# (watch in Render Dashboard → Deployments tab)

# 6. New version is live within 3-5 minutes!
```

**No manual redeploy needed** - it's automatic!

---

## 🔙 ROLLBACK & DISASTER RECOVERY

### Rollback to Previous Version

If new deployment breaks things:

**Option 1: Render Dashboard**
1. Go to "Deployments" tab
2. Click previous successful deployment
3. Click "Rollback"
4. Service reverts to previous version

**Option 2: Git Revert**
```bash
# Find commit to revert to
git log --oneline

# Revert to specific commit
git revert abc1234def567  # Replace with commit hash

# Push changes
git push origin main

# Render auto-redeploys with reverted code
```

### Backup Database

Supabase automatic backups:
1. Supabase Dashboard → Backups (Pro plan)
2. Free tier: Manual backups

**Manual backup:**
```sql
-- In Supabase SQL Editor, export tables as SQL
SELECT * FROM users;
SELECT * FROM waste_disposal_events;
SELECT * FROM rewards;
-- Copy/save the data
```

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

### Week 1: Testing
- [ ] All features tested
- [ ] Bugs reported & fixed
- [ ] Admin users created
- [ ] Sample bins configured
- [ ] Rewards created

### Week 2-4: Campus Rollout
- [ ] Deploy ESP32 hardware at bins
- [ ] Distribute QR codes
- [ ] Launch marketing campaign
- [ ] Monitor usage & performance
- [ ] Collect user feedback

### Ongoing: Maintenance
- [ ] Monitor logs for errors
- [ ] Update content (rewards, announcements)
- [ ] Track performance metrics
- [ ] Plan feature enhancements

---

## 📞 QUICK REFERENCE

### Important URLs
- Render Dashboard: https://render.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Google Cloud Console: https://console.cloud.google.com
- GitHub Repository: https://github.com/YOUR_USERNAME/bintech

### Helpful Commands

**Local Development:**
```bash
npm install          # Install dependencies
npm start           # Start server locally
npm test            # Run tests
npm run dev         # Start with nodemon (auto-reload)
```

**Git Operations:**
```bash
git status          # Check changes
git add .           # Stage all changes
git commit -m "msg" # Commit
git push origin main # Push to GitHub
git pull origin main # Pull latest
```

**Generate Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✨ YOU'RE DEPLOYED!

Your BinTECH application is now **LIVE on Render**! 🎉

**What's Running:**
- ✅ Web server at https://bintech.onrender.com
- ✅ Database connected to Supabase
- ✅ Google OAuth ready
- ✅ ESP32 hardware integration active
- ✅ Email system ready
- ✅ Admin dashboard live

**Total Deployment Time**: ~15-20 minutes

**Free Tier Limitations:**
- Service sleeps after 15 minutes inactivity
- First request takes 30-50 seconds
- Limited to 512MB RAM
- Bandwidth limits apply

**Upgrade Options** (optional):
- Starter Plan: $7/month → Always running, 1GB RAM
- Standard Plan: $25/month → More resources

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/en/4x/api.html)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [GitHub Docs](https://docs.github.com)

---

## 🆘 NEED HELP?

**Deployment Stuck?**
1. Check Render build logs (Deployments tab)
2. Verify all environment variables are set
3. Ensure Supabase project is active
4. Check GitHub repository is public

**Features Not Working?**
1. Check Render logs for errors
2. Review environment variables
3. Test locally first (npm start)
4. Clear browser cache

**Database Issues?**
1. Verify Supabase connection
2. Check table structures exist
3. Run setup scripts in Supabase SQL Editor
4. Review Supabase documentation

---

**Deployment Complete! Your application is now live and ready for use.** 🚀♻️

