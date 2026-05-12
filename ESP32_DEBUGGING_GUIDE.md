# ESP32 Points Update Debugging Guide

**Critical: If points are not appearing in sessions, follow this diagnostic guide step-by-step.**

## Quick Diagnosis Steps

### Step 1: Verify Server Logging is Working

1. Start your Node.js server: `npm run dev`
2. Watch the terminal for console output
3. You should see log headers like `========== ESP32 UPDATE POINTS ==========`

### Step 2: Test the Full Flow Without ESP32

1. Go to `http://localhost:3000/test-session`
2. Click "Create Session" - you should see:
   - Frontend logs in browser console (F12)
   - Backend logs in terminal showing `========== START SESSION ==========`
3. Note the Session ID
4. Click "Add Points" to simulate ESP32 sending data
5. **Check terminal** - you should see `========== ESP32 UPDATE POINTS ==========`
6. Click "Get Session Status" - points should appear

### Step 3: Check Active Sessions in Database

1. Go to `http://localhost:3000/test-session`
2. Scroll down to "Debug - List All Active Sessions"
3. Click "List Active Sessions in Database"
4. You should see all active sessions with their current points

## What the Logs Tell You

### When Session is Created

Terminal should show:
```
========== START SESSION ==========
Received userId: [USER_ID]
Received hardwareDeviceId: BINTECH-SORTER-001
✓ User lookup for system_id: [USER_ID]
  Found: YES
✓ Creating session:
  sessionId: [SESSION_ID]
  machine_id: BINTECH-SORTER-001
  user_id: [USER_ID]
✅ Session created successfully
  Stored in DB with machine_id: BINTECH-SORTER-001
  Session ID: [SESSION_ID]
=====================================
```

### When ESP32 Sends Points Update

Terminal should show:
```
========== ESP32 UPDATE POINTS ==========
Received Payload:
  sessionId: [SESSION_ID]
  machineId: BINTECH-SORTER-001
  pointsEarned: undefined
  totalPoints: 5.5
  metalCount: 2
  plasticCount: 1
  paperCount: 0
  Raw body: [FULL_JSON]
🔍 Searching by sessionId: [SESSION_ID]
  Result: FOUND
✓ Matched active session: { id: [SESSION_ID], machine_id: BINTECH-SORTER-001, current_points: 0 }
📝 Updating session with:
  total_points: 5.5
  metal_count: 2
  plastic_count: 1
  paper_count: 0
✅ Session updated successfully in database
✅ COMPLETE - Returning response:
=========================================
```

### When ESP32 Syncs Session

Terminal should show:
```
========== ESP32 SYNC SESSION ==========
ESP32 requesting active session for deviceId: BINTECH-SORTER-001
Query result:
  Found: YES
  Error: none
✅ Returning session to ESP32:
  sessionId: [SESSION_ID]
  pointsEarned: [CURRENT_POINTS]
========================================
```

## Common Issues & Solutions

### Issue 1: "No active session found"
**Problem:** ESP32 is sending points but getting 404
**Cause:** 
- Session was not created yet OR
- Session ID is empty on ESP32 OR
- Machine ID mismatch

**Fix:**
1. Verify session was created: Check "Debug - List All Active Sessions"
2. Check ESP32 code - ensure MACHINE_ID is correct: `"BINTECH-SORTER-001"`
3. Check if ESP32 is calling `/api/device/{MACHINE_ID}/session` correctly

### Issue 2: Session Created but Points Stay at 0
**Problem:** 
- Test button "Add Points" works
- But ESP32 updates don't work

**Cause:**
- ESP32 isn't sending updates OR
- Updates are being sent to wrong URL OR
- Session ID isn't being passed

**Fix:**
1. Check ESP32 terminal/serial output for HTTP requests
2. Verify `BACKEND_URL` in ESP32 code matches your server: `http://[YOUR_IP]:3000`
3. Check network - can ESP32 reach your computer?

### Issue 3: Backend URL Unreachable
**Problem:** ESP32 can't connect to backend

**Fix:**
1. Get your computer's IP address:
   - Windows: Open Command Prompt, run `ipconfig`, find IPv4 Address
   - Example: `192.168.1.100`
2. Update ESP32 code: `const String BACKEND_URL = "http://192.168.1.100:3000";`
3. Verify in browser: Can you access `http://[YOUR_IP]:3000`?
4. Check firewall - is port 3000 open?

### Issue 4: Polling Not Updating
**Problem:** Session created, but frontend doesn't show updated points even with test endpoint

**Fix:**
1. Open browser F12 (DevTools) → Console tab
2. Look for logs starting with `[POLLING]`
3. You should see polling every 5 seconds
4. Check for errors in console

## ESP32 Code Points to Check

### 1. Backend URL (Critical!)
```cpp
const String BACKEND_URL = "http://192.168.254.105:3000"; // ← Change this to your IP
```

### 2. Machine ID (Should match QR code)
```cpp
const String MACHINE_ID = "BINTECH-SORTER-001"; // ← Verify this matches what user scans
```

### 3. Points Calculation
In ESP32 code, search for `addPoints()` - verify it's being called when waste is detected:
```cpp
addPoints(pointsAwarded, "METAL"); // Metal item sorted
```

### 4. Backend Update Interval
```cpp
const unsigned long BACKEND_UPDATE_INTERVAL = 2000; // Updates every 2 seconds
```

## Manual Testing Without ESP32

Use the test console at `http://localhost:3000/test-session`:

1. **Create Session** → See session ID
2. **Add Points** → Simulates ESP32 update
3. **Get Status** → See if points appear
4. **List Sessions** → See all active sessions in DB

## Network Debugging

To see actual HTTP traffic:

### Option 1: Browser DevTools
1. Open F12 → Network tab
2. Look for requests to `/api/waste-sorter/`
3. Check response status and body

### Option 2: Terminal
Watch for backend logs when:
- Session is created
- Points are added
- Frontend polls status

## Critical Checklist

- [ ] Server is running (`npm run dev`)
- [ ] Can access `http://localhost:3000` in browser
- [ ] Test session works (can create, add points, see status)
- [ ] Database has active sessions (check "List Active Sessions")
- [ ] ESP32 BACKEND_URL matches your computer's IP
- [ ] ESP32 MACHINE_ID matches QR code value
- [ ] Browser console shows no errors
- [ ] Terminal shows backend logs

## Getting Help

If points still don't appear:

1. **Capture logs:**
   - Terminal output when ESP32 sends update
   - Browser console output (F12)
   - Session response from "Get Status"

2. **Check with test endpoint:**
   - Does `POST /api/waste-sorter/test/add-points` work?
   - If yes → polling/frontend are fine, ESP32 isn't sending data
   - If no → database or backend issue

3. **Verify data flow:**
   - Create session → Get the ID
   - Use test/add-points → Should see points in database
   - Use session/status → Should return updated points

## Production Checklist

When deploying to real hardware:

1. Update BACKEND_URL to your server's public IP or domain
2. Ensure firewall allows port 3000 (or your custom port)
3. Use HTTPS if on public internet
4. Verify machine_id matches all QR codes
5. Test with real waste detection before deploying to users
