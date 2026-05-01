# 🌱 BinTECH: Intelligent Waste Segregation & Incentive Platform

An innovative college project that gamifies waste management by rewarding students with points for proper waste disposal. Convert your waste into rewards while helping the environment!

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation Guide](#installation-guide)
- [How to Run](#how-to-run)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Supabase Setup](#supabase-setup)
- [GitHub Upload Instructions](#github-upload-instructions)
- [Future Enhancements](#future-enhancements)
- [Support](#support)

---

## 🎯 Project Overview

**BinTECH** is a smart waste management system designed for college campuses. Students segregate their waste properly, scan a QR code on collection bins, and earn points. These points can be redeemed for exciting rewards, promoting sustainable waste management while encouraging campus participation.

### Key Benefits:
- ♻️ Promotes proper waste segregation
- ⭐ Gamifies waste management with rewards
- 📊 Real-time tracking and leaderboards
- 🏆 Community engagement and competition
- 🌍 Environmental impact measurement

---

## ✨ Features

### For Users:
- **User Dashboard**: Track points, disposal history, and leaderboard position
- **QR Code Scanning**: Instant point crediting on waste disposal
- **Reward System**: Browse and redeem rewards using accumulated points
- **Leaderboard**: Compete with peers and track rankings
- **Profile Management**: Manage user information and settings

### For Admins:
- **Bin Management**: Add, edit, monitor collection bins with QR codes
- **Collection Logs**: Track waste collection with weights and timestamps
- **Rewards Management**: Create and manage reward catalog
- **Schedule Management**: Plan collection routes and schedules
- **Analytics Dashboard**: System overview and statistics

### Public Pages:
- Landing page with feature overview
- How it works (detailed guide)
- Public rewards catalog
- Authentication (registration/login)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (Tailwind CSS), JavaScript |
| **Backend** | Node.js + Express.js |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Session-based (JWT-ready) |
| **View Engine** | EJS (Templating) |
| **Additional Tools** | dotenv (env management), CORS, Body Parser |

---

## 📁 Folder Structure

```
bintech/
├── 📄 app.js                          # Express application entry point
├── 📄 package.json                    # Dependencies and scripts
├── 📄 .gitignore                      # Git ignore file
├── 📄 .env.example                    # Environment variables template
├── 📄 README.md                       # This file
│
├── 📁 config/
│   └── supabase.js                    # Supabase client configuration
│
├── 📁 routes/
│   ├── index.js                       # Landing & public routes
│   ├── auth.js                        # Authentication routes
│   ├── dashboard.js                   # User dashboard routes
│   ├── rewards.js                     # Rewards routes
│   ├── qr.js                          # QR code scanning routes
│   └── admin.js                       # Admin/management routes
│
├── 📁 controllers/
│   ├── indexController.js             # Public page logic
│   ├── authController.js              # Auth operations (login, register)
│   ├── dashboardController.js         # User stats & history
│   ├── rewardsController.js           # Reward logic & redemption
│   ├── qrController.js                # QR scanning & point processing
│   └── adminController.js             # Admin operations
│
├── 📁 views/
│   ├── layout.ejs                     # Main layout template
│   ├── 404.ejs                        # 404 error page
│   │
│   ├── 📁 public/
│   │   ├── landing.ejs                # Landing page
│   │   ├── how-it-works.ejs           # How it works guide
│   │   └── rewards.ejs                # Public rewards page
│   │
│   ├── 📁 user/
│   │   └── dashboard.ejs              # User dashboard
│   │
│   └── 📁 admin/
│       ├── dashboard.ejs              # Admin dashboard
│       ├── bin-management.ejs         # Bin management page
│       ├── collection-logs.ejs        # Collection logs page
│       ├── rewards.ejs                # Rewards management page
│       └── schedule.ejs               # Schedule management page
│
├── 📁 public/                         # Static files
│   ├── 📁 css/                        # Stylesheets
│   ├── 📁 js/                         # Client-side JavaScript
│   └── 📁 images/                     # Images & assets
│
└── 📁 templates/                      # Original HTML templates (reference)
    ├── LANDING_PAGE.HTML
    ├── HOW_IT_WORKS.HTML
    ├── REWARDS.HTML
    ├── USER_DASHBOARD.HTML
    ├── ADMIN_DASHBOARD.HTML
    ├── ADMIN_REWARDS.HTML
    ├── ADMIN_COLLECTION.HTML
    ├── ADMIN_SCHEDULE.HTML
    └── ADMIN_BINMANAGE.HTML
```

---

## 🚀 Installation Guide

### Prerequisites
- **Node.js** (v14 or higher): [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git**: [Download here](https://git-scm.com/)
- **Supabase Account**: [Create one here](https://supabase.com/)

### Step 1: Clone the Repository
```bash
# Clone the project to your local machine
git clone https://github.com/YOUR_USERNAME/bintech.git
cd bintech
```

### Step 2: Install Dependencies
```bash
# Install all required npm packages
npm install
```

This will install:
- `express` - Web framework
- `dotenv` - Environment variable management
- `@supabase/supabase-js` - Supabase client
- `ejs` - Template engine
- `body-parser` - Request parsing
- `cors` - Cross-origin resource sharing
- `express-session` - Session management
- `nodemon` (dev) - Hot reload during development

### Step 3: Create Environment File
```bash
# Copy the example env file
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials (see [Environment Variables](#environment-variables) section below).

### Step 4: Verify Installation
```bash
# Run the application
npm start

# Or for development with auto-reload
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════════════╗
║          🌱 BinTECH Server Started Successfully! 🌱               ║
║          Intelligent Waste Segregation & Incentive Platform      ║
║  Server running at: http://localhost:3000                         ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## ▶️ How to Run

### Development Mode (with Hot Reload)
```bash
npm run dev
```
This uses `nodemon` to automatically restart the server when you make changes.

### Production Mode
```bash
npm start
```

### Access the Application
- **Landing Page**: http://localhost:3000/
- **How It Works**: http://localhost:3000/how-it-works
- **Rewards**: http://localhost:3000/rewards
- **User Dashboard**: http://localhost:3000/dashboard
- **Admin Dashboard**: http://localhost:3000/admin
- **Health Check**: http://localhost:3000/health

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Configuration (if using external DB)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=bintech

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
SESSION_SECRET=your_super_secret_session_key_here_change_in_production

# Email Configuration (optional, for future features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend & API
FRONTEND_URL=http://localhost:3000
API_TIMEOUT=30000
MAX_FILE_SIZE=5242880
```

### How to Get Supabase Credentials:

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🛣️ API Routes

### Public Routes
```
GET  /                      # Landing page
GET  /how-it-works          # How it works page
GET  /health                # Health check
```

### Authentication Routes
```
POST /auth/register         # User registration
POST /auth/login            # User login
POST /auth/logout           # User logout
GET  /auth/profile          # Get user profile
PUT  /auth/profile          # Update user profile
```

### User Dashboard Routes
```
GET  /dashboard             # User dashboard page
GET  /dashboard/stats       # User statistics
GET  /dashboard/history     # Disposal history
GET  /dashboard/leaderboard # Leaderboard position
GET  /dashboard/points      # User points
```

### Rewards Routes
```
GET  /rewards               # All available rewards
GET  /rewards/:id           # Specific reward details
POST /rewards/:id/redeem    # Redeem a reward
GET  /rewards/user/history  # Redemption history
```

### QR Code Routes
```
POST /qr/scan              # Process QR scan
GET  /qr/history           # QR scan history
POST /qr/verify            # Verify QR code
```

### Admin Routes
```
GET  /admin                        # Admin dashboard
GET  /admin/bin-management         # View bins
POST /admin/bin-management         # Add bin
PUT  /admin/bin-management/:id     # Update bin
DELETE /admin/bin-management/:id   # Delete bin

GET  /admin/collection-logs        # View logs
POST /admin/collection-logs        # Add log

GET  /admin/rewards                # View rewards
POST /admin/rewards                # Add reward
PUT  /admin/rewards/:id            # Update reward
DELETE /admin/rewards/:id          # Delete reward

GET  /admin/schedule               # View schedules
POST /admin/schedule               # Add schedule
PUT  /admin/schedule/:id           # Update schedule
DELETE /admin/schedule/:id         # Delete schedule
```

---

## 🔧 Supabase Setup

### Create Database Tables

Run these SQL queries in your Supabase SQL Editor:

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  points INTEGER DEFAULT 0,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Disposal History Table
CREATE TABLE disposal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  waste_type VARCHAR(50),
  quantity INTEGER,
  points_earned INTEGER,
  bin_id VARCHAR(50),
  bin_location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Rewards Table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  category VARCHAR(50),
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Redemptions Table
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  reward_id UUID NOT NULL,
  points_spent INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (reward_id) REFERENCES rewards(id)
);

If `redemptions` already exists in your database, keep the table and apply the alter migration in `migrations/convert_redemptions_user_id_to_text.sql` instead of recreating it.

-- Bins Table
CREATE TABLE bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location VARCHAR(255),
  capacity INTEGER,
  waste_type VARCHAR(50),
  qr_code VARCHAR(255) UNIQUE,
  current_fill INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Collection Logs Table
CREATE TABLE collection_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bin_id UUID,
  collector_name VARCHAR(255),
  weight_collected DECIMAL,
  notes TEXT,
  collected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (bin_id) REFERENCES bins(id)
);

-- Schedules Table
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bin_id UUID,
  scheduled_date DATE,
  collector_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (bin_id) REFERENCES bins(id)
);
```

---

## 📤 GitHub Upload Instructions

### Step 1: Initialize Git Repository (if not already done)
```bash
git init
```

### Step 2: Add All Files
```bash
git add .
```

### Step 3: Make First Commit
```bash
git commit -m "Initial commit: BinTECH project setup"
```

### Step 4: Create Repository on GitHub

1. Go to [GitHub](https://github.com/) and log in
2. Click **"New"** to create a new repository
3. Name it: `bintech` (or your preferred name)
4. **Do NOT** initialize with README, .gitignore, or license
5. Click **"Create repository"**

### Step 5: Add Remote and Push
```bash
# Add the remote origin (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/bintech.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 6: Verify on GitHub
Visit `https://github.com/YOUR_USERNAME/bintech` to confirm your code is uploaded.

### Future Commits
```bash
# Make changes, then:
git add .
git commit -m "Describe your changes"
git push
```

---

## 🔄 Updating HTML Templates

Your original HTML templates are in the `/templates/` folder. They've been adapted to work with Express and EJS:

### Template Mapping:
| Original File | → | New EJS View |
|---|---|---|
| LANDING_PAGE.html | → | views/public/landing.ejs |
| HOW_IT_WORKS.html | → | views/public/how-it-works.ejs |
| REWARDS.html | → | views/public/rewards.ejs |
| USER_DASHBOARD.html | → | views/user/dashboard.ejs |
| ADMIN_DASHBOARD.html | → | views/admin/dashboard.ejs |
| ADMIN_REWARDS.html | → | views/admin/rewards.ejs |
| ADMIN_COLLECTION.html | → | views/admin/collection-logs.ejs |
| ADMIN_SCHEDULE.html | → | views/admin/schedule.ejs |
| ADMIN_BINMANAGE.html | → | views/admin/bin-management.ejs |

### If You Need to Make Template Changes:
1. Edit the `.ejs` file in `/views/`
2. The changes will be reflected immediately in development mode (`npm run dev`)
3. You can still reference original templates in `/templates/` for comparison

---

## 📊 Adding Static Files (CSS, JS, Images)

Place your custom CSS, JavaScript, and image files in:

```
public/
  ├── css/
  │   └── custom.css
  ├── js/
  │   └── custom.js
  └── images/
      └── logo.png
```

Reference them in your views:
```html
<link rel="stylesheet" href="/css/custom.css">
<script src="/js/custom.js"></script>
<img src="/images/logo.png" alt="Logo">
```

---

## 🔜 Future Enhancements

- [ ] **User Authentication**: Implement proper JWT-based auth
- [ ] **Email Notifications**: Send reward redemption emails
- [ ] **ESP32 Integration**: Support for physical kiosk devices
- [ ] **Mobile App**: Flutter/React Native mobile version
- [ ] **Payment Gateway**: Real cash redemption options
- [ ] **AI Analytics**: Predict waste patterns
- [ ] **Social Features**: Team challenges and group rewards
- [ ] **Real-time Updates**: WebSocket for notifications
- [ ] **Admin Analytics**: Advanced dashboard with charts

---

## 🤝 Contributing

This is a college project. To improve it:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📞 Support

For issues or questions:

- 📧 Email: support@bintech.com
- 💬 Issues: Open an issue on GitHub
- 📚 Documentation: Check this README
- 🌐 Website: (to be added)

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👥 Team

- **Developer(s)**: Your Name(s)
- **College**: Your College Name
- **Project Year**: 2024

---

## 🙏 Acknowledgments

- Built with ❤️ for environmental sustainability
- Special thanks to the college administration and campus community
- Thanks to Supabase for the backend-as-a-service platform

---

## 📈 Project Statistics

- **Total Lines of Code**: ~2000+
- **Components**: 20+
- **API Endpoints**: 25+
- **Database Tables**: 7
- **Development Time**: [Your completion time]

---

**Happy Coding! Let's build a greener campus together 🌱**

Last Updated: March 18, 2024
