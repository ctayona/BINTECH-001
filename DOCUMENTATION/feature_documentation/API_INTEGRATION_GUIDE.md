# 🎯 Waste Sorter Machine - API Integration (Updated)

## Database Configuration
- **Points Storage**: `account_points` table
- **Session Tracking**: `machine_sessions` table
- **User Authentication**: `user_accounts` table

---

## 📡 Backend API Endpoints

### **Session Management** (User Website Calls These)

#### 1. Start Session
```
POST /api/waste-sorter/session/start
```

**Request:**
```json
{
  "userId": "user-uuid",
  "hardwareDeviceId": "BINTECH-SORTER-001",
  "qrCodeData": "BINTECH-SORTER-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session started successfully",
  "session": {
    "id": "SESSION_1645345345_a1b2c3d4",
    "sessionToken": "hex-token-string",
    "hardwareDeviceId": "BINTECH-SORTER-001",
    "userId": "user-uuid",
    "is_active": true,
    "points_earned": 0,
    "metal_count": 0,
    "plastic_count": 0,
    "paper_count": 0,
    "started_at": "2026-04-24T12:00:00Z"
  }
}
```

#### 2. Get Session Status (Real-time Updates)
```
GET /api/waste-sorter/session/{sessionId}/status
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "SESSION_1645345345_a1b2c3d4",
    "is_active": true,
    "points_earned": 5.5,
    "metal_count": 1,
    "plastic_count": 2,
    "paper_count": 4,
    "started_at": "2026-04-24T12:00:00Z",
    "last_updated": "2026-04-24T12:05:43Z"
  }
}
```

#### 3. Transfer Points (Add to User Account)
```
POST /api/waste-sorter/session/transfer
```

**Request:**
```json
{
  "userId": "user-uuid",
  "sessionId": "SESSION_1645345345_a1b2c3d4",
  "pointsToTransfer": 5.5,
  "metalCount": 1,
  "plasticCount": 2,
  "paperCount": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "5.5 points transferred successfully",
  "data": {
    "sessionId": "SESSION_1645345345_a1b2c3d4",
    "pointsTransferred": 5.5,
    "oldPoints": 100,
    "newPoints": 105.5,
    "metalCount": 1,
    "plasticCount": 2,
    "paperCount": 4,
    "timestamp": "2026-04-24T12:06:00Z"
  }
}
```

#### 4. End Session
```
POST /api/waste-sorter/session/end
```

**Request:**
```json
{
  "sessionId": "SESSION_1645345345_a1b2c3d4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session ended",
  "data": {
    "sessionId": "SESSION_1645345345_a1b2c3d4",
    "pointsEarned": 5.5,
    "metalCount": 1,
    "plasticCount": 2,
    "paperCount": 4
  }
}
```

#### 5. Get User's Session History
```
GET /api/waste-sorter/user/{userId}/sessions?limit=20
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "SESSION_1645345345_a1b2c3d4",
      "active_user_id": "user-uuid",
      "is_active": false,
      "session_points": 5.5,
      "metal_count": 1,
      "plastic_count": 2,
      "paper_count": 4,
      "session_started_at": "2026-04-24T12:00:00Z",
      "created_at": "2026-04-24T12:00:00Z"
    }
  ]
}
```

---

### **Hardware-to-Backend API** (ESP32 Calls These)

#### 1. Update Session Points (Called by ESP32 After Each Item Sort)
```
POST /api/waste-sorter/api/session/update
```

**Request:**
```json
{
  "sessionId": "SESSION_1645345345_a1b2c3d4",
  "pointsEarned": 5.5,
  "metalCount": 1,
  "plasticCount": 2,
  "paperCount": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session updated",
  "sessionId": "SESSION_1645345345_a1b2c3d4",
  "pointsEarned": 5.5,
  "metalCount": 1,
  "plasticCount": 2,
  "paperCount": 4
}
```

#### 2. Get Active Session (ESP32 Checks if User Started Session)
```
GET /api/waste-sorter/api/device/{deviceId}/session
```

**Response (Session Active):**
```json
{
  "success": true,
  "session": {
    "sessionId": "SESSION_1645345345_a1b2c3d4",
    "userId": "user-uuid",
    "isActive": true,
    "pointsEarned": 0,
    "metalCount": 0,
    "plasticCount": 0,
    "paperCount": 0
  }
}
```

**Response (No Active Session):**
```json
{
  "success": false,
  "message": "No active session found"
}
```

#### 3. Report Bin Full Warning
```
POST /api/waste-sorter/api/bin-warning
```

**Request:**
```json
{
  "sessionId": "SESSION_1645345345_a1b2c3d4",
  "binType": "plastic",
  "fillPercentage": 100.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bin full warning logged",
  "binType": "plastic",
  "fillPercentage": 100.0
}
```

---

## 🗄️ Database Table Structure

### account_points
Stores the actual user points (updated on transfer):
```sql
system_id (uuid, PK)     -- User ID
email (varchar)          -- User email
campus_id (varchar)      -- Campus ID
points (integer)         -- Current balance
total_points (integer)   -- Lifetime total
total_waste (integer)    -- Total waste sorted
updated_at (timestamp)   -- Last update
```

### machine_sessions
Audit trail of all sorting sessions:
```sql
id (TEXT, PK)                  -- Session ID (e.g., SESSION_1645345345_a1b2c3d4)
active_user_id (uuid, FK)      -- User who started session
is_active (boolean)            -- Session status
session_points (integer)       -- Points earned in session
metal_count (integer)          -- Metal items sorted
plastic_count (integer)        -- Plastic items sorted
paper_count (integer)          -- Paper items sorted
session_started_at (timestamp) -- When session started
last_updated_at (timestamp)    -- Last activity
created_at (timestamp)         -- Record creation
updated_at (timestamp)         -- Record update
```

---

## 🔄 Complete Point Transfer Flow

```
USER SIDE                          |  BACKEND                   |  DATABASE
                                  |                            |
1. User logs in                   |                            |
2. Opens /qr-scanner              |                            |
3. Scans QR code -------→ POST /session/start                 |
                         Creates session ----→ INSERT machine_sessions
                         Returns session ID ←- with is_active=true
                                  |                            |
4. QR scanner displays            |                            |
   "Session Started"              |                            |
                                  |                            |
5. User sorts waste with ESP32    |                            |
   (hardware does its thing)      |                            |
                                  |                            |
6. ESP32 updates points:          |                            |
   POST /api/session/update       |                            |
                         Updates session ----→ UPDATE metal_count,
                                              plastic_count,
                                              paper_count,
                                              session_points
                                  |                            |
7. Frontend polls every 5 sec:    |                            |
   GET /session/:id/status ←------┤ Reads machine_sessions
                                  |                            |
8. User sees live updates:        |                            |
   - Points: 5.5                  |                            |
   - Metal: 1                     |                            |
   - Plastic: 2                   |                            |
   - Paper: 4                     |                            |
                                  |                            |
9. User clicks "Transfer Points"  |                            |
   POST /session/transfer         |                            |
                         ┌────────────────────┬──────────────┐
                         │ 1. Read account_points
                         │ 2. Calculate: new = old + points_transferred
                         │ 3. UPDATE account_points
                         │    (points += 5.5)
                         │ 4. UPDATE machine_sessions
                         │    (is_active = false)
                                  |        └────→ UPDATE account_points
                                  |              SET points = 105.5
                                  |              WHERE system_id = user-uuid
                                  |
                                  |              UPDATE machine_sessions
                                  |              SET is_active = false,
                                  |                  session_points = 5.5
                                  |              WHERE id = SESSION_xxx
                                  |                    |
10. Frontend shows success        |←────────────────┘
    "5.5 points added!"           |
    Points now: 105.5             |
                                  |
11. User can logout safely        |
    Points PERMANENTLY saved ✓    |
```

---

## 🧪 Testing the Integration

### Test 1: Start a Session
```bash
curl -X POST http://localhost:3000/api/waste-sorter/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "hardwareDeviceId": "BINTECH-SORTER-001",
    "qrCodeData": "BINTECH-SORTER-001"
  }'
```

### Test 2: Update Points from ESP32
```bash
curl -X POST http://localhost:3000/api/waste-sorter/api/session/update \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_1645345345_a1b2c3d4",
    "pointsEarned": 5.5,
    "metalCount": 1,
    "plasticCount": 2,
    "paperCount": 4
  }'
```

### Test 3: Check Session Status
```bash
curl http://localhost:3000/api/waste-sorter/session/SESSION_1645345345_a1b2c3d4/status
```

### Test 4: Transfer Points
```bash
curl -X POST http://localhost:3000/api/waste-sorter/session/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "SESSION_1645345345_a1b2c3d4",
    "pointsToTransfer": 5.5,
    "metalCount": 1,
    "plasticCount": 2,
    "paperCount": 4
  }'
```

### Verify in Supabase
```sql
-- Check user points updated
SELECT system_id, email, points, total_points FROM account_points 
WHERE system_id = '550e8400-e29b-41d4-a716-446655440000';

-- Check session recorded
SELECT * FROM machine_sessions 
WHERE id = 'SESSION_1645345345_a1b2c3d4';
```

---

## 📝 Key Differences from Old Implementation

| Aspect | Old | New |
|--------|-----|-----|
| **Points Storage** | `users.points` | `account_points.points` |
| **Session Table** | `hardware_sessions` | `machine_sessions` |
| **User ID Field** | `user_id` | `active_user_id` (in machine_sessions) |
| **Session Status** | `status` (string) | `is_active` (boolean) |
| **Points in Session** | `points_earned` | `session_points` |
| **Transfer Method** | Single transaction | Update both account_points + machine_sessions |
| **Item Counts** | `items_sorted` | `metal_count`, `plastic_count`, `paper_count` |

---

## ✅ Integration Checklist

- [ ] Backend wasteSorterController.js updated ✓
- [ ] Routes registered in app.js ✓
- [ ] Frontend USER_QR_CODE.HTML using correct field names ✓
- [ ] database migrations created (machine_sessions)
- [ ] Test /session/start endpoint
- [ ] Test /session/:id/status polling
- [ ] Test /session/transfer with actual user ID
- [ ] Verify account_points updated in database
- [ ] Verify machine_sessions record created
- [ ] End-to-end test from QR scan to point transfer
- [ ] Test in production

---

## 🚀 Next Steps

1. **Verify account_points table** exists in your Supabase
2. **Run the migration** for machine_sessions if not already done
3. **Start your backend**: `npm start`
4. **Test the endpoints** with curl commands above
5. **Test the UI**: Visit `/qr-scanner` and follow the flow

All ready! Your points now persist in `account_points` and sessions are tracked in `machine_sessions`. 🎉
