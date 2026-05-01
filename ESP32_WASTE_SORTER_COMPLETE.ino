#include <ESP32Servo.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

// ============ MACHINE IDENTIFICATION ============
const String MACHINE_ID = "BINTECH-SORTER-001";
const String BACKEND_URL = "http://192.168.254.105:3000"; // Change to your Node.js server IP
// ============================================

// ============ MULTIPLE WiFi SETUP ============
const char* ssids[] = {
  "GlobeAtHome_9B6AA_2.4",
  "MyHomeWiFi",
  ""
};

const char* passwords[] = {
  "RkF2b3ub",
  "Pass123456",
  ""
};

const int networkCount = 3;
WebServer server(80);

String sessionID = "";
bool sessionActive = false;
// ============ END MULTIPLE WiFi SETUP ============

// --- PIN ASSIGNMENTS ---
const int inductivePin = 25;  
const int capacitivePin = 26; 
const int servoMetalPin = 23; 
const int servoPlasticPin = 22;
const int irPin = 15;
const int motorENA = 13;
const int motorIN1 = 12;
const int motorIN2 = 14;

// --- ULTRASONIC SENSOR PINS ---
const int paperTrigPin = 2;
const int paperEchoPin = 5;
const int plasticTrigPin = 4;
const int plasticEchoPin = 18;
const int metalTrigPin = 16;
const int metalEchoPin = 19;

Servo metalServo;
Servo plasticServo;

// --- TIMING & STATE MANAGEMENT ---
enum DetectionState {
  IDLE,
  WAITING_FOR_DETECTION,
  SORTING,
  MOTOR_RUNNING,
  VERIFICATION_WINDOW
};

DetectionState currentState = IDLE;
unsigned long detectionStartTime = 0;
const unsigned long IDENTIFICATION_WINDOW = 2000;
const unsigned long MOTOR_DELAY = 1000;
const unsigned long VERIFICATION_TIMEOUT = 10000;
unsigned long motorStartTime = 0;
unsigned long verificationStartTime = 0;

// Sensor readings during detection window
bool metalDetected = false;
bool plasticDetected = false;
bool paperDetected = false;

// Verification flags
bool verificationNeeded = false;
String materialToVerify = "";
float pointsAwarded = 0.0;
bool pointsAlreadyAwarded = false;
bool motorStopped = false;

// Previous sensor states for edge detection
bool inductivePrev = HIGH;
bool capacitivePrev = HIGH;
bool irPrev = HIGH;

// --- POINTS SYSTEM ---
float totalPoints = 0.0;
int metalCount = 0;
int plasticCount = 0;
int paperCount = 0;

// --- ULTRASONIC DETECTION COOLDOWN ---
unsigned long lastMetalDetectTime = 0;
unsigned long lastPlasticDetectTime = 0;
unsigned long lastPaperDetectTime = 0;
const unsigned long ULTRASONIC_COOLDOWN = 1000;

// --- BIN OCCUPANCY DETECTION ---
bool metalBinFull = false;
bool plasticBinFull = false;
bool paperBinFull = false;

unsigned long metalOccupancyStartTime = 0;
unsigned long plasticOccupancyStartTime = 0;
unsigned long paperOccupancyStartTime = 0;

const unsigned long BIN_FULL_THRESHOLD = 10000;

// --- DETECTION RANGES (in cm) ---
const int VERIFICATION_RANGE = 30;
const int OCCUPANCY_DETECTION_RANGE = 40;

// --- WiFi timing ---
unsigned long lastWiFiCheck = 0;
const unsigned long WiFi_CHECK_INTERVAL = 5000; // Check WiFi every 5 seconds

// --- Backend Update timing ---
unsigned long lastBackendUpdate = 0;
const unsigned long BACKEND_UPDATE_INTERVAL = 5000; // Send updates every 5 seconds

void syncActiveSessionFromBackend();
void sendBinCapacityTelemetry();
int distanceToFillPercentage(long distanceCm);

void resetMachineSession(bool clearSessionId = true) {
  currentState = IDLE;
  stopMotor();
  sessionActive = false;
  if (clearSessionId) {
    sessionID = "";
  }
  totalPoints = 0.0;
  metalCount = 0;
  plasticCount = 0;
  paperCount = 0;
  pointsAlreadyAwarded = false;
  verificationNeeded = false;
  materialToVerify = "";
  pointsAwarded = 0.0;
  Serial.println("[SESSION] Machine counters reset.");
}

void setup() {
  Serial.begin(115200);
  
  // Setup Sensors with Internal Pullups
  pinMode(inductivePin, INPUT_PULLUP);
  pinMode(capacitivePin, INPUT_PULLUP);
  pinMode(irPin, INPUT_PULLUP);
  
  // Setup Motor Pins
  pinMode(motorENA, OUTPUT);
  pinMode(motorIN1, OUTPUT);
  pinMode(motorIN2, OUTPUT);
  
  // Setup Ultrasonic Pins
  pinMode(paperTrigPin, OUTPUT);
  pinMode(paperEchoPin, INPUT);
  pinMode(plasticTrigPin, OUTPUT);
  pinMode(plasticEchoPin, INPUT);
  pinMode(metalTrigPin, OUTPUT);
  pinMode(metalEchoPin, INPUT);
  
  // Attach and Home Servos
  metalServo.attach(servoMetalPin, 500, 2400);
  plasticServo.attach(servoPlasticPin, 500, 2400);
  
  metalServo.write(0);
  plasticServo.write(0);
  
  // Stop motor initially
  digitalWrite(motorIN1, LOW);
  digitalWrite(motorIN2, LOW);
  analogWrite(motorENA, 0);
  
  Serial.println("========================================");
  Serial.println("  INTELLIGENT WASTE SORTER");
  Serial.println("  Metal/Plastic/Paper Classification");
  Serial.println("  With Ultrasonic Verification");
  Serial.println("  + Bin Occupancy Detection + WiFi");
  Serial.println("========================================");
  Serial.println("\n[SYSTEM INFO]");
  Serial.printf("Machine ID: %s\n", MACHINE_ID.c_str());
  Serial.printf("Backend URL: %s\n", BACKEND_URL.c_str());
  Serial.println("Verification Range: 30cm | Timeout: 10 seconds");
  Serial.println("Occupancy Range: 40cm | Full Threshold: 10 seconds");
  Serial.println();
  
  // WiFi Setup (non-blocking in background)
  delay(1000);
  connectToWiFi();
  setupAPIRoutes();
  server.begin();
  
  printStats();
}

void loop() {
  // WIFI HANDLING (minimal, fast)
  server.handleClient();
  
  // Periodic WiFi reconnection check
  if (millis() - lastWiFiCheck > WiFi_CHECK_INTERVAL) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Connection lost, reconnecting...");
      WiFi.reconnect();
    }
    lastWiFiCheck = millis();
  }

  // Periodic backend update
  if (millis() - lastBackendUpdate > BACKEND_UPDATE_INTERVAL) {
    if (sessionActive && sessionID.length() > 0) {
      sendBackendUpdate();
    } else {
      syncActiveSessionFromBackend();
    }
    sendBinCapacityTelemetry();
    lastBackendUpdate = millis();
  }

  // Read Sensors (non-blocking)
  bool inductiveVal = digitalRead(inductivePin);
  bool capacitiveVal = digitalRead(capacitivePin);
  bool irVal = digitalRead(irPin);

  // Check bin occupancy status (continuous monitoring)
  checkBinOccupancy();

  switch (currentState) {
    case IDLE:
      // Wait for first sensor trigger
      if ((inductivePrev == HIGH && inductiveVal == LOW) ||
          (capacitivePrev == HIGH && capacitiveVal == LOW) ||
          (irPrev == HIGH && irVal == LOW)) {
        
        // Check if the appropriate bin is full
        if (inductiveVal == LOW && metalBinFull) {
          Serial.println("\n[BLOCKED] Metal bin is FULL! Cannot sort...");
        } else if (capacitiveVal == LOW && plasticBinFull) {
          Serial.println("\n[BLOCKED] Plastic bin is FULL! Cannot sort...");
        } else if (irVal == LOW && paperBinFull) {
          Serial.println("\n[BLOCKED] Paper bin is FULL! Cannot sort...");
        } else {
          Serial.println("\n[DETECTION START] Opening 2-second identification window...");
          currentState = WAITING_FOR_DETECTION;
          detectionStartTime = millis();
          
          // Reset material flags
          metalDetected = false;
          plasticDetected = false;
          paperDetected = false;
        }
      }
      break;

    case WAITING_FOR_DETECTION:
      // Collect sensor data during identification window
      if (inductiveVal == LOW) {
        metalDetected = true;
      }
      if (capacitiveVal == LOW) {
        plasticDetected = true;
      }
      if (irVal == LOW) {
        paperDetected = true;
      }

      // Check if identification window has closed
      if (millis() - detectionStartTime >= IDENTIFICATION_WINDOW) {
        classifyAndSort();
        currentState = MOTOR_RUNNING;
        motorStartTime = millis();
        motorStopped = false;
      }
      break;

    case MOTOR_RUNNING:
      // Wait for delay before starting motor
      if (millis() - motorStartTime >= MOTOR_DELAY) {
        startMotor();
        currentState = VERIFICATION_WINDOW;
        verificationStartTime = millis();
      }
      break;

    case VERIFICATION_WINDOW:
      // Check ultrasonic sensors for verification (CONTINUOUS)
      checkUltrasonicVerification();
      
      // Motor runs for 5 seconds, but verification continues after
      if (millis() - motorStartTime >= (MOTOR_DELAY + 5000) && !motorStopped) {
        stopMotor();
        motorStopped = true;
      }
      
      // If points already awarded, end cycle immediately
      if (pointsAlreadyAwarded) {
        // Display stats first
        printStats();
        // Then stop motor right after
        if (!motorStopped) {
          stopMotor();
          motorStopped = true;
        }
        // Reset for next cycle
        verificationNeeded = false;
        pointsAlreadyAwarded = false;
        motorStopped = false;
        currentState = IDLE;
        delay(500);
      }
      // Check if verification timeout has been reached (10 seconds total from verification start)
      else if (millis() - verificationStartTime >= VERIFICATION_TIMEOUT) {
        // Display stats first
        printStats();
        // Then stop motor right after
        if (!motorStopped) {
          stopMotor();
          motorStopped = true;
        }
        
        // If verification failed (points not awarded)
        if (verificationNeeded && !pointsAlreadyAwarded) {
          Serial.println("[VERIFICATION FAILED] Object not detected in bin within 10 seconds!");
          verificationNeeded = false;
        }
        
        // Reset for next cycle
        verificationNeeded = false;
        pointsAlreadyAwarded = false;
        motorStopped = false;
        currentState = IDLE;
        delay(500);
      }
      break;
  }

  // Store previous states
  inductivePrev = inductiveVal;
  capacitivePrev = capacitiveVal;
  irPrev = irVal;
  
  delay(50);
}

void classifyAndSort() {
  Serial.println("[CLASSIFICATION RESULTS]");
  Serial.printf("Inductive: %d | Capacitive: %d | IR: %d\n", metalDetected, plasticDetected, paperDetected);

  if (metalDetected) {
    Serial.println("=> METAL DETECTED! Activating metal servo...");
    metalServo.write(60);
    delay(100);
    verificationNeeded = true;
    materialToVerify = "METAL";
    pointsAwarded = 2.0;
    pointsAlreadyAwarded = false;
  }
  else if (plasticDetected && !metalDetected) {
    Serial.println("=> PLASTIC DETECTED! Activating plastic servo...");
    plasticServo.write(60);
    delay(100);
    verificationNeeded = true;
    materialToVerify = "PLASTIC";
    pointsAwarded = 1.0;
    pointsAlreadyAwarded = false;
  }
  else if (paperDetected && !metalDetected && !plasticDetected) {
    Serial.println("=> PAPER DETECTED! Motor only (no servo)...");
    verificationNeeded = true;
    materialToVerify = "PAPER";
    pointsAwarded = 0.5;
    pointsAlreadyAwarded = false;
  }
  else {
    Serial.println("=> UNKNOWN COMBINATION! Defaulting to motor only...");
    verificationNeeded = false;
    pointsAlreadyAwarded = false;
  }
}

void checkUltrasonicVerification() {
  if (!verificationNeeded || pointsAlreadyAwarded) return;

  if (materialToVerify == "METAL") {
    long distance = measureDistance(metalTrigPin, metalEchoPin);
    
    if (distance > 0 && distance < VERIFICATION_RANGE && (millis() - lastMetalDetectTime) > ULTRASONIC_COOLDOWN) {
      Serial.println("[VERIFICATION SUCCESS] Metal object detected in bin!");
      addPoints(pointsAwarded, "METAL");
      metalCount++;
      pointsAlreadyAwarded = true;
      lastMetalDetectTime = millis();
    }
  }
  else if (materialToVerify == "PLASTIC") {
    long distance = measureDistance(plasticTrigPin, plasticEchoPin);
    
    if (distance > 0 && distance < VERIFICATION_RANGE && (millis() - lastPlasticDetectTime) > ULTRASONIC_COOLDOWN) {
      Serial.println("[VERIFICATION SUCCESS] Plastic object detected in bin!");
      addPoints(pointsAwarded, "PLASTIC");
      plasticCount++;
      pointsAlreadyAwarded = true;
      lastPlasticDetectTime = millis();
    }
  }
  else if (materialToVerify == "PAPER") {
    long distance = measureDistance(paperTrigPin, paperEchoPin);
    
    if (distance > 0 && distance < VERIFICATION_RANGE && (millis() - lastPaperDetectTime) > ULTRASONIC_COOLDOWN) {
      Serial.println("[VERIFICATION SUCCESS] Paper object detected in bin!");
      addPoints(pointsAwarded, "PAPER");
      paperCount++;
      pointsAlreadyAwarded = true;
      lastPaperDetectTime = millis();
    }
  }
}

void checkBinOccupancy() {
  // Check METAL bin occupancy
  long metalDistance = measureDistance(metalTrigPin, metalEchoPin);
  if (metalDistance > 0 && metalDistance < OCCUPANCY_DETECTION_RANGE) {
    if (metalOccupancyStartTime == 0) {
      metalOccupancyStartTime = millis();
    }
    
    if ((millis() - metalOccupancyStartTime) >= BIN_FULL_THRESHOLD) {
      if (!metalBinFull) {
        metalBinFull = true;
        Serial.println("\n[BIN STATUS] ⚠️  METAL BIN IS FULL!");
        Serial.println("[ACTION] Metal sorting disabled until bin is emptied\n");
        sendBinWarning("METAL");
      }
    }
  } else {
    metalOccupancyStartTime = 0;
    if (metalBinFull) {
      metalBinFull = false;
      Serial.println("\n[BIN STATUS] ✓ Metal bin emptied - sorting resumed\n");
    }
  }

  // Check PLASTIC bin occupancy
  long plasticDistance = measureDistance(plasticTrigPin, plasticEchoPin);
  if (plasticDistance > 0 && plasticDistance < OCCUPANCY_DETECTION_RANGE) {
    if (plasticOccupancyStartTime == 0) {
      plasticOccupancyStartTime = millis();
    }
    
    if ((millis() - plasticOccupancyStartTime) >= BIN_FULL_THRESHOLD) {
      if (!plasticBinFull) {
        plasticBinFull = true;
        Serial.println("\n[BIN STATUS] ⚠️  PLASTIC BIN IS FULL!");
        Serial.println("[ACTION] Plastic sorting disabled until bin is emptied\n");
        sendBinWarning("PLASTIC");
      }
    }
  } else {
    plasticOccupancyStartTime = 0;
    if (plasticBinFull) {
      plasticBinFull = false;
      Serial.println("\n[BIN STATUS] ✓ Plastic bin emptied - sorting resumed\n");
    }
  }

  // Check PAPER bin occupancy
  long paperDistance = measureDistance(paperTrigPin, paperEchoPin);
  if (paperDistance > 0 && paperDistance < OCCUPANCY_DETECTION_RANGE) {
    if (paperOccupancyStartTime == 0) {
      paperOccupancyStartTime = millis();
    }
    
    if ((millis() - paperOccupancyStartTime) >= BIN_FULL_THRESHOLD) {
      if (!paperBinFull) {
        paperBinFull = true;
        Serial.println("\n[BIN STATUS] ⚠️  PAPER BIN IS FULL!");
        Serial.println("[ACTION] Paper sorting disabled until bin is emptied\n");
        sendBinWarning("PAPER");
      }
    }
  } else {
    paperOccupancyStartTime = 0;
    if (paperBinFull) {
      paperBinFull = false;
      Serial.println("\n[BIN STATUS] ✓ Paper bin emptied - sorting resumed\n");
    }
  }
}

long measureDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH, 30000);
  
  if (duration == 0) {
    return -1;
  }
  
  long distance = duration * 0.0343 / 2;
  
  return distance;
}

void addPoints(float points, const char* material) {
  totalPoints += points;
  Serial.print("[POINTS AWARDED] ");
  Serial.print(material);
  Serial.print(" +");
  Serial.print(points, 1);
  Serial.print(" pts | Total: ");
  Serial.print(totalPoints, 1);
  Serial.println(" pts");
}

void startMotor() {
  Serial.println("[MOTOR START]");
  digitalWrite(motorIN1, HIGH);
  digitalWrite(motorIN2, LOW);
  analogWrite(motorENA, 130);
}

void stopMotor() {
  Serial.println("[MOTOR STOP]");
  digitalWrite(motorIN1, LOW);
  digitalWrite(motorIN2, LOW);
  analogWrite(motorENA, 0);
  
  metalServo.write(0);
  plasticServo.write(0);
}

void printStats() {
  Serial.println("\n========================================");
  Serial.println("         CURRENT SESSION STATS");
  Serial.println("========================================");
  Serial.printf("Metal Items:   %d | Points: %.1f", metalCount, metalCount * 2.0);
  if (metalBinFull) Serial.print(" | ⚠️  BIN FULL");
  Serial.println();
  
  Serial.printf("Plastic Items: %d | Points: %.1f", plasticCount, plasticCount * 1.0);
  if (plasticBinFull) Serial.print(" | ⚠️  BIN FULL");
  Serial.println();
  
  Serial.printf("Paper Items:   %d | Points: %.1f", paperCount, paperCount * 0.5);
  if (paperBinFull) Serial.print(" | ⚠️  BIN FULL");
  Serial.println();
  
  Serial.println("----------------------------------------");
  Serial.printf("TOTAL POINTS: %.1f\n", totalPoints);
  Serial.println("========================================\n");
}

// ============ WiFi & API FUNCTIONS ============

void connectToWiFi() {
  Serial.println("\n[WiFi] Starting connection...");
  
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  
  int bestNetwork = -1;
  int bestRSSI = -100;
  
  int networksFound = WiFi.scanNetworks();
  
  if (networksFound == 0) {
    Serial.println("[WiFi] ✗ No networks found!");
    return;
  }
  
  Serial.printf("[WiFi] Found %d networks\n\n", networksFound);
  
  for (int i = 0; i < networksFound; i++) {
    String foundSSID = WiFi.SSID(i);
    int foundRSSI = WiFi.RSSI(i);
    
    Serial.printf("[WiFi] %s (Signal: %d dBm)\n", foundSSID.c_str(), foundRSSI);
    
    for (int j = 0; j < networkCount; j++) {
      if (strlen(ssids[j]) > 0 && foundSSID == ssids[j] && foundRSSI > bestRSSI) {
        bestNetwork = j;
        bestRSSI = foundRSSI;
      }
    }
  }
  
  if (bestNetwork == -1) {
    Serial.println("[WiFi] ✗ No configured networks found!");
    return;
  }
  
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(ssids[bestNetwork]);
  
  WiFi.begin(ssids[bestNetwork], passwords[bestNetwork]);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] ✓ Connected!");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] ✗ Connection failed!");
  }
}

void setupAPIRoutes() {
  server.on("/api/session/start", HTTP_POST, handleStartSession);
  server.on("/api/hardware/stats", HTTP_GET, handleGetStats);
  server.on("/api/session/transfer", HTTP_POST, handleTransferPoints);
  server.on("/api/session/end", HTTP_POST, handleEndSession);
  
  Serial.println("[API] Routes configured\n");
}

void handleStartSession() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data\"}");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(256);
  deserializeJson(doc, body);
  
  String qrID = doc["sessionID"];
  
  if (qrID.length() == 0) {
    server.send(400, "application/json", "{\"error\":\"Missing sessionID\"}");
    return;
  }
  
  resetMachineSession(false);
  sessionID = qrID;
  sessionActive = true;
  
  Serial.print("[SESSION] Started: ");
  Serial.println(sessionID);
  
  DynamicJsonDocument response(256);
  response["status"] = "success";
  response["sessionID"] = sessionID;
  response["machineID"] = MACHINE_ID;
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(200, "application/json", responseStr);
}

void handleGetStats() {
  DynamicJsonDocument response(512);
  response["machineID"] = MACHINE_ID;
  response["sessionActive"] = sessionActive;
  response["sessionID"] = sessionID;
  response["totalPoints"] = totalPoints;
  response["metalCount"] = metalCount;
  response["plasticCount"] = plasticCount;
  response["paperCount"] = paperCount;
  response["metalBinFull"] = metalBinFull;
  response["plasticBinFull"] = plasticBinFull;
  response["paperBinFull"] = paperBinFull;
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(200, "application/json", responseStr);
}

void handleTransferPoints() {
  if (!sessionActive) {
    server.send(400, "application/json", "{\"error\":\"No active session\"}");
    return;
  }
  
  DynamicJsonDocument response(512);
  response["status"] = "success";
  response["machineID"] = MACHINE_ID;
  response["totalPoints"] = totalPoints;
  response["metalCount"] = metalCount;
  response["plasticCount"] = plasticCount;
  response["paperCount"] = paperCount;
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(200, "application/json", responseStr);
}

void handleEndSession() {
  if (!sessionActive) {
    server.send(400, "application/json", "{\"error\":\"No active session\"}");
    return;
  }

  resetMachineSession(true);
  
  DynamicJsonDocument response(256);
  response["status"] = "success";
  response["message"] = "Session ended";
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(200, "application/json", responseStr);
}

// ============ BACKEND INTEGRATION ============

void sendBackendUpdate() {
  if (WiFi.status() != WL_CONNECTED || !sessionActive || sessionID.length() == 0) {
    return;
  }
  
  HTTPClient http;
  
  String url = BACKEND_URL + "/api/waste-sorter/api/session/update";
  
  DynamicJsonDocument doc(512);
  doc["machineId"] = MACHINE_ID;
  if (sessionID.length() > 0) {
    doc["sessionId"] = sessionID;
  }
  doc["metalCount"] = metalCount;
  doc["plasticCount"] = plasticCount;
  doc["paperCount"] = paperCount;
  doc["totalPoints"] = totalPoints;

  JsonObject capacities = doc.createNestedObject("binCapacities");
  capacities["metal"] = distanceToFillPercentage(measureDistance(metalTrigPin, metalEchoPin));
  capacities["plastic"] = distanceToFillPercentage(measureDistance(plasticTrigPin, plasticEchoPin));
  capacities["paper"] = distanceToFillPercentage(measureDistance(paperTrigPin, paperEchoPin));
  
  String json;
  serializeJson(doc, json);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(json);
  String responseBody = http.getString();
  
  if (httpResponseCode > 0) {
    Serial.printf("[Backend] Update HTTP %d | Payload: %s\n", httpResponseCode, json.c_str());
    if (responseBody.length() > 0) {
      Serial.printf("[Backend] Response: %s\n", responseBody.c_str());
    }

    // If backend matched an active session, keep local session marker aligned.
    if (httpResponseCode == 200) {
      DynamicJsonDocument resDoc(512);
      DeserializationError err = deserializeJson(resDoc, responseBody);
      if (!err) {
        if (resDoc["resetMachine"] == true) {
          Serial.println("[SESSION] Reset requested by backend after transfer.");
          resetMachineSession(true);
        } else if (resDoc["sessionId"]) {
          sessionID = String((const char*)resDoc["sessionId"]);
          sessionActive = true;
        }
      }
    }
  } else {
    Serial.printf("[Backend] Update failed: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

int distanceToFillPercentage(long distanceCm) {
  if (distanceCm <= 0) {
    return -1;
  }

  float fill = ((float)(OCCUPANCY_DETECTION_RANGE - distanceCm) / (float)OCCUPANCY_DETECTION_RANGE) * 100.0;
  if (fill < 0) fill = 0;
  if (fill > 100) fill = 100;
  return (int)fill;
}

void sendBinCapacityTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  int metalFill = distanceToFillPercentage(measureDistance(metalTrigPin, metalEchoPin));
  int plasticFill = distanceToFillPercentage(measureDistance(plasticTrigPin, plasticEchoPin));
  int paperFill = distanceToFillPercentage(measureDistance(paperTrigPin, paperEchoPin));

  if (metalFill < 0 && plasticFill < 0 && paperFill < 0) {
    return;
  }

  HTTPClient http;
  String url = BACKEND_URL + "/api/waste-sorter/api/bin-capacity";

  DynamicJsonDocument doc(512);
  doc["machineId"] = MACHINE_ID;

  JsonObject capacities = doc.createNestedObject("capacities");

  JsonObject metal = capacities.createNestedObject("metal");
  if (metalFill >= 0) {
    metal["fillPercentage"] = metalFill;
    metal["isFull"] = metalBinFull;
  }

  JsonObject plastic = capacities.createNestedObject("plastic");
  if (plasticFill >= 0) {
    plastic["fillPercentage"] = plasticFill;
    plastic["isFull"] = plasticBinFull;
  }

  JsonObject paper = capacities.createNestedObject("paper");
  if (paperFill >= 0) {
    paper["fillPercentage"] = paperFill;
    paper["isFull"] = paperBinFull;
  }

  String json;
  serializeJson(doc, json);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int httpResponseCode = http.POST(json);

  if (httpResponseCode > 0) {
    Serial.printf("[Backend] Capacity telemetry sent HTTP %d\n", httpResponseCode);
  } else {
    Serial.printf("[Backend] Capacity telemetry failed: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

void syncActiveSessionFromBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String url = BACKEND_URL + "/api/waste-sorter/api/device/" + MACHINE_ID + "/session";

  http.begin(url);
  int httpResponseCode = http.GET();
  String responseBody = http.getString();

  if (httpResponseCode == 200) {
    DynamicJsonDocument doc(768);
    DeserializationError err = deserializeJson(doc, responseBody);
    if (!err && doc["success"] == true && doc["session"]) {
      JsonObject session = doc["session"];
      String backendSessionId = session["sessionId"] | "";

      if (backendSessionId.length() > 0) {
        bool sessionChanged = (sessionID != backendSessionId);
        sessionID = backendSessionId;
        sessionActive = session["isActive"] | false;

        if (sessionChanged) {
          totalPoints = session["pointsEarned"] | 0.0;
          metalCount = session["metalCount"] | 0;
          plasticCount = session["plasticCount"] | 0;
          paperCount = session["paperCount"] | 0;
          Serial.printf("[SESSION] Synced active session from backend: %s\n", sessionID.c_str());
        }
      }
    }
  } else if (httpResponseCode == 404) {
    // No active backend session for this machine.
    if (sessionActive || sessionID.length() > 0) {
      Serial.println("[SESSION] No active backend session. Resetting local session.");
      resetMachineSession(true);
    }
  }

  http.end();
}

void sendBinWarning(String bin) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  
  String url = BACKEND_URL + "/api/waste-sorter/api/bin-warning";
  
  DynamicJsonDocument doc(256);
  doc["machineId"] = MACHINE_ID;
  doc["binType"] = bin;
  doc["isFull"] = true;
  doc["fillPercentage"] = 100;
  doc["timestamp"] = millis();
  
  String json;
  serializeJson(doc, json);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(json);
  
  if (httpResponseCode > 0) {
    Serial.printf("[Backend] Bin warning sent: %s\n", bin.c_str());
  }
  
  http.end();
}

// ============ END WiFi & API FUNCTIONS ============
