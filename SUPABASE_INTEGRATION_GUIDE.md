# BinTECH Supabase Integration Guide

## Overview

This guide provides complete instructions for connecting BinTECH to Supabase and performing all CRUD (Create, Read, Update, Delete) operations.

---

## Table of Contents

1. [Supabase Setup](#supabase-setup)
2. [Database Schema](#database-schema)
3. [CRUD Operations](#crud-operations)
4. [Using Database Utilities](#using-database-utilities)
5. [API Endpoints](#api-endpoints)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Supabase Setup

### Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start Your Project"
3. Sign up with your email or GitHub account
4. Create a new project (this creates a PostgreSQL database)

### Step 2: Get Your Credentials

1. In the Supabase dashboard, go to **Settings** → **API Keys**
2. Copy the `Project URL`
3. Copy the `anon (public)` key for frontend use
4. Copy the `service_role` key for backend use (KEEP PRIVATE!)

### Step 3: Set Environment Variables

Create or update your `.env` file:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 4: Configure Database Schema

1. Go to the Supabase **SQL Editor**
2. Run the SQL from `SUPABASE_SETUP_COMPLETE.sql`
3. Run the SQL from `ADMIN_ACCOUNTS_SCHEMA.sql`
4. Verify all tables are created

---

## Database Schema

### Core Tables

#### 1. **bins** - Waste container storage
```sql
id (UUID) - Primary key
location (TEXT) - Physical location
code (TEXT) - Bin code/identifier
capacity (INTEGER) - Storage capacity in kg
waste_type (TEXT) - Type of waste
filled_percentage (DECIMAL) - Current fill level
status (TEXT) - active/maintenance/inactive
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### 2. **collection_logs** - Waste collection records
```sql
id (UUID) - Primary key
bin_id (UUID) - Foreign key to bins
collector_name (TEXT) - Staff name
weight_collected (DECIMAL) - Weight in kg
notes (TEXT) - Additional notes
collected_at (TIMESTAMP) - When collected
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### 3. **rewards** - Incentive system
```sql
id (UUID) - Primary key
name (TEXT) - Reward name
description (TEXT) - Detailed description
points_required (INTEGER) - EcoPoints needed
category (TEXT) - Category (food/entertainment/etc)
image_url (TEXT) - Reward image
is_active (BOOLEAN) - Active status
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### 4. **schedules** - Task scheduling
```sql
id (UUID) - Primary key
task (TEXT) - Task name
description (TEXT) - Task description
scheduled_at (TIMESTAMP) - When to execute
assigned_to (UUID) - Foreign key to user (nullable)
status (TEXT) - pending/in-progress/completed
completed_at (TIMESTAMP) - Completion time
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### 5. **users** - User accounts
```sql
id (UUID) - Primary key
email (TEXT) - User email (UNIQUE)
full_name (TEXT) - User's full name
role (TEXT) - user/admin/manager
points (INTEGER) - EcoPoints balance
password (TEXT) - Hashed password
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### 6. **disposal_history** - Waste disposal tracking
```sql
id (UUID) - Primary key
user_id (UUID) - Foreign key to users
waste_type (TEXT) - Type of waste
points_earned (INTEGER) - Points awarded
created_at (TIMESTAMP)
```

#### 7. **admin_accounts** - Admin-specific data
```sql
id (UUID) - Primary key
email (TEXT) - Admin email (UNIQUE)
full_name (TEXT) - Admin name
role (TEXT) - Admin role
phone (TEXT) - Contact number
password (TEXT) - Hashed password
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

---

## CRUD Operations

### Running SQL Directly in Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy scripts from `SUPABASE_CRUD_OPERATIONS.sql`
5. Execute queries

### BINS Operations

#### CREATE - Add a new bin
```javascript
// Using JavaScript SDK
const { data, error } = await supabase
  .from('bins')
  .insert([{
    location: 'Building A - Ground Floor',
    code: 'BIN-001',
    capacity: 120,
    waste_type: 'organic',
    filled_percentage: 45,
    status: 'active'
  }])
  .select();
```

#### READ - Get all bins
```javascript
const { data, error } = await supabase
  .from('bins')
  .select('*')
  .order('created_at', { ascending: false });
```

#### READ - Get specific bin
```javascript
const { data, error } = await supabase
  .from('bins')
  .select('*')
  .eq('id', 'bin-id')
  .single();
```

#### UPDATE - Modify a bin
```javascript
const { data, error } = await supabase
  .from('bins')
  .update({
    location: 'New Location',
    filled_percentage: 75,
    status: 'maintenance'
  })
  .eq('id', 'bin-id')
  .select();
```

#### DELETE - Remove a bin
```javascript
const { data, error } = await supabase
  .from('bins')
  .delete()
  .eq('id', 'bin-id');
```

### COLLECTION LOGS Operations

#### CREATE - Log a collection
```javascript
const { data, error } = await supabase
  .from('collection_logs')
  .insert([{
    bin_id: 'bin-id',
    collector_name: 'John Doe',
    weight_collected: 25.5,
    notes: 'Morning collection'
  }])
  .select();
```

#### READ - Get logs for a bin
```javascript
const { data, error } = await supabase
  .from('collection_logs')
  .select('*')
  .eq('bin_id', 'bin-id')
  .order('collected_at', { ascending: false });
```

#### UPDATE - Modify a log
```javascript
const { data, error } = await supabase
  .from('collection_logs')
  .update({
    weight_collected: 30,
    notes: 'Updated notes'
  })
  .eq('id', 'log-id')
  .select();
```

#### DELETE - Remove a log
```javascript
const { data, error } = await supabase
  .from('collection_logs')
  .delete()
  .eq('id', 'log-id');
```

### REWARDS Operations

#### CREATE - Add a reward
```javascript
const { data, error } = await supabase
  .from('rewards')
  .insert([{
    name: 'Coffee Voucher',
    description: 'Free coffee at campus cafe',
    points_required: 50,
    category: 'food',
    image_url: 'https://example.com/coffee.jpg',
    is_active: true
  }])
  .select();
```

#### READ - Get all active rewards
```javascript
const { data, error } = await supabase
  .from('rewards')
  .select('*')
  .eq('is_active', true)
  .order('points_required', { ascending: true });
```

#### READ - Get rewards by category
```javascript
const { data, error } = await supabase
  .from('rewards')
  .select('*')
  .eq('category', 'food')
  .eq('is_active', true);
```

#### UPDATE - Modify a reward
```javascript
const { data, error } = await supabase
  .from('rewards')
  .update({
    name: 'Updated Reward',
    points_required: 60,
    is_active: true
  })
  .eq('id', 'reward-id')
  .select();
```

#### DELETE - Remove a reward
```javascript
// Soft delete (deactivate)
const { data, error } = await supabase
  .from('rewards')
  .update({ is_active: false, updated_at: new Date() })
  .eq('id', 'reward-id')
  .select();

// Hard delete
const { data, error } = await supabase
  .from('rewards')
  .delete()
  .eq('id', 'reward-id');
```

### SCHEDULES Operations

#### CREATE - Add a schedule
```javascript
const { data, error } = await supabase
  .from('schedules')
  .insert([{
    task: 'Collect Bin A1',
    description: 'Collect waste from Building A',
    scheduled_at: '2024-04-02T09:00:00',
    assigned_to: null, // or use staff-uuid
    status: 'pending'
  }])
  .select();
```

#### READ - Get upcoming schedules
```javascript
const { data, error } = await supabase
  .from('schedules')
  .select('*')
  .gt('scheduled_at', new Date().toISOString())
  .order('scheduled_at', { ascending: true });
```

#### READ - Get schedules for a person
```javascript
const { data, error } = await supabase
  .from('schedules')
  .select('*')
  .eq('assigned_to', 'staff-uuid')
  .order('scheduled_at', { ascending: false });
```

#### UPDATE - Mark as completed
```javascript
const { data, error } = await supabase
  .from('schedules')
  .update({
    status: 'completed',
    completed_at: new Date()
  })
  .eq('id', 'schedule-id')
  .select();
```

#### DELETE - Remove a schedule
```javascript
const { data, error } = await supabase
  .from('schedules')
  .delete()
  .eq('id', 'schedule-id');
```

### USERS Operations

#### READ - Get all users
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .order('created_at', { ascending: false });
```

#### READ - Get leaderboard (top users)
```javascript
const { data, error } = await supabase
  .from('users')
  .select('id, email, full_name, points')
  .neq('role', 'admin')
  .order('points', { ascending: false })
  .limit(10);
```

#### UPDATE - Add points
```javascript
const { data, error } = await supabase
  .from('users')
  .update({
    points: currentPoints + 50,
    updated_at: new Date()
  })
  .eq('id', 'user-id')
  .select();
```

---

## Using Database Utilities

The application includes a helper library (`lib/dbUtils.js`) with pre-built functions for common operations.

### Import the Utilities

```javascript
const db = require('../lib/dbUtils');
```

### Example Usage in Controllers

```javascript
// Get all bins
const bins = await db.getBins();

// Add a new bin
const newBin = await db.addBin({
  location: 'New Location',
  code: 'BIN-004',
  capacity: 100,
  waste_type: 'plastic',
  status: 'active'
});

// Get upcoming schedules
const schedules = await db.getUpcomingSchedules();

// Add points to user
const user = await db.addUserPoints('user-id', 100);

// Get leaderboard
const leaderboard = await db.getLeaderboard(10);

// Get bin fill report
const report = await db.getBinFillReport();
```

### Available Functions

**Bins:**
- `getBins()` - Get all bins
- `getBinById(id)` - Get specific bin
- `addBin(data)` - Create bin
- `updateBin(id, updates)` - Update bin
- `deleteBin(id)` - Delete bin

**Collection Logs:**
- `getCollectionLogs(limit)` - Get all logs
- `getCollectionLogsByBin(binId)` - Get bin's logs
- `addCollectionLog(data)` - Create log
- `updateCollectionLog(id, updates)` - Update log
- `deleteCollectionLog(id)` - Delete log

**Rewards:**
- `getRewards()` - Get active rewards
- `getRewardsByCategory(category)` - Filter by category
- `getRewardById(id)` - Get specific reward
- `addReward(data)` - Create reward
- `updateReward(id, updates)` - Update reward
- `deactivateReward(id)` - Soft delete reward
- `deleteReward(id)` - Hard delete reward

**Schedules:**
- `getSchedules()` - Get all schedules
- `getUpcomingSchedules()` - Get future schedules
- `getSchedulesByAssignee(userId)` - Get user's schedules
- `addSchedule(data)` - Create schedule
- `updateSchedule(id, updates)` - Update schedule
- `completeSchedule(id)` - Mark as completed
- `deleteSchedule(id)` - Delete schedule

**Users:**
- `getUsers()` - Get all users
- `getUserById(id)` - Get specific user
- `getUserByEmail(email)` - Get user by email
- `addUserPoints(userId, points)` - Add points
- `updateUser(id, updates)` - Update user
- `getLeaderboard(limit)` - Get top users
- `deleteUser(id)` - Delete user

**Statistics:**
- `getDashboardStats()` - Get overall stats
- `getBinFillReport()` - Get bin status report

---

## API Endpoints

### Admin API Routes (`/admin`)

**Bins:**
- `GET /admin/bins` - Get all bins
- `POST /admin/bins` - Create bin
- `PUT /admin/bins/:id` - Update bin
- `DELETE /admin/bins/:id` - Delete bin

**Collection Logs:**
- `GET /admin/collection-logs` - Get all logs
- `POST /admin/collection-logs` - Create log
- `PUT /admin/collection-logs/:id` - Update log
- `DELETE /admin/collection-logs/:id` - Delete log

**Rewards:**
- `GET /admin/rewards` - Get all rewards
- `POST /admin/rewards` - Create reward
- `PUT /admin/rewards/:id` - Update reward
- `DELETE /admin/rewards/:id` - Delete reward

**Schedules:**
- `GET /admin/schedules` - Get all schedules
- `POST /admin/schedules` - Create schedule
- `PUT /admin/schedules/:id` - Update schedule
- `DELETE /admin/schedules/:id` - Delete schedule

### User API Routes (`/dashboard`)

**Stats:**
- `GET /dashboard/stats` - Get user statistics
- `GET /dashboard/history` - Get disposal history

### Rewards Routes (`/rewards`)

- `GET /rewards` - Get available rewards
- `GET /rewards/:id` - Get reward details
- `GET /rewards/category/:category` - Get rewards by category

---

## Testing

### Test the Connection

```javascript
// test-supabase-connection.js
const supabase = require('./config/supabase');

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('bins')
      .select('count(*)', { count: 'exact' });
    
    if (error) throw error;
    
    console.log('✅ Connection successful!');
    console.log(`Total bins: ${data.length}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

Run this test:
```bash
node test-supabase-connection.js
```

### Test CRUD Operations

```bash
# Test adding a bin
curl -X POST http://localhost:3000/admin/bins \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Test Location",
    "code": "TEST-001",
    "capacity": 100,
    "status": "active"
  }'

# Test getting bins
curl http://localhost:3000/admin/bins

# Test updating a bin
curl -X PUT http://localhost:3000/admin/bins/bin-id \
  -H "Content-Type: application/json" \
  -d '{"location": "Updated Location"}'

# Test deleting a bin
curl -X DELETE http://localhost:3000/admin/bins/bin-id
```

---

## Troubleshooting

### Issue: "Supabase credentials not found"

**Solution:**
- Verify `.env` file exists in project root
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Restart the server after updating `.env`

### Issue: "Foreign key constraint failed"

**Solution:**
- Ensure referenced IDs exist in parent tables
- For `schedules.assigned_to`, use valid `user_accounts.system_id`
- Use `NULL` if assigning to no one

### Issue: "Authentication failed"

**Solution:**
- Check service role key (for admin operations)
- Ensure user has proper permissions
- Verify RLS (Row Level Security) policies

### Issue: "Cannot find table"

**Solution:**
- Run SQL schema setup from `SUPABASE_SETUP_COMPLETE.sql`
- Verify tables exist in Supabase dashboard → Tables
- Check table names are lowercase and match exactly

### Issue: "Timestamps not saving correctly"

**Solution:**
- Always use `new Date()` for timestamps
- Supabase expects ISO 8601 format
- Use `updated_at` for modification tracking

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `PGRST301` | Invalid select clause | Check column names |
| `PGRST304` | UUID parsing error | Verify UUID format |
| `23505` | Unique constraint violation | Check for duplicate values |
| `23503` | Foreign key violation | Ensure referenced record exists |

---

## Best Practices

1. **Always use async/await** for database operations
2. **Add error handling** for all queries
3. **Use transactions** for multi-table operations
4. **Index frequently queried columns** for performance
5. **Validate user input** before database operations
6. **Use RLS policies** to protect data
7. **Log all database operations** for debugging
8. **Back up data regularly** from Supabase
9. **Use connection pooling** for production
10. **Monitor query performance** in Supabase dashboard

---

## Support

For issues or questions:
1. Check Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
2. Review error messages in application logs
3. Check database logs in Supabase dashboard
4. Verify network connectivity to Supabase servers

---

**Last Updated:** April 2, 2026  
**Version:** 1.0.0
