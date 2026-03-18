# System Flow

## Flow 1: Live Video Stream

```
┌──────────────┐
│  ESP32-CAM   │ Captures frame at 8-10 FPS (VGA 640x480)
└──────┬───────┘
       │ MJPEG multipart stream on :81/stream
       ▼
┌──────────────────────────────────────────────────────────┐
│  CV Backend - ESP32Reader Thread                         │
│  - Reads MJPEG continuously                              │
│  - Applies _enhance() (CLAHE + gamma correction)         │
│  - Stores in thread-safe slot (latest only)              │
└──────┬───────────────────────────────────────────────────┘
       │ Latest frame available
       ▼
┌──────────────────────────────────────────────────────────┐
│  CV Backend - RecogWorker Thread                         │
│  - Picks latest frame every RECOG_MIN_INTERVAL (0.05s)   │
│  - Face detection (DNN or Haar)                          │
│  - Quality check (_quality_ok)                           │
│  - Face encoding (FaceNet or LBP+HOG)                    │
│  - Matching against known faces                          │
│  - FaceTracker 5-frame majority vote                     │
│  - annotate() draws boxes + names                        │
└──────┬───────────────────────────────────────────────────┘
       │ Annotated frame ready
       ▼
┌──────────────────────────────────────────────────────────┐
│  CV Backend - /stream-annotated Endpoint                 │
│  - Serves MJPEG stream to frontend                       │
│  - Adds HUD overlay (face count, names)                  │
│  - Generates alerts (5-second cooldown per person)       │
└──────┬───────────────────────────────────────────────────┘
       │ MJPEG stream
       ▼
┌──────────────────────────────────────────────────────────┐
│  React Frontend - <img> Tag                              │
│  - Displays stream in real-time                          │
│  - No JavaScript processing needed                       │
└──────────────────────────────────────────────────────────┘
```

**Latency**: 100-300ms (local network)


## Flow 2: Face Alert Generation

```
┌──────────────────────────────────────────────────────────┐
│  CV Backend - RecogWorker                                │
│  Face detected and recognized                            │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Alert Cooldown Check                                    │
│  - 5 seconds per person                                  │
│  - Prevents alert spam                                   │
└──────┬───────────────────────────────────────────────────┘
       │ Cooldown passed
       ▼
┌──────────────────────────────────────────────────────────┐
│  Create RoverAlert Object                                │
│  {                                                        │
│    id: "a_1710691200_0",                                 │
│    type: "KNOWN_FACE" | "UNKNOWN_FACE",                  │
│    message: "Known: shadan",                             │
│    createdAt: "2026-03-17T10:30:00",                     │
│    confidence: 0.87,                                     │
│    snapshotUrl: "http://localhost:5000/...",            │
│    meta: { faces: 1, box: {...} }                       │
│  }                                                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────────────────┐
       │                                                  │
       ▼                                                  ▼
┌──────────────────┐                          ┌──────────────────┐
│  Save Snapshot   │                          │  Add to Memory   │
│  Async (ThreadPool)                         │  alerts list     │
│  - static/snapshots/                        └──────┬───────────┘
│  - snap_1234.jpg │                                 │
└──────┬───────────┘                                 │
       │                                              │
       ▼                                              │
┌──────────────────┐                                 │
│  Firebase Upload │                                 │
│  Async (ThreadPool)                                │
│  - Storage bucket│                                 │
│  - Make public   │                                 │
└──────┬───────────┘                                 │
       │                                              │
       ▼                                              │
┌──────────────────┐                                 │
│  Firebase Alert  │◀────────────────────────────────┘
│  ronin/alerts/{id}
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  React Frontend - useRoverAlerts Hook                    │
│  - Receives alert via onValue()                          │
│  - Displays in Recent Alerts panel                       │
│  - Shows in Alerts page                                  │
└──────────────────────────────────────────────────────────┘
```


## Flow 3: IoT Sensor Data

```
┌──────────────────────────────────────────────────────────┐
│  IoT Node (ESP32/Arduino)                                │
│  - Read MQ-2 (gas sensor)                                │
│  - Read MQ-135 (air quality)                             │
│  - Read DHT (temperature/humidity)                       │
│  - Read Flame sensor                                     │
│  - Read PIR (motion)                                     │
│  - Read Ultrasonic (distance)                            │
└──────┬───────────────────────────────────────────────────┘
       │ Every 1-5 seconds
       ▼
┌──────────────────────────────────────────────────────────┐
│  Calculate Hazard Score                                  │
│  - MQ-2: 30% weight                                      │
│  - MQ-135: 60% weight                                    │
│  - Temperature: 10% weight                               │
│  - Flame: +40 points                                     │
│  - Motion: +5 points                                     │
│  - Risk level: SAFE/WARNING/DANGER                      │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Firebase Write                                          │
│  ronin/iot_nodes/iotA                                    │
│  {                                                        │
│    mq2: 450,                                             │
│    mq135: 0,                                             │
│    temperature: 28.5,                                    │
│    humidity: 65.2,                                       │
│    flame: false,                                         │
│    motion: true,                                         │
│    hazardScore: 35.8,                                    │
│    riskLevel: "WARNING",                                 │
│    status: {                                             │
│      online: true,                                       │
│      lastHeartbeat: 1710691200000                        │
│    }                                                      │
│  }                                                        │
└──────┬───────────────────────────────────────────────────┘
       │ Real-time sync (< 100ms)
       ▼
┌──────────────────────────────────────────────────────────┐
│  React Frontend - useIoTReadings Hook                    │
│  - onValue() listener                                    │
│  - Data normalization                                    │
│  - Online/offline detection (30-second heartbeat)        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Dashboard Display                                       │
│  - Live sensor cards                                     │
│  - Hazard score gauge                                    │
│  - Real-time charts                                      │
│  - Status indicators                                     │
└──────────────────────────────────────────────────────────┘
```

**Update Frequency**: 1-5 seconds  
**Latency**: 50-100ms (Firebase sync)


## Flow 4: Groq AI Hazard Analysis

```
┌──────────────────────────────────────────────────────────┐
│  User Opens Solution Page                                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Auto-load Live Sensor Data                              │
│  - useIoTReadings hook                                   │
│  - ronin/iot_nodes/iotA                                  │
│  - Display current readings                              │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  User Clicks "Analyze Hazard Conditions"                 │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Build Detailed Prompt                                   │
│  - Include all sensor readings                           │
│  - Add context (industrial environment)                  │
│  - Request structured JSON response                      │
│  - Specify required fields                               │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Call Groq API                                           │
│  POST https://api.groq.com/openai/v1/chat/completions   │
│  {                                                        │
│    model: "llama3-8b-8192",                              │
│    messages: [                                           │
│      {                                                    │
│        role: "system",                                   │
│        content: "You are a safety expert..."            │
│      },                                                   │
│      {                                                    │
│        role: "user",                                     │
│        content: "Analyze: MQ-2=450, MQ-135=0..."        │
│      }                                                    │
│    ],                                                     │
│    temperature: 0.3,                                     │
│    max_tokens: 2000                                      │
│  }                                                        │
└──────┬───────────────────────────────────────────────────┘
       │ API response (1-3 seconds)
       ▼
┌──────────────────────────────────────────────────────────┐
│  Parse JSON Response                                     │
│  {                                                        │
│    hazardLevel: "WARNING",                               │
│    chemical: "Combustible gases detected",              │
│    summary: "Moderate gas levels...",                   │
│    immediateActions: ["Ventilate area", ...],           │
│    mitigationSteps: ["Install gas detectors", ...],     │
│    ppeRequired: ["Gas mask", "Safety goggles"],         │
│    doNotList: ["Do not use open flames", ...],          │
│    emergencyContacts: ["Fire: 911", ...]                │
│  }                                                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Display Structured Analysis                             │
│  - Hazard banner (color-coded by severity)              │
│  - Chemical identification                               │
│  - Summary section                                       │
│  - Immediate actions (numbered list)                     │
│  - Mitigation steps (numbered list)                      │
│  - PPE requirements (with icons)                         │
│  - Do-not list (with warning icons)                      │
│  - Emergency contacts (with phone icons)                 │
└──────────────────────────────────────────────────────────┘
```

**API Latency**: 1-3 seconds  
**Model**: LLaMA3-8B-8192  
**Free Tier**: 14,400 requests/day


## Flow 5: Rover Control

```
┌──────────────────────────────────────────────────────────┐
│  User Opens Rover Console                                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Display Live Stream                                     │
│  - CV Backend /stream-raw endpoint                       │
│  - 180° rotation applied (CSS transform)                 │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  User Clicks Movement Button                             │
│  - Forward / Back / Left / Right / Stop                  │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Firebase Write                                          │
│  ronin/rover/control                                     │
│  {                                                        │
│    direction: "forward",                                 │
│    speed: 50,                                            │
│    timestamp: 1710691200000                              │
│  }                                                        │
└──────┬───────────────────────────────────────────────────┘
       │ Real-time sync
       ▼
┌──────────────────────────────────────────────────────────┐
│  Rover ESP32 - Firebase Listener                         │
│  - onValue() callback                                    │
│  - Read command                                          │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Motor Driver Execution                                  │
│  - L298N motor driver                                    │
│  - PWM speed control                                     │
│  - Direction control (IN1-IN4 pins)                      │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Rover Status Heartbeat                                  │
│  ronin/rover/status                                      │
│  {                                                        │
│    online: true,                                         │
│    timestamp: 1710691200000,                             │
│    battery: 85                                           │
│  }                                                        │
└──────┬───────────────────────────────────────────────────┘
       │ Every 5 seconds
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend Status Display                                 │
│  - Online if timestamp < 30 seconds ago                  │
│  - Offline otherwise                                     │
│  - Battery level indicator                               │
└──────────────────────────────────────────────────────────┘
```

**Command Latency**: 50-100ms (Firebase sync)  
**Heartbeat Interval**: 5 seconds  
**Offline Threshold**: 30 seconds


## Flow 6: Face Training

```
┌──────────────────────────────────────────────────────────┐
│  Add Images to known_faces/                              │
│  known_faces/person_name/*.jpg                           │
│  OR                                                       │
│  POST /add-face with base64 image                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  _train() Method                                         │
│  - Load all images from known_faces/                     │
│  - For each image:                                       │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Image Enhancement                                       │
│  - _enhance() ONCE per image                             │
│  - CLAHE + gamma correction                              │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Face Detection                                          │
│  - detect_faces()                                        │
│  - Find largest face in image                            │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Augmentation (5 variants)                               │
│  1. Original                                             │
│  2. Horizontal flip                                      │
│  3. Darker (-35 brightness)                              │
│  4. Brighter (+35 brightness)                            │
│  5. Slight blur (Gaussian 3x3)                           │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Encoding (NO quality gate)                              │
│  - _encode_for_training()                                │
│  - FaceNet 128-dim OR LBP+HOG+HSV                        │
│  - All 5 variants encoded                                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Storage                                                 │
│  - names list: ['shadan', 'shadan', 'shadan', ...]      │
│  - encodings list: [enc1, enc2, enc3, ...]              │
│  - pickle.dump() to encodings.pkl                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Matrix Building                                         │
│  - enc_matrix = np.stack(encodings)                      │
│  - For vectorized matching                               │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  RecogWorker Immediately Uses New Model                  │
│  - No restart required                                   │
│  - Cache cleared                                         │
│  - Tracker reset                                         │
└──────────────────────────────────────────────────────────┘
```

**Training Time**: 1-5 seconds per person (depends on image count)  
**Encodings Per Person**: 5 × number of images  
**Example**: 3 images → 15 encodings (3 × 5 variants)

---

**Next**: [Database Schema](./DATABASE.md)
