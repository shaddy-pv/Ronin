# RONIN Hardware Implementation Guide

## Overview
This guide explains exactly what hardware you need to build and how to connect it to your Firebase database.

---

## 🎯 Two Hardware Components Needed

### 1. IoT Sensor Station (Stationary)
Monitors environment and sends data to Firebase

### 2. Rover Robot (Mobile)
Receives commands from Firebase and executes them

---

## 📡 IoT SENSOR STATION

### Hardware Components
```
ESP32 DevKit
├── MQ-2 (Gas Sensor) → Analog Pin A0
├── MQ-135 (Air Quality) → Analog Pin A1  
├── DHT22 (Temp/Humidity) → Digital Pin 4
├── Flame Sensor → Digital Pin 5
├── PIR Motion → Digital Pin 6
└── 5V Power Supply
```

### Wiring Diagram
```
ESP32          Sensors
-----          -------
A0    ←───────  MQ-2 (Analog Out)
A1    ←───────  MQ-135 (Analog Out)
D4    ←───────  DHT22 (Data)
D5    ←───────  Flame Sensor (Digital Out)
D6    ←───────  PIR Motion (Digital Out)
3.3V  ────────→ All Sensors VCC
GND   ────────→ All Sensors GND
```

### Required Arduino Libraries
```cpp
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>
```

Install via Arduino IDE:
- Firebase ESP32 Client by Mobizt
- DHT sensor library by Adafruit

### Complete ESP32 Code
```cpp
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>

// WiFi credentials
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"

// Firebase credentials (from your .env file)
#define FIREBASE_HOST "ronin-80b29-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "your_firebase_secret_or_token"

// Sensor pins
#define MQ2_PIN 34        // Analog pin for MQ-2
#define MQ135_PIN 35      // Analog pin for MQ-135
#define DHT_PIN 4         // Digital pin for DHT22
#define FLAME_PIN 5       // Digital pin for flame sensor
#define MOTION_PIN 6      // Digital pin for PIR

// DHT sensor
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Firebase objects
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// Sensor ranges for normalization
const int MQ2_MIN = 200;
const int MQ2_MAX = 1000;
const int MQ135_MIN = 300;
const int MQ135_MAX = 1200;
const float TEMP_MIN = 15.0;
const float TEMP_MAX = 45.0;

void setup() {
  Serial.begin(115200);
  
  // Initialize sensors
  pinMode(FLAME_PIN, INPUT);
  pinMode(MOTION_PIN, INPUT);
  dht.begin();
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Configure Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  Serial.println("Firebase Connected!");
}

void loop() {
  // Read all sensors
  int mq2 = analogRead(MQ2_PIN);
  int mq135 = analogRead(MQ135_PIN);
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  bool flame = digitalRead(FLAME_PIN) == HIGH;
  bool motion = digitalRead(MOTION_PIN) == HIGH;
  
  // Check for DHT read errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT read error!");
    temperature = 25.0;  // Default value
    humidity = 50.0;     // Default value
  }
  
  // Calculate hazard score
  float hazardScore = calculateHazardScore(mq2, mq135, temperature);
  
  // Print to serial for debugging
  Serial.println("=== Sensor Readings ===");
  Serial.printf("MQ-2: %d\n", mq2);
  Serial.printf("MQ-135: %d\n", mq135);
  Serial.printf("Temperature: %.1f°C\n", temperature);
  Serial.printf("Humidity: %.1f%%\n", humidity);
  Serial.printf("Flame: %s\n", flame ? "DETECTED" : "None");
  Serial.printf("Motion: %s\n", motion ? "DETECTED" : "None");
  Serial.printf("Hazard Score: %.1f\n", hazardScore);
  Serial.println("=======================");
  
  // Write to Firebase
  if (Firebase.ready()) {
    // Update sensor readings
    Firebase.setInt(firebaseData, "/ronin/iot/mq2", mq2);
    Firebase.setInt(firebaseData, "/ronin/iot/mq135", mq135);
    Firebase.setFloat(firebaseData, "/ronin/iot/temperature", temperature);
    Firebase.setFloat(firebaseData, "/ronin/iot/humidity", humidity);
    Firebase.setBool(firebaseData, "/ronin/iot/flame", flame);
    Firebase.setBool(firebaseData, "/ronin/iot/motion", motion);
    Firebase.setFloat(firebaseData, "/ronin/iot/hazardScore", hazardScore);
    
    // Update status
    Firebase.setBool(firebaseData, "/ronin/iot/status/online", true);
    Firebase.setInt(firebaseData, "/ronin/iot/status/lastHeartbeat", millis());
    
    Serial.println("✓ Data sent to Firebase");
  } else {
    Serial.println("✗ Firebase not ready");
  }
  
  // Wait 3 seconds before next reading
  delay(3000);
}

float calculateHazardScore(int mq2, int mq135, float temp) {
  // Normalize values to 0-100 range
  float normMQ2 = constrain(map(mq2, MQ2_MIN, MQ2_MAX, 0, 100), 0, 100);
  float normMQ135 = constrain(map(mq135, MQ135_MIN, MQ135_MAX, 0, 100), 0, 100);
  float normTemp = constrain(map(temp, TEMP_MIN, TEMP_MAX, 0, 100), 0, 100);
  
  // Weighted average (matches frontend calculation)
  // MQ-135: 60%, MQ-2: 30%, Temperature: 10%
  float hazard = (0.6 * normMQ135) + (0.3 * normMQ2) + (0.1 * normTemp);
  
  return hazard;
}
```

### Testing the IoT Station
1. Upload code to ESP32
2. Open Serial Monitor (115200 baud)
3. Watch for "WiFi Connected!" and "Firebase Connected!"
4. Check Firebase Console - data should appear in `ronin/iot/`
5. Open web app - Dashboard should show live data!

---

## 🤖 ROVER ROBOT

### Hardware Components
```
ESP32 DevKit (Main Controller)
├── L298N Motor Driver
│   ├── Motor 1 (Left)
│   └── Motor 2 (Right)
├── ESP32-CAM (Camera Module)
├── 7.4V LiPo Battery
└── Voltage Regulator (7.4V → 5V)
```

### Wiring Diagram
```
ESP32          L298N          Motors
-----          -----          ------
D12   ────────→ IN1
D13   ────────→ IN2           Motor Left
D14   ────────→ IN3
D15   ────────→ IN4           Motor Right
5V    ────────→ 5V
GND   ────────→ GND

Battery 7.4V ──→ L298N 12V Input
Battery GND ───→ L298N GND
```

### Complete ESP32 Rover Code
```cpp
#include <WiFi.h>
#include <FirebaseESP32.h>

// WiFi credentials
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"

// Firebase credentials
#define FIREBASE_HOST "ronin-80b29-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "your_firebase_secret_or_token"

// Motor pins (L298N)
#define MOTOR_LEFT_FWD 12
#define MOTOR_LEFT_BWD 13
#define MOTOR_RIGHT_FWD 14
#define MOTOR_RIGHT_BWD 15

// Battery monitoring
#define BATTERY_PIN 34  // Analog pin for voltage divider

// Firebase objects
FirebaseData firebaseData;
FirebaseData streamData;
FirebaseAuth auth;
FirebaseConfig config;

// Current state
String currentDirection = "stop";
int currentSpeed = 0;
String currentMode = "manual";
bool emergencyStop = false;

void setup() {
  Serial.begin(115200);
  
  // Initialize motor pins
  pinMode(MOTOR_LEFT_FWD, OUTPUT);
  pinMode(MOTOR_LEFT_BWD, OUTPUT);
  pinMode(MOTOR_RIGHT_FWD, OUTPUT);
  pinMode(MOTOR_RIGHT_BWD, OUTPUT);
  
  // Stop all motors initially
  stopMotors();
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected!");
  
  // Configure Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Start listening to control commands
  if (!Firebase.beginStream(streamData, "/ronin/rover/control")) {
    Serial.println("Stream begin error: " + streamData.errorReason());
  }
  
  Serial.println("Rover Ready!");
}

void loop() {
  // Listen for control commands
  if (Firebase.readStream(streamData)) {
    if (streamData.streamAvailable()) {
      if (streamData.dataType() == "json") {
        FirebaseJson json;
        json.setJsonData(streamData.jsonString());
        
        FirebaseJsonData result;
        
        // Get direction
        if (json.get(result, "direction")) {
          currentDirection = result.stringValue;
        }
        
        // Get speed
        if (json.get(result, "speed")) {
          currentSpeed = result.intValue;
        }
        
        // Get mode
        if (json.get(result, "mode")) {
          currentMode = result.stringValue;
        }
        
        // Get emergency
        if (json.get(result, "emergency")) {
          emergencyStop = result.boolValue;
        }
        
        Serial.printf("Command: %s at %d%% speed (Mode: %s)\n", 
                     currentDirection.c_str(), currentSpeed, currentMode.c_str());
        
        // Execute movement
        executeMovement();
      }
    }
  }
  
  // Update rover status every 2 seconds
  static unsigned long lastStatusUpdate = 0;
  if (millis() - lastStatusUpdate > 2000) {
    updateRoverStatus();
    lastStatusUpdate = millis();
  }
  
  delay(50);
}

void executeMovement() {
  if (emergencyStop) {
    stopMotors();
    Serial.println("EMERGENCY STOP!");
    return;
  }
  
  if (currentDirection == "forward") {
    moveForward(currentSpeed);
  } else if (currentDirection == "back") {
    moveBackward(currentSpeed);
  } else if (currentDirection == "left") {
    turnLeft(currentSpeed);
  } else if (currentDirection == "right") {
    turnRight(currentSpeed);
  } else {
    stopMotors();
  }
}

void moveForward(int speed) {
  int pwm = map(speed, 0, 100, 0, 255);
  analogWrite(MOTOR_LEFT_FWD, pwm);
  analogWrite(MOTOR_LEFT_BWD, 0);
  analogWrite(MOTOR_RIGHT_FWD, pwm);
  analogWrite(MOTOR_RIGHT_BWD, 0);
}

void moveBackward(int speed) {
  int pwm = map(speed, 0, 100, 0, 255);
  analogWrite(MOTOR_LEFT_FWD, 0);
  analogWrite(MOTOR_LEFT_BWD, pwm);
  analogWrite(MOTOR_RIGHT_FWD, 0);
  analogWrite(MOTOR_RIGHT_BWD, pwm);
}

void turnLeft(int speed) {
  int pwm = map(speed, 0, 100, 0, 255);
  analogWrite(MOTOR_LEFT_FWD, 0);
  analogWrite(MOTOR_LEFT_BWD, pwm);
  analogWrite(MOTOR_RIGHT_FWD, pwm);
  analogWrite(MOTOR_RIGHT_BWD, 0);
}

void turnRight(int speed) {
  int pwm = map(speed, 0, 100, 0, 255);
  analogWrite(MOTOR_LEFT_FWD, pwm);
  analogWrite(MOTOR_LEFT_BWD, 0);
  analogWrite(MOTOR_RIGHT_FWD, 0);
  analogWrite(MOTOR_RIGHT_BWD, pwm);
}

void stopMotors() {
  digitalWrite(MOTOR_LEFT_FWD, LOW);
  digitalWrite(MOTOR_LEFT_BWD, LOW);
  digitalWrite(MOTOR_RIGHT_FWD, LOW);
  digitalWrite(MOTOR_RIGHT_BWD, LOW);
}

void updateRoverStatus() {
  // Read battery level (voltage divider: 7.4V → 3.3V max)
  int batteryRaw = analogRead(BATTERY_PIN);
  int batteryPercent = map(batteryRaw, 0, 4095, 0, 100);
  batteryPercent = constrain(batteryPercent, 0, 100);
  
  // Update Firebase
  Firebase.setInt(firebaseData, "/ronin/rover/status/battery", batteryPercent);
  Firebase.setString(firebaseData, "/ronin/rover/status/location", "Zone A");
  Firebase.setBool(firebaseData, "/ronin/rover/status/online", true);
  
  Serial.printf("Status Update - Battery: %d%%\n", batteryPercent);
}
```

### Testing the Rover
1. Upload code to ESP32
2. Open Serial Monitor
3. Watch for "Rover Ready!"
4. Open web app → Rover Console
5. Click movement buttons - rover should respond!
6. Try keyboard controls (WASD)

---

## 🎥 ESP32-CAM Setup (Optional)

### Separate ESP32-CAM Code
```cpp
#include <WiFi.h>
#include "esp_camera.h"
#include "esp_http_server.h"

#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"

// Camera pins for AI-Thinker model
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

void setup() {
  Serial.begin(115200);
  
  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("Camera Stream: http://");
  Serial.print(WiFi.localIP());
  Serial.println(":81/stream");
  
  // Configure camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;
  
  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x", err);
    return;
  }
  
  // Start streaming server
  startCameraServer();
}

void loop() {
  delay(1000);
}
```

Update web app with camera IP:
```typescript
// In RoverConsole.tsx
const url = "http://YOUR_ESP32_CAM_IP:81/stream";
```

---

## 🔥 Firebase Cloud Functions (Auto-Alerts)

### Setup
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### functions/index.js
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Monitor for hazards and create alerts
exports.monitorHazards = functions.database
  .ref('/ronin/iot')
  .onUpdate(async (change, context) => {
    const data = change.after.val();
    
    // Fire detection
    if (data.flame) {
      await createAlert({
        type: 'Fire Detected',
        severity: 'critical',
        summary: '🔥 Flame sensor triggered - immediate evacuation required!'
      });
    }
    
    // High gas levels
    if (data.mq2 > 700) {
      await createAlert({
        type: 'Gas Leak',
        severity: 'high',
        summary: `⚠️ Dangerous gas levels detected (MQ-2: ${data.mq2})`
      });
    }
    
    // High hazard score
    if (data.hazardScore > 60) {
      await createAlert({
        type: 'High Hazard Level',
        severity: 'high',
        summary: `Hazard score critical: ${data.hazardScore.toFixed(1)}/100`
      });
      
      // Auto-dispatch rover if enabled
      const settings = await admin.database()
        .ref('/ronin/settings/roverBehavior').once('value');
      
      if (settings.val().autoDispatchEnabled) {
        await admin.database().ref('/ronin/rover/control').update({
          mode: 'auto',
          direction: 'forward',
          speed: 50
        });
      }
    }
  });

async function createAlert(alert) {
  await admin.database().ref('/ronin/alerts').push({
    ...alert,
    timestamp: Date.now(),
    resolved: false
  });
}

// Log history every 5 minutes
exports.logHistory = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const iotData = await admin.database()
      .ref('/ronin/iot').once('value');
    
    const data = iotData.val();
    if (!data) return;
    
    await admin.database().ref('/ronin/history').push({
      timestamp: Date.now(),
      mq2: data.mq2,
      mq135: data.mq135,
      temperature: data.temperature,
      flame: data.flame,
      motion: data.motion,
      hazardScore: data.hazardScore,
      riskLevel: data.hazardScore < 30 ? 'SAFE' : 
                 data.hazardScore < 60 ? 'WARNING' : 'DANGER'
    });
  });
```

### Deploy
```bash
firebase deploy --only functions
```

---

## ✅ TESTING CHECKLIST

### IoT Station
- [ ] WiFi connects successfully
- [ ] Firebase connection established
- [ ] All sensors reading values
- [ ] Data appears in Firebase Console
- [ ] Web app Dashboard shows live data
- [ ] Hazard score calculates correctly

### Rover
- [ ] WiFi connects successfully
- [ ] Firebase stream listening works
- [ ] Motors respond to commands
- [ ] Battery level reports correctly
- [ ] Web app controls work
- [ ] Emergency stop functions

### Integration
- [ ] Real-time data updates in web app
- [ ] Alerts generate automatically
- [ ] History logs every 5 minutes
- [ ] Auto-dispatch triggers on high hazard
- [ ] Camera stream displays in web app

---

## 🆘 TROUBLESHOOTING

### "Firebase not ready"
- Check WiFi connection
- Verify Firebase credentials
- Check Firebase database rules

### "Sensors reading 0"
- Check wiring connections
- Verify sensor power (3.3V or 5V)
- Test sensors individually

### "Rover not responding"
- Check Firebase stream connection
- Verify motor driver wiring
- Test motors with direct power
- Check battery voltage

### "Camera not streaming"
- Verify ESP32-CAM power (5V, 500mA+)
- Check camera module connection
- Test stream URL in browser
- Update web app with correct IP

---

## 📚 RESOURCES

- [Firebase ESP32 Library](https://github.com/mobizt/Firebase-ESP32)
- [ESP32-CAM Guide](https://randomnerdtutorials.com/esp32-cam-video-streaming-face-recognition-arduino-ide/)
- [L298N Motor Driver Tutorial](https://lastminuteengineers.com/l298n-dc-stepper-driver-arduino-tutorial/)
- [MQ Sensor Calibration](https://www.instructables.com/How-to-Calibrate-MQ-Sensors/)

---

**Ready to build? Start with the IoT station - it's simpler and will immediately populate your web app with real data!**
