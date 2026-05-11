# BinTECH: Input and Output Process Flow

## Overview
BinTECH is an intelligent waste segregation system comprising hardware (ESP32-based sorter) and software (Node.js web application). This document describes the complete data flow from physical waste input through processing to system output.

---

## PART 1: SYSTEM INPUTS

### 1.1 Hardware Inputs (ESP32 Waste Sorter)

#### 1.1.1 Primary Detection Sensors
The ESP32 continuously monitors three material classification sensors:

| Sensor Type | Pin | Function | Input |
|---|---|---|---|
| **Inductive Sensor** | GPIO 25 | Detects ferrous metals (Fe) | HIGH (idle) / LOW (metal detected) |
| **Capacitive Sensor** | GPIO 26 | Detects plastic and moisture-sensitive materials | HIGH (idle) / LOW (plastic detected) |
| **IR (Infrared) Sensor** | GPIO 15 | Detects paper, cardboard, and non-conductive materials | HIGH (idle) / LOW (paper detected) |

**Detection Window:** 2 seconds (IDENTIFICATION_WINDOW)
- When any sensor transitions from HIGH to LOW, the machine enters WAITING_FOR_DETECTION state
- All three sensors are sampled continuously during this 2-second window
- Material classification determined by which sensor(s) triggered

#### 1.1.2 Bin Occupancy Sensors (Ultrasonic)
Three HC-SR04 ultrasonic distance sensors continuously monitor bin fill levels:

| Bin Type | Trigger Pin | Echo Pin | Range Detection | Purpose |
|---|---|---|---|---|
| **Metal Bin** | GPIO 16 | GPIO 19 | 0-40 cm | Occupancy verification (30 cm) & fill monitoring |
| **Plastic Bin** | GPIO 4 | GPIO 18 | 0-40 cm | Occupancy verification (30 cm) & fill monitoring |
| **Paper Bin** | GPIO 2 | GPIO 5 | 0-40 cm | Occupancy verification (30 cm) & fill monitoring |

**Fill Percentage Calculation:**
```
fillPercentage = ((OCCUPANCY_DETECTION_RANGE - distanceCm) / OCCUPANCY_DETECTION_RANGE) × 100
```

**Bin Full Detection:**
- If distance < 40 cm for ≥ 10 seconds (BIN_FULL_THRESHOLD) → bin marked as FULL
- When bin is full, sorting for that material is disabled
- Maintenance notification sent to backend when bin reaches full status

#### 1.1.3 Point System Input (Hardware Session)
Points are awarded based on material detected and verified:

| Material | Points | Verification Method | Bin Check |
|---|---|---|---|
| **Metal** | +2.0 pts | Ultrasonic detects object in metal bin | Must not be full |
| **Plastic** | +1.0 pts | Ultrasonic detects object in plastic bin | Must not be full |
| **Paper** | +0.5 pts | Ultrasonic detects object in paper bin | Must not be full |

### 1.2 QR Code Session Initiation

#### 1.2.1 QR Code Input Flow
1. User scans QR code at the waste sorter kiosk
2. QR code contains encoded session data (sessionID)
3. ESP32 receives HTTP POST to `/api/session/start`

**Payload Structure:**
```json
{
  "sessionID": "unique_session_token_from_qr"
}
```

4. Backend validates session and creates `machine_sessions` record
5. Session linked to `user_id` and `machine_id`

#### 1.2.2 Session Record Schema
```
machine_sessions {
  id: UUID (session ID),
  user_id: VARCHAR (student/faculty/staff ID),
  user_email: VARCHAR,
  session_token: VARCHAR (authentication token),
  status: ENUM ('active', 'completed', 'error'),
  started_at: TIMESTAMP,
  ended_at: TIMESTAMP (null until completed),
  machine_id: VARCHAR ('BINTECH-SORTER-001'),
  metal_count: INTEGER (0),
  plastic_count: INTEGER (0),
  paper_count: INTEGER (0),
  total_points: DECIMAL (0.0)
}
```

### 1.3 Web Interface Inputs

#### 1.3.1 User Registration/Login
**Input Source:** User authentication form
```json
{
  "email": "student.k12158353@umak.edu.ph",
  "password": "encrypted_bcrypt",
  "role": "auto-classified (student|faculty|staff)"
}
```

**Role Classification Logic:**
- **Student:** Email contains `.k` or `.a` pattern (e.g., `.k12158353`)
- **Faculty:** `@umak.edu.ph` without student pattern
- **Staff:** Other domains or generic patterns

#### 1.3.2 User Profile Inputs
- Profile picture upload (image file)
- Linked Google account (OAuth)
- Email preferences
- Account recovery requests

#### 1.3.3 Rewards Interface
- Reward redemption requests
- Points transfer requests (peer-to-peer)
- Reward inventory adjustment (admin)

---

## PART 2: PROCESSING LAYER

### 2.1 ESP32 Detection & Classification Pipeline

#### 2.1.1 State Machine Flow
```
State Diagram:
    
    IDLE
      ↓
      (Sensor triggers)
      ↓
    WAITING_FOR_DETECTION (2 seconds)
      ↓ (Classification window ends)
      ↓
    MOTOR_RUNNING (delay 1 second, then run motor 5 seconds)
      ↓
    VERIFICATION_WINDOW (10 second timeout)
      ↓ (Ultrasonic confirms object in bin)
      ↓
    IDLE (Points awarded, ready for next cycle)
```

#### 2.1.2 Material Classification Logic
**Priority-Based Detection:**
1. Check if inductive sensor (metal) was triggered → Classify as METAL
2. Else, check if capacitive sensor (plastic) triggered → Classify as PLASTIC
3. Else, check if IR sensor (paper) triggered → Classify as PAPER
4. Else → Unknown (no points awarded)

**Servo Activation:**
- **METAL detected** → Activate metal servo (GPIO 23) to 60°
- **PLASTIC detected** → Activate plastic servo (GPIO 22) to 60°
- **PAPER detected** → No servo (gravity feed), motor only

#### 2.1.3 Verification Process
**Time:** 10 seconds after motor starts
**Method:** Ultrasonic measurement

For each material type:
1. Measure distance to bin contents
2. If distance < 30 cm (VERIFICATION_RANGE) → Object successfully sorted
3. Award points immediately
4. Apply cooldown (1 second) to prevent duplicate counting

### 2.2 Backend API Processing

#### 2.2.1 Session Update Cycle
**Interval:** Every 5 seconds (BACKEND_UPDATE_INTERVAL)

**ESP32 sends POST to:** `/api/waste-sorter/api/session/update`

**Payload Structure:**
```json
{
  "machineId": "BINTECH-SORTER-001",
  "sessionId": "abc123def456",
  "metalCount": 2,
  "plasticCount": 3,
  "paperCount": 1,
  "totalPoints": 6.5,
  "binCapacities": {
    "metal": 45,
    "plastic": 62,
    "paper": 28
  }
}
```

**Backend Processing:**
1. Validate session is active
2. Update `machine_sessions` record with latest counts
3. Check for bin full warnings
4. Return status confirmation

#### 2.2.2 Point Accumulation During Session
Points are accumulated in real-time:
- Stored temporarily in ESP32 local memory
- Synced to backend every 5 seconds
- Session record updated in `machine_sessions` table

**Database Update:**
```sql
UPDATE machine_sessions
SET metal_count = $1,
    plastic_count = $2,
    paper_count = $3,
    total_points = $4,
    updated_at = NOW()
WHERE id = $5
```

#### 2.2.3 Bin Capacity Telemetry
**Sent:** Every 5 seconds

**Endpoint:** `POST /api/waste-sorter/api/bin-capacity`

**Payload:**
```json
{
  "machineId": "BINTECH-SORTER-001",
  "capacities": {
    "metal": {
      "fillPercentage": 45,
      "isFull": false
    },
    "plastic": {
      "fillPercentage": 62,
      "isFull": false
    },
    "paper": {
      "fillPercentage": 28,
      "isFull": false
    }
  }
}
```

**Backend Processing:**
1. Extract capacity data for each material
2. Update `bins` table status (ACTIVE / FULL)
3. Update `machine_sorting_telemetry` table for analytics
4. Alert admin if any bin reaches 100%

#### 2.2.4 Bin Full Warning
**Triggered:** When bin occupancy ≥ 100% for ≥ 10 seconds

**Endpoint:** `POST /api/waste-sorter/api/bin-warning`

**Payload:**
```json
{
  "machineId": "BINTECH-SORTER-001",
  "material": "METAL",
  "isFull": true,
  "fillPercentage": 100
}
```

**Actions:**
1. Sorting disabled for that material on ESP32
2. Alert sent to admin dashboard
3. Email notification to maintenance staff
4. `bins` table status updated to FULL

### 2.3 Point Transfer & Credit

#### 2.3.1 Session Completion & Point Transfer
**When:** User ends session or after 30 minutes of inactivity

**Endpoint:** `POST /api/waste-sorter/session/transfer`

**Request:**
```json
{
  "userId": "k12158353",
  "sessionId": "abc123def456",
  "pointsToTransfer": 6.5,
  "metalCount": 2,
  "plasticCount": 3,
  "paperCount": 1
}
```

**Processing Steps:**
1. Verify session belongs to user
2. Verify session is active (not already transferred)
3. Get current user points from `account_points`
4. Calculate new total points
5. Update `account_points` record
6. Create audit log in `account_points_log`
7. Update session status to COMPLETED
8. Record event in `hardware_session_logs`

#### 2.3.2 Point Storage Structure
**account_points table:**
```sql
account_points {
  system_id: VARCHAR (student/faculty/staff ID),
  email: VARCHAR,
  points: DECIMAL (current available points),
  total_points: DECIMAL (lifetime points earned),
  updated_at: TIMESTAMP,
  last_transaction_id: UUID
}
```

**account_points_log table (Audit Trail):**
```sql
account_points_log {
  id: UUID,
  system_id: VARCHAR,
  transaction_type: ENUM ('session_earn', 'redemption', 'transfer', 'admin_adjust'),
  amount: DECIMAL,
  reason: VARCHAR,
  session_id: UUID,
  created_at: TIMESTAMP
}
```

### 2.4 Authentication & Authorization

#### 2.4.1 Session Management
- JWT tokens issued on login
- Session tokens stored in `user_sessions`
- Express-session maintains server-side session
- Auto-logout after 24 hours of inactivity

#### 2.4.2 Role-Based Access Control
| Role | Access | Permissions |
|---|---|---|
| **Student** | Dashboard, Profile, Rewards, History | View own data, redeem rewards |
| **Faculty** | Dashboard, Department Analytics | View department stats |
| **Staff** | Admin Panel, Bins, Collections | Manage hardware, collection logs |
| **Admin** | Full System Access | All operations + audit logs |

---

## PART 3: SYSTEM OUTPUTS

### 3.1 User Dashboard Outputs

#### 3.1.1 Real-Time Session Display
During active session (updated every 5 seconds):
```javascript
{
  currentSession: {
    status: "active",
    elapsedTime: "2m 34s",
    itemsSorted: 6,
    pointsEarned: 6.5,
    breakdown: {
      metal: { count: 2, points: 4.0 },
      plastic: { count: 3, points: 3.0 },
      paper: { count: 1, points: 0.5 }
    },
    binStatus: {
      metal: { fillPercentage: 45, status: "active" },
      plastic: { fillPercentage: 62, status: "active" },
      paper: { fillPercentage: 28, status: "active" }
    }
  }
}
```

#### 3.1.2 User Statistics Output
**Endpoint:** `GET /api/dashboard/stats`

**Response:**
```json
{
  "currentPoints": 156.5,
  "totalPointsEarned": 542.0,
  "sessionsCompleted": 23,
  "itemsSortedTotal": 234,
  "wasteBreakdown": {
    "metal": 67,
    "plastic": 95,
    "paper": 72
  },
  "carbonOffset": "2.3 kg CO₂",
  "rank": {
    "position": 12,
    "totalUsers": 547,
    "points": "156.5 pts"
  },
  "achievements": [
    { "name": "First Sort", "date": "2024-01-15" },
    { "name": "50 Items Sorted", "date": "2024-02-03" },
    { "name": "Eco-Champion", "date": "2024-03-20" }
  ]
}
```

#### 3.1.3 Disposal History Output
**Endpoint:** `GET /api/dashboard/history`

**Response:**
```json
{
  "entries": [
    {
      "sessionId": "abc123",
      "date": "2024-03-25T14:30:00Z",
      "duration": "3m 45s",
      "itemsSorted": 8,
      "pointsEarned": 7.0,
      "materials": {
        "metal": 2,
        "plastic": 4,
        "paper": 2
      }
    },
    // ... more entries
  ],
  "totalSessions": 23,
  "averagePointsPerSession": 7.2
}
```

#### 3.1.4 Transaction History Output
**Endpoint:** `GET /api/dashboard/transaction-history`

**Response:**
```json
{
  "transactions": [
    {
      "date": "2024-03-25T14:35:00Z",
      "type": "session_earn",
      "amount": 7.0,
      "description": "Waste sorting session - 8 items",
      "balance": 156.5
    },
    {
      "date": "2024-03-24T10:15:00Z",
      "type": "redemption",
      "amount": -50.0,
      "description": "Redeemed: Starbucks ₱500 Gift Card",
      "balance": 149.5
    },
    {
      "date": "2024-03-20T16:20:00Z",
      "type": "peer_transfer",
      "amount": -10.0,
      "description": "Transferred to: Juan Santos",
      "balance": 199.5
    },
    {
      "date": "2024-03-18T11:00:00Z",
      "type": "admin_adjust",
      "amount": 50.0,
      "description": "Admin bonus for participation",
      "balance": 209.5
    }
  ]
}
```

### 3.2 Admin Dashboard Outputs

#### 3.2.1 Real-Time System Status
**Endpoint:** `GET /api/admin/system-status`

**Response:**
```json
{
  "systemHealth": {
    "status": "operational",
    "uptime": "89d 14h 32m",
    "lastUpdate": "2024-03-25T15:42:33Z"
  },
  "machines": [
    {
      "machineId": "BINTECH-SORTER-001",
      "location": "Building A - Lobby",
      "status": "active",
      "lastActiveSession": "2024-03-25T15:38:00Z",
      "bins": {
        "metal": {
          "fillPercentage": 45,
          "status": "active",
          "lastEmptied": "2024-03-24T10:00:00Z"
        },
        "plastic": {
          "fillPercentage": 62,
          "status": "active",
          "alert": "Approaching capacity"
        },
        "paper": {
          "fillPercentage": 28,
          "status": "active"
        }
      }
    }
  ],
  "alerts": [
    {
      "severity": "warning",
      "machine": "BINTECH-SORTER-001",
      "message": "Plastic bin at 62% capacity",
      "timestamp": "2024-03-25T15:40:00Z"
    }
  ]
}
```

#### 3.2.2 Sorting Analytics Output
**Endpoint:** `GET /api/waste-sorter/analytics/overview`

**Response:**
```json
{
  "timeRange": "last_7_days",
  "totals": {
    "totalSessionsCompleted": 187,
    "totalItemsSorted": 1243,
    "totalPointsGenerated": 1456.5,
    "uniqueUsers": 89
  },
  "materialBreakdown": {
    "metal": {
      "count": 347,
      "percentage": 27.9,
      "pointsGenerated": 694.0,
      "weight": "28.4 kg"
    },
    "plastic": {
      "count": 542,
      "percentage": 43.6,
      "pointsGenerated": 542.0,
      "weight": "45.2 kg"
    },
    "paper": {
      "count": 354,
      "percentage": 28.5,
      "pointsGenerated": 177.0,
      "weight": "61.3 kg"
    }
  },
  "machineStats": [
    {
      "machineId": "BINTECH-SORTER-001",
      "sessionsCompleted": 187,
      "itemsSorted": 1243,
      "uptime": "99.7%",
      "averageSessionDuration": "4m 23s"
    }
  ],
  "trends": {
    "peakHours": ["12:00-13:00", "17:00-18:00"],
    "topUsers": [
      { "userId": "k12158353", "sessions": 34, "pointsEarned": 267.5 },
      { "userId": "a12158354", "sessions": 28, "pointsEarned": 198.0 }
    ],
    "weeklyGrowth": "+12.3%"
  }
}
```

#### 3.2.3 Collection Management Output
**Endpoint:** `GET /api/admin/collections`

**Response:**
```json
{
  "scheduledCollections": [
    {
      "id": "coll_001",
      "machineId": "BINTECH-SORTER-001",
      "scheduledDate": "2024-03-25T18:00:00Z",
      "estimatedVolume": {
        "metal": 28.4,
        "plastic": 45.2,
        "paper": 61.3
      },
      "status": "scheduled",
      "assignedStaff": "John Santos"
    }
  ],
  "completedCollections": [
    {
      "id": "coll_000",
      "machineId": "BINTECH-SORTER-001",
      "completedDate": "2024-03-24T18:30:00Z",
      "actualVolume": {
        "metal": 29.1,
        "plastic": 44.8,
        "paper": 62.1
      },
      "notes": "All bins emptied, machine cleaned"
    }
  ]
}
```

### 3.3 Maintenance & Hardware Outputs

#### 3.3.1 Hardware Performance Metrics
**Endpoint:** `GET /api/hardware/:machineId/health`

**Response:**
```json
{
  "machineId": "BINTECH-SORTER-001",
  "timestamp": "2024-03-25T15:42:33Z",
  "sensors": {
    "inductive": { "status": "healthy", "calibration": 95 },
    "capacitive": { "status": "healthy", "calibration": 92 },
    "ir": { "status": "healthy", "calibration": 97 },
    "ultrasonicMetal": { "status": "healthy", "lastRead": "2024-03-25T15:42:30Z" },
    "ultrasonicPlastic": { "status": "healthy", "lastRead": "2024-03-25T15:42:30Z" },
    "ultrasonicPaper": { "status": "healthy", "lastRead": "2024-03-25T15:42:30Z" }
  },
  "actuators": {
    "metalServo": { "status": "functional", "lastActivation": "2024-03-25T15:38:00Z" },
    "plasticServo": { "status": "functional", "lastActivation": "2024-03-25T15:36:00Z" },
    "motor": { "status": "functional", "usageHours": 1247.3 }
  },
  "connectivity": {
    "wifiStatus": "connected",
    "signalStrength": -52,
    "lastHeartbeat": "2024-03-25T15:42:30Z"
  },
  "diagnostics": {
    "errorRate": 0.3,
    "averageSessionAccuracy": 98.7,
    "lastMaintenance": "2024-03-01T08:00:00Z"
  ]
}
```

### 3.4 Email & Notification Outputs

#### 3.4.1 Session Completion Notification
**Triggered:** After point transfer

**Email Subject:** "🎉 Great Work! You've Earned 6.5 Points!"

**Email Body:**
```
Dear Student,

Your waste sorting session has been completed and points have been credited to your account!

Session Summary:
- Metal items sorted: 2 (+4.0 points)
- Plastic items sorted: 3 (+3.0 points)
- Paper items sorted: 1 (+0.5 points)
- Total points earned: 6.5 points

Your Points Balance: 156.5 points

Keep sorting waste and earning rewards! You're helping make our campus cleaner and greener.

Best regards,
BinTECH Team
```

#### 3.4.2 Bin Full Warning Notification
**Triggered:** Bin reaches 100% capacity

**Email Subject:** "⚠️ BinTECH Alert: Plastic Bin is Full!"

**Recipients:** Maintenance staff

**Email Body:**
```
Maintenance Alert!

Bin Status:
- Machine: BINTECH-SORTER-001 (Building A - Lobby)
- Material: Plastic
- Status: FULL (100%)
- Time: 2024-03-25 15:42:33

Action Required: Please empty the plastic bin as soon as possible.

Estimated volume: 45.2 kg
```

#### 3.4.3 Reward Redemption Confirmation
**Triggered:** After successful redemption

**Email Subject:** "Your Reward is Ready for Pickup!"

**Email Body:**
```
Dear Student,

Congratulations! Your reward redemption has been processed.

Redeemed Item: Starbucks ₱500 Gift Card
Points Used: 50 points
Pickup Location: Admin Office, Building A
Pickup Code: BINTECH-24032501

Your new points balance: 106.5 points

Please note: Pickup codes are valid for 7 days.
```

### 3.5 API Response Formats

#### 3.5.1 Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* operation-specific data */ },
  "timestamp": "2024-03-25T15:42:33Z"
}
```

#### 3.5.2 Error Response
```json
{
  "success": false,
  "error": "session_not_found",
  "message": "The requested session could not be found",
  "code": 404,
  "timestamp": "2024-03-25T15:42:33Z"
}
```

---

## PART 4: DATA FLOW DIAGRAM

```
HARDWARE LAYER
┌─────────────────────────────────────────────────────────────┐
│  ESP32 WASTE SORTER                                         │
├─────────────────────────────────────────────────────────────┤
│  INPUT SENSORS:                                             │
│  ├─ Inductive (Metal) → GPIO 25                             │
│  ├─ Capacitive (Plastic) → GPIO 26                          │
│  ├─ IR (Paper) → GPIO 15                                    │
│  └─ Ultrasonic (3x) → Verification & Bin Level              │
│                                                              │
│  PROCESSING:                                                │
│  ├─ State Machine (IDLE → DETECTION → VERIFICATION)        │
│  ├─ Material Classification                                 │
│  ├─ Servo/Motor Control                                     │
│  └─ Local Point Accumulation                                │
│                                                              │
│  OUTPUT:                                                     │
│  └─ HTTP API Calls → Backend (every 5 sec)                  │
└─────────────────────────────────────────────────────────────┘
           │
           │ WiFi (Session updates, bin telemetry, warnings)
           ↓
┌─────────────────────────────────────────────────────────────┐
│  BACKEND PROCESSING (Node.js + Express)                    │
├─────────────────────────────────────────────────────────────┤
│  INPUT PROCESSING:                                          │
│  ├─ Session API calls from ESP32                            │
│  ├─ User authentication/registration                        │
│  ├─ Reward redemption requests                              │
│  └─ Admin collection logs                                   │
│                                                              │
│  CORE LOGIC:                                                │
│  ├─ Session management (machine_sessions)                   │
│  ├─ Point transfer & accumulation (account_points)          │
│  ├─ Bin capacity tracking (bins)                            │
│  ├─ Telemetry aggregation (machine_sorting_telemetry)       │
│  └─ Audit logging (account_points_log)                      │
│                                                              │
│  DATABASE: Supabase PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
           │
           ├─────────────┬─────────────────────────────┐
           │             │                             │
           ↓             ↓                             ↓
    WEB UI LAYER   ADMIN DASHBOARD        EMAIL NOTIFICATIONS
    
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  USER        │  │  ADMIN           │  │  SendGrid       │
│  DASHBOARD   │  │  ANALYTICS       │  │  (via Nodemailer)
│              │  │  PANEL           │  │                 │
│ • Stats      │  │ • System Status  │  │ • Session Done  │
│ • History    │  │ • Sorting Trends │  │ • Bin Full      │
│ • Points     │  │ • Leaderboard    │  │ • Rewards       │
│ • Rewards    │  │ • Collections    │  │ • Recovery      │
└──────────────┘  └──────────────────┘  └─────────────────┘
```

---

## PART 5: POINT FLOW LIFECYCLE

```
1. DETECTION & VERIFICATION (ESP32 Hardware)
   Waste item → Sensor triggers → Material classified
   → Motor activates & servo positions
   → Ultrasonic verifies object in bin
   → Points calculated locally (+0.5 to +2.0 pts)

2. BACKEND SYNCHRONIZATION (Every 5 seconds)
   ESP32 sends: machine_sessions update with counts
   Backend stores: Updated in machine_sessions table
   Status: Session remains "active"

3. POINT TRANSFER (User initiates end session)
   POST /api/waste-sorter/session/transfer
   └─ Backend validates session ownership
   └─ Backend retrieves total_points from machine_sessions
   └─ Backend updates account_points (add to current balance)
   └─ Backend creates audit log entry
   └─ Backend sets session status = "completed"
   └─ Backend sends confirmation email
   Status: Points now available in user account

4. POINT DISPLAY
   User dashboard shows: "Current Points: X.X"
   Source: account_points.points (current available)
           account_points.total_points (lifetime)

5. REWARD REDEMPTION
   User selects reward → System deducts points from account_points
   → Creates redemption record in redemptions table
   → Triggers pickup code generation
   → Sends confirmation email
   Status: Points transferred to reward inventory
```

---

## PART 6: DATA PERSISTENCE & AUDIT TRAIL

### 6.1 Core Tables

| Table | Purpose | Key Fields |
|---|---|---|
| **user_accounts** | User authentication & identification | system_id, email, role, campus_id |
| **account_points** | Current & lifetime points | system_id, points, total_points |
| **account_points_log** | Audit trail of all point transactions | system_id, amount, type, timestamp |
| **machine_sessions** | Individual sorting sessions | id, user_id, machine_id, metal_count, total_points |
| **bins** | Physical bin status & capacity | code, machine_id, filled_percentage, status |
| **machine_sorting_telemetry** | Aggregated hardware metrics | machine_id, metal_fill_percentage, total_waste_sorted |
| **redemptions** | Reward redemption history | user_id, reward_id, points_used, status |
| **hardware_session_logs** | Session events & debugging | session_id, event_type, event_data |

### 6.2 Data Retention
- **Active Sessions:** Kept until 30 minutes after last activity or explicit end
- **Completed Sessions:** Retained permanently for analytics
- **Telemetry:** 90-day rolling window (aggregated monthly)
- **Audit Logs:** Retained indefinitely per compliance requirements

---

## PART 7: ERROR HANDLING & EDGE CASES

### 7.1 Hardware Failures
| Failure | Input Affected | Output | Action |
|---|---|---|---|
| Sensor malfunction | Material detection | Classification fails | Points NOT awarded, alert sent |
| Bin full | Sorting disabled | Sorting blocked | Maintenance notification |
| WiFi disconnection | Backend sync | Local buffering | Resync when connected |
| Motor failure | Physical sorting | Item not sorted | Alert admin immediately |

### 7.2 Software Errors
| Error | Cause | Recovery |
|---|---|---|
| Session not found | Corrupted session ID | Create new session |
| Points transfer failure | DB connection loss | Retry with exponential backoff |
| User not found | Registration incomplete | Prompt user to complete signup |
| Duplicate transaction | Network retry | Idempotency check (prevent double credit) |

---

## PART 8: REAL-TIME DATA STREAMING

### 8.1 WebSocket Updates (Optional Future Enhancement)
```javascript
// Real-time session updates pushed to user dashboard
socket.emit('session_update', {
  sessionId: 'abc123',
  metalCount: 2,
  plasticCount: 3,
  paperCount: 1,
  totalPoints: 6.5,
  timestamp: '2024-03-25T15:42:33Z'
});

// Admin dashboard bin status
socket.emit('bin_status', {
  machineId: 'BINTECH-SORTER-001',
  material: 'plastic',
  fillPercentage: 62,
  isFull: false
});
```

---

## PART 9: COMPLIANCE & DATA PRIVACY

### 9.1 Data Classification
- **Public:** Leaderboard scores, achievement badges
- **Private:** Personal email, phone, address
- **Sensitive:** Password hashes, authentication tokens, transaction details
- **System:** Hardware logs, sensor calibration data

### 9.2 Data Access Control
- Students can view only their own data
- Faculty can view department aggregates
- Admins can view all data with audit trail
- System logs all access attempts

---

## CONCLUSION

The BinTECH system implements a comprehensive input-output pipeline that:

1. **Captures** physical waste sorting via multi-sensor hardware
2. **Processes** material classification and verification locally on ESP32
3. **Transmits** real-time session data to a backend cloud server
4. **Aggregates** points and generates user-facing outputs
5. **Displays** personalized dashboards and administrative analytics
6. **Maintains** an immutable audit trail of all transactions

This architecture ensures real-time responsiveness, data accuracy, system reliability, and complete traceability for both users and administrators.

---

*Document Version: 1.0*
*Last Updated: 2024-03-25*
*System: BinTECH v1.0*
