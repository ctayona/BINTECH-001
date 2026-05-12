# 🚨 ESP32 IoT INTEGRATION GUIDE - SECURITY & IMPLEMENTATION
**Status: IMPORTANT - READ THIS BEFORE INTEGRATING ESP32**

---

## 📌 Quick Overview

Your current setup works for **web users**, but your ESP32 kiosk needs **additional security layers**:

| Component | Current Status | Need to Add |
|-----------|---|---|
| User authentication | ✅ Done (bcrypt) | ✅ Device authentication |
| Points update | ✅ Done (backend) | ✅ Transaction validation |
| QR scanning | ⚠️ Basic only | ✅ QR validation system |
| Error handling | ❌ Missing | ✅ Retry logic |
| Audit logging | ❌ Missing | ✅ Transaction tracking |

---

## 🎯 Architecture: Single ESP32 Machine

Since you **only have 1 waste sorter machine**, here's what you need:

```
USER SCANS QR
      ↓
    ESP32 (Machine)
      ↓
HTTP POST /api/qr/scan
{
  "deviceId": "ESP32_KIOSK_001",
  "apiKey": "your-secret-key-here",
  "userQR": "user_qr_token_from_scanning",
  "wasteType": "plastic",
  "transactionId": "tx_1234567890"
}
      ↓
Node.js Backend
      ↓
✅ Validate device
✅ Validate QR code
✅ Check no duplicate
✅ Update user points
✅ Log transaction
      ↓
USER GETS POINTS
```

---

# 📋 IMPLEMENTATION CHECKLIST

## PHASE 1: Device Authentication (Easy)
- [ ] Create device registration table in Supabase
- [ ] Generate API key for your ESP32
- [ ] Add authentication middleware to Express

## PHASE 2: QR Code System (Medium)
- [ ] Create QR code table in Supabase
- [ ] Generate QR codes for bins
- [ ] Add QR validation to backend

## PHASE 3: Transaction Safety (Medium)
- [ ] Add transaction logging
- [ ] Implement duplicate prevention
- [ ] Add retry logic handling

## PHASE 4: Error Handling (Easy)
- [ ] Add timeout handling
- [ ] Add connection error responses
- [ ] Add logging

---

# 🔧 DETAILED IMPLEMENTATION GUIDE

## STEP 1: Create Supabase Tables

### 1.1 IoT Devices Table
This table stores **your ESP32 machine**.

```sql
CREATE TABLE iot_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,  -- "ESP32_KIOSK_001"
  device_name TEXT,                 -- "Main Campus Waste Sorter"
  api_key TEXT UNIQUE NOT NULL,     -- Secret key for API calls
  location TEXT,                     -- "Building A - Ground Floor"
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_devices_api_key ON iot_devices(api_key);
CREATE INDEX idx_devices_device_id ON iot_devices(device_id);
```

**SQL to run in Supabase SQL Editor:**
```
Copy entire CREATE TABLE block above
Paste into new query
Click RUN
```

---

### 1.2 QR Codes Management Table
This table stores **valid QR codes** for your waste bins.

```sql
CREATE TABLE qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT UNIQUE NOT NULL,     -- The actual QR code value
  bin_location TEXT,                 -- "Plastic Bin A"
  waste_type TEXT,                   -- "plastic", "paper", "metal", "organic"
  status TEXT DEFAULT 'active',      -- "active" or "inactive"
  points_per_scan INTEGER DEFAULT 10,-- Points earned per correct disposal
  max_scans_per_day INTEGER,         -- Optional limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_qr_codes_value ON qr_codes(qr_code);
```

---

### 1.3 Transactions Log Table
This table **logs every point transfer** for audit trail.

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,  -- Unique ID from ESP32
  user_id UUID REFERENCES users(id),
  device_id UUID REFERENCES iot_devices(id),
  qr_code_id UUID REFERENCES qr_codes(id),
  waste_type TEXT,
  points_earned INTEGER,
  status TEXT DEFAULT 'completed',  -- "completed", "failed", "pending"
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_device ON transactions(device_id);
CREATE INDEX idx_transactions_tx_id ON transactions(transaction_id);
```

---

## STEP 2: Update Your Node.js Backend

### 2.1 Create Authentication Middleware
**File to create:** `middleware/iotAuth.js`

```javascript
// middleware/iotAuth.js
// Validates that requests come from authorized ESP32 devices

const supabase = require('../config/supabase');

async function authenticateDevice(req, res, next) {
  try {
    // Get API key from header
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Missing API key',
        code: 'NO_API_KEY'
      });
    }

    // Look up device in database
    const { data: device, error } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !device) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Update last seen timestamp
    await supabase
      .from('iot_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', device.id);

    // Attach device to request for later use
    req.device = device;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

module.exports = authenticateDevice;
```

---

### 2.2 Create QR Validation Service
**File to create:** `services/qrValidator.js`

```javascript
// services/qrValidator.js
// Validates QR codes and prevents duplicates

const supabase = require('../config/supabase');

// Validate QR code exists and is active
async function validateQRCode(qrCodeValue) {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('id, waste_type, points_per_scan, bin_location')
      .eq('qr_code', qrCodeValue)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return {
        valid: false,
        error: 'QR code not found or inactive'
      };
    }

    return {
      valid: true,
      data: data
    };
  } catch (error) {
    console.error('QR validation error:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

// Check if transaction already processed (prevent duplicates)
async function checkDuplicateTransaction(transactionId) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    return { isDuplicate: !!data, data: data };
  } catch (error) {
    // No match = not duplicate (expected error)
    return { isDuplicate: false };
  }
}

module.exports = {
  validateQRCode,
  checkDuplicateTransaction
};
```

---

### 2.3 Update QR Scanning Controller
**File to update:** `controllers/qrController.js`

Replace the `processQRScan` function with this:

```javascript
// UPDATED processQRScan function in controllers/qrController.js

const supabase = require('../config/supabase');
const { validateQRCode, checkDuplicateTransaction } = require('../services/qrValidator');

exports.processQRScan = async (req, res) => {
  try {
    // ==========================================
    // 1. EXTRACT & VALIDATE REQUEST DATA
    // ==========================================
    const { userQR, wasteType, transactionId } = req.body;
    const deviceId = req.device.id;  // From auth middleware
    
    // Validate required fields
    if (!userQR || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userQR or transactionId',
        code: 'MISSING_FIELDS'
      });
    }

    // ==========================================
    // 2. PREVENT DUPLICATE TRANSACTIONS
    // ==========================================
    const { isDuplicate, data: prevTransaction } = await checkDuplicateTransaction(transactionId);
    
    if (isDuplicate) {
      // Already processed - return previous result (idempotent)
      return res.status(200).json({
        success: true,
        message: 'Transaction already processed',
        pointsEarned: prevTransaction.points_earned,
        totalPoints: prevTransaction.total_points,
        isDuplicate: true
      });
    }

    // ==========================================
    // 3. VALIDATE QR CODE
    // ==========================================
    const qrValidation = await validateQRCode(userQR);
    
    if (!qrValidation.valid) {
      // Log failed transaction
      await supabase.from('transactions').insert([{
        transaction_id: transactionId,
        device_id: deviceId,
        status: 'failed',
        error_message: qrValidation.error,
        created_at: new Date().toISOString()
      }]);

      return res.status(400).json({
        success: false,
        message: 'Invalid QR code',
        code: 'INVALID_QR',
        qrCode: userQR
      });
    }

    const qrData = qrValidation.data;

    // ==========================================
    // 4. EXTRACT USER FROM QR CODE
    // ==========================================
    // The userQR contains the actual QR data that references a user
    // For now, assuming userQR is stored in your user account
    // You may need to adjust this based on your QR format
    
    const { data: users, error: userError } = await supabase
      .from('student_accounts')  // or faculty_accounts, other_accounts
      .select('id, full_name, points')
      .eq('qr_code', userQR)  // Assuming users have qr_code column
      .single();

    if (!users) {
      await supabase.from('transactions').insert([{
        transaction_id: transactionId,
        device_id: deviceId,
        status: 'failed',
        error_message: 'User not found',
        created_at: new Date().toISOString()
      }]);

      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // ==========================================
    // 5. CALCULATE POINTS
    // ==========================================
    const pointsEarned = qrData.points_per_scan || 10;
    const newPoints = (users.points || 0) + pointsEarned;

    // ==========================================
    // 6. UPDATE USER POINTS
    // ==========================================
    const { error: updateError } = await supabase
      .from('student_accounts')  // Change table based on role
      .update({ 
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', users.id);

    if (updateError) {
      throw new Error('Failed to update user points');
    }

    // ==========================================
    // 7. LOG TRANSACTION (Audit Trail)
    // ==========================================
    const { data: transaction } = await supabase
      .from('transactions')
      .insert([{
        transaction_id: transactionId,
        user_id: users.id,
        device_id: deviceId,
        qr_code_id: qrData.id,
        waste_type: wasteType || qrData.waste_type,
        points_earned: pointsEarned,
        status: 'completed',
        created_at: new Date().toISOString()
      }])
      .select();

    // ==========================================
    // 8. SEND SUCCESS RESPONSE
    // ==========================================
    res.status(200).json({
      success: true,
      message: 'Points credited successfully!',
      pointsEarned: pointsEarned,
      totalPoints: newPoints,
      userName: users.full_name,
      wasteType: wasteType || qrData.waste_type,
      binLocation: qrData.bin_location,
      transactionId: transactionId,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('QR scan error:', error);

    // Log the error transaction
    if (req.body?.transactionId) {
      await supabase.from('transactions').insert([{
        transaction_id: req.body.transactionId,
        device_id: req.device?.id,
        status: 'failed',
        error_message: error.message,
        created_at: new Date().toISOString()
      }]).catch(e => console.error('Failed to log error', e));
    }

    res.status(500).json({
      success: false,
      message: 'Server error processing QR scan',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
```

---

### 2.4 Update QR Routes
**File to update:** `routes/qr.js`

```javascript
// routes/qr.js - UPDATED

const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authenticateDevice = require('../middleware/iotAuth');

// ============================================
// QR CODE ROUTES
// ============================================

// Process QR code scan - REQUIRES API KEY
router.post('/scan', authenticateDevice, qrController.processQRScan);

// Get QR scan history (optional - for testing)
router.get('/history', authenticateDevice, qrController.getScanHistory);

// Verify QR code validity (optional - for testing)
router.post('/verify', authenticateDevice, qrController.verifyQRCode);

module.exports = router;
```

---

## STEP 3: Setup Your Single ESP32 Device

### 3.1 Register Device in Supabase

In Supabase SQL Editor, run:

```sql
-- Register your ESP32 kiosk machine
INSERT INTO iot_devices (device_id, device_name, api_key, location, is_active) VALUES
(
  'ESP32_KIOSK_001',
  'Main Waste Sorter Kiosk',
  'esp32_secret_key_12345_change_this',  -- ⚠️ CHANGE THIS!
  'Building A - Ground Floor',
  true
);
```

**Important:** Replace `esp32_secret_key_12345_change_this` with a secure random string:
```
Example: sk_live_aBcDeFgHiJkLmNoPqRsT
```

### 3.2 Generate QR Codes for Your Bins

In Supabase SQL Editor, run:

```sql
-- Add QR codes for your waste categories
INSERT INTO qr_codes (qr_code, bin_location, waste_type, status, points_per_scan) VALUES
(
  'BINTECH_QR_PLASTIC_A001',
  'Plastic Bin - Kiosk 1',
  'plastic',
  'active',
  10
),
(
  'BINTECH_QR_PAPER_B001',
  'Paper Bin - Kiosk 1',
  'paper',
  'active',
  8
),
(
  'BINTECH_QR_METAL_C001',
  'Metal Bin - Kiosk 1',
  'metal',
  'active',
  12
),
(
  'BINTECH_QR_ORGANIC_D001',
  'Organic Bin - Kiosk 1',
  'organic',
  'active',
  7
);
```

**These QR codes will be embedded in your physical bins.**

---

## STEP 4: ESP32 Arduino Code Example

This is what your **ESP32 firmware** should do:

```cpp
// ESP32_BINTECH_KIOSK.ino
// Waste Sorter Kiosk Firmware

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==========================================
// CONFIGURATION
// ==========================================
const char* SSID = "YOUR_WIFI_SSID";
const char* PASSWORD = "YOUR_WIFI_PASSWORD";

const char* SERVER_URL = "http://YOUR_SERVER_IP:3000/api/qr/scan";
const char* API_KEY = "esp32_secret_key_12345_change_this";  // Same as Supabase!
const char* DEVICE_ID = "ESP32_KIOSK_001";

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  WiFi.begin(SSID, PASSWORD);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
  // Wait for user QR scan input
  if (Serial.available()) {
    String userQR = Serial.readStringUntil('\n');
    userQR.trim();
    
    // Get waste type from user (1-5, etc.)
    String wasteType = getUserWasteChoice();
    
    // Send to backend
    sendToBackend(userQR, wasteType);
  }
  
  delay(100);
}

// ==========================================
// SEND TO BACKEND
// ==========================================
void sendToBackend(String userQR, String wasteType) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    
    // Set headers
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + API_KEY);
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["userQR"] = userQR;
    doc["wasteType"] = wasteType;
    doc["deviceId"] = DEVICE_ID;
    doc["transactionId"] = generateTransactionID();  // Unique ID
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send POST request
    int httpCode = http.POST(jsonString);
    
    if (httpCode == 200) {
      String response = http.getString();
      DynamicJsonDocument responseDoc(200);
      deserializeJson(responseDoc, response);
      
      int points = responseDoc["pointsEarned"];
      Serial.println("✓ Success! Points earned: " + String(points));
      
    } else {
      Serial.println("✗ Error: HTTP " + String(httpCode));
    }
    
    http.end();
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
String generateTransactionID() {
  // Create unique ID using timestamp + random
  return "tx_" + String(millis()) + "_" + String(random(10000));
}

String getUserWasteChoice() {
  // Display menu, get choice (1=plastic, 2=paper, etc.)
  // Return waste type
  return "plastic";  // Placeholder
}
```

---

## STEP 5: Testing Your Integration

### 5.1 Manual Testing with cURL

```bash
# Test your endpoint with curl (from Windows PowerShell)
$headers = @{
    "Authorization" = "Bearer esp32_secret_key_12345_change_this"
    "Content-Type" = "application/json"
}

$body = @{
    "userQR" = "USER_QR_CODE_HERE"
    "wasteType" = "plastic"
    "deviceId" = "ESP32_KIOSK_001"
    "transactionId" = "tx_test_123"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -URI "http://localhost:3000/api/qr/scan" `
    -Method POST `
    -Headers $headers `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Points credited successfully!",
  "pointsEarned": 10,
  "totalPoints": 150,
  "transactionId": "tx_test_123"
}
```

### 5.2 Test Error Cases

**Test 1: Invalid API Key**
```bash
# Should return 401 Unauthorized
$headers = @{ "Authorization" = "Bearer WRONG_KEY" }
```

**Test 2: Invalid QR Code**
```bash
# Should return 400 Bad Request
$body = @{ "userQR" = "INVALID_QR" } | ConvertTo-Json
```

**Test 3: Duplicate Transaction**
```bash
# Send same transactionId twice
# Second request should return "already processed"
```

---

## 🔐 SECURITY CHECKLIST

- [ ] **API Key**: Use strong random key (at least 32 characters)
- [ ] **HTTPS**: Use HTTPS in production (not just HTTP)
- [ ] **Rate Limiting**: Add rate limit to `/api/qr/scan` (max 10 requests/minute per device)
- [ ] **Timeout**: Set 30-second timeout for ESP32 requests
- [ ] **Logging**: Keep transaction logs for 1+ year
- [ ] **Backup**: Regular database backups
- [ ] **Monitor**: Check `iot_devices.last_seen` to detect dead machines

---

## ⚠️ IMPORTANT NOTES FOR COLLEGE PROJECT

### Single Machine Simplifications
Since you have **only 1 ESP32**, you can simplify:

1. **No multi-device coordination needed**
2. **Single API key** (don't need per-user tokens)
3. **No geofencing** (only 1 location)
4. **Simple retry logic** (3 tries max = good enough)

### What NOT to do
❌ Don't skip the auth middleware (even with 1 device)
❌ Don't ignore duplicate transactions
❌ Don't skip logging (for debugging)
❌ Don't use "admin" access key for ESP32

### File Summary
Your new file structure will be:
```
bintech/
├── routes/
│   └── qr.js (UPDATED - add authenticateDevice)
├── controllers/
│   └── qrController.js (UPDATED - implement new logic)
├── middleware/
│   └── iotAuth.js (NEW - authentication)
├── services/
│   └── qrValidator.js (NEW - QR validation)
└── ESP32_IoT_INTEGRATION_GUIDE.md (This file)
```

---

## 📞 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| ESP32 can't connect | Check WiFi SSID/password in code |
| 401 Unauthorized | Verify API key matches Supabase |
| Points not updating | Check user QR exists in database |
| Timeout errors | Increase timeout to 60 seconds |
| Duplicate points | Check transactionId is unique |

---

## 🎯 IMPLEMENTATION ORDER

1. **First:** Create Supabase tables (STEP 1)
2. **Second:** Create middleware & services (STEP 2.1-2.2)
3. **Third:** Update controllers & routes (STEP 2.3-2.4)
4. **Fourth:** Register device in Supabase (STEP 3.1)
5. **Fifth:** Add QR codes for bins (STEP 3.2)
6. **Sixth:** Test locally with cURL (STEP 5.1)
7. **Seventh:** Update ESP32 firmware (STEP 4)
8. **Eighth:** Test end-to-end

---

**Good luck with your project! 🚀**

Keep this guide handy when implementing!
