# System Architecture

## High Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AROHAN System Architecture                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌─────────────────┐
│  ESP32-CAM   │────────▶│  CV Backend  │────────▶│ React Frontend  │
│  (Camera)    │  MJPEG  │  (Flask)     │  REST   │  (Dashboard)    │
│  Port: 81    │  Stream │  Port: 5000  │   API   │  Port: 5173     │
└──────────────┘         └──────────────┘         └─────────────────┘
       │                        │                          │
       │                        │                          │
       │                        ▼                          ▼
       │                 ┌──────────────┐         ┌─────────────────┐
       │                 │   Firebase   │◀────────│   Groq AI API   │
       │                 │  (Database)  │         │   (LLaMA3-8B)   │
       │                 │   Storage    │         │   Hazard AI     │
       │                 └──────────────┘         └─────────────────┘
       │                        ▲
       │                        │
       ▼                        │
┌──────────────┐                │
│  IoT Nodes   │────────────────┘
│  (Sensors)   │  Firebase SDK
│  MQ2, MQ135  │
│  DHT, Flame  │
│  Motion, etc │
└──────────────┘
```

## Component Responsibilities

### 1. ESP32-CAM Module
**Purpose**: Video capture and streaming

**Responsibilities**:
- Captures video frames at 8-10 FPS (VGA 640x480 resolution)
- Serves MJPEG multipart stream on port 81 (`/stream` endpoint)
- Provides single frame capture via `/capture` endpoint
- WiFi connectivity for remote access
- Low-latency streaming for real-time monitoring

**Technology**:
- ESP32 microcontroller with OV2640 camera
- Arduino framework
- WiFi 802.11 b/g/n

**Endpoints**:
- `http://{ESP32_IP}:81/stream` - MJPEG continuous stream
- `http://{ESP32_IP}:81/capture` - Single JPEG frame

### 2. CV Backend (Flask/Python)
**Purpose**: Computer vision processing and face recognition

**Responsibilities**:
- **Face Detection**: DNN-based (res10 SSD 300x300) with Haar cascade fallback
- **Face Recognition**: FaceNet 128-dimensional encodings with L2 distance matching
- **Face Tracking**: IoU-based tracking with 5-frame majority voting
- **Quality Filtering**: Blur detection, size validation, aspect ratio checks
- **Image Enhancement**: CLAHE + gamma correction for low-light conditions
- **Alert Generation**: Creates alerts for known/unknown faces and accidents
- **Snapshot Management**: Saves annotated frames to disk and Firebase Storage
- **Training Pipeline**: Loads images from `known_faces/` and generates encodings
- **Stream Proxy**: Serves annotated and raw streams to frontend
- **Firebase Integration**: Syncs alerts and snapshots to cloud

**Technology**:
- Flask 3.0.0 web framework
- OpenCV 4.x for computer vision
- face_recognition library (dlib/FaceNet)
- NumPy for vectorized operations
- Threading for concurrent ESP32 reading and recognition
- Firebase Admin SDK for cloud sync

**Key Classes**:
- `ESP32Reader`: Background thread for MJPEG stream reading
- `RecogWorker`: Throttled recognition worker (max 20 FPS)
- `FaceTracker`: IoU-based face tracking across frames
- `EncodeCache`: LRU cache for face encodings (128 entries)
- `CVBackend`: Main application class with Flask routes

**Port**: 5000

### 3. React Frontend (Dashboard)
**Purpose**: User interface and real-time data visualization

**Responsibilities**:
- **Dashboard**: Live sensor data, hazard score, system status
- **Rover Console**: Manual control, live stream, mission tracking
- **Face Recognition**: Annotated stream display, CV backend status
- **Solution Page**: Groq AI hazard analysis with recommendations
- **Alerts Page**: Alert history with filtering and search
- **History Page**: Historical sensor data with trend charts
- **Settings Page**: System configuration and preferences
- **Authentication**: Firebase Auth (Email/Password)
- **Real-time Sync**: Firebase onValue listeners for live updates
- **State Management**: React hooks and Firebase contexts

**Technology**:
- React 18.3.1 with TypeScript
- Vite 5.4.19 for build and dev server
- Tailwind CSS + Shadcn/ui components
- Firebase SDK for Realtime Database
- Recharts for data visualization
- React Router v6 for navigation

**Port**: 5173 (dev), 8080 (production)

### 4. Firebase Cloud Services
**Purpose**: Real-time data synchronization and storage

**Responsibilities**:
- **Realtime Database**: NoSQL database for sensor data, alerts, rover status
- **Storage**: Snapshot image hosting with public URLs
- **Authentication**: User login and session management
- **Real-time Sync**: WebSocket-based data push to all connected clients
- **Security Rules**: Database access control

**Database Paths**:
- `ronin/iot_nodes/iotA` - Live sensor readings
- `ronin/alerts` - Alert history
- `ronin/history` - Historical sensor data
- `ronin/rover/mission` - Rover mission status
- `ronin/rover/control` - Rover movement commands
- `ronin/rover/status` - Rover online/offline status

**Technology**:
- Firebase Realtime Database (NoSQL)
- Firebase Storage (Cloud Storage)
- Firebase Authentication
- Firebase Hosting (optional)

### 5. IoT Sensor Nodes
**Purpose**: Environmental monitoring and data collection

**Responsibilities**:
- **Gas Detection**: MQ-2 (combustible gases), MQ-135 (air quality)
- **Environmental**: DHT (temperature/humidity)
- **Safety**: Flame sensor (fire detection), PIR (motion detection)
- **Distance**: Ultrasonic sensor for obstacle detection
- **Data Upload**: Writes sensor readings to Firebase every 1-5 seconds
- **Heartbeat**: Updates timestamp for online/offline detection

**Technology**:
- ESP32 or Arduino microcontroller
- Analog/digital sensors
- Firebase ESP32/Arduino SDK
- WiFi connectivity

**Data Format**:
```json
{
  "mq2": 450,
  "mq135": 0,
  "mq135_digital": 0,
  "temperature": 28.5,
  "humidity": 65.2,
  "flame": false,
  "motion": true,
  "hazardScore": 35.8,
  "riskLevel": "WARNING",
  "status": {
    "online": true,
    "lastHeartbeat": 1710691200000
  }
}
```

### 6. Groq AI API
**Purpose**: Natural language hazard analysis

**Responsibilities**:
- Analyzes sensor data and provides safety recommendations
- Identifies chemical hazards based on gas sensor readings
- Recommends PPE (Personal Protective Equipment)
- Provides mitigation steps and emergency procedures
- Generates do-not lists (actions to avoid)
- Returns structured JSON responses

**Technology**:
- Groq Cloud API
- LLaMA3-8B-8192 model
- REST API (OpenAI-compatible)

**Model**: `llama3-8b-8192`  
**Endpoint**: `https://api.groq.com/openai/v1/chat/completions`

## Data Flow Summary

### Live Video Stream Flow
1. ESP32-CAM captures frame → MJPEG stream on port 81
2. CV Backend ESP32Reader thread reads stream continuously
3. RecogWorker picks up latest frame (throttled to 20 FPS max)
4. Face detection (DNN or Haar) → Face recognition (FaceNet or LBP)
5. FaceTracker applies 5-frame majority voting
6. Annotated frame served to frontend via `/stream-annotated`
7. Frontend displays stream in `<img>` tag

### Sensor Data Flow
1. IoT node reads sensors (MQ-2, MQ-135, DHT, etc.)
2. Calculates hazard score based on sensor values
3. Writes to Firebase: `ronin/iot_nodes/iotA`
4. Frontend `useIoTReadings` hook receives update via `onValue()`
5. Dashboard updates in real-time (< 100ms latency)

### Alert Generation Flow
1. CV Backend detects face or accident
2. Creates `RoverAlert` object with snapshot
3. Saves annotated frame to `static/snapshots/`
4. Uploads snapshot to Firebase Storage
5. Pushes alert to Firebase: `ronin/alerts/{id}`
6. Frontend `useRoverAlerts` hook receives alert
7. Alert displayed in Recent Alerts panel + Alerts page

### Rover Control Flow
1. User clicks movement button (Forward/Back/Left/Right/Stop)
2. Frontend writes to Firebase: `ronin/rover/control`
3. Rover ESP32 reads command via Firebase listener
4. Motor driver executes movement
5. Rover status heartbeat written to `ronin/rover/status`
6. Frontend displays online/offline status

### AI Hazard Analysis Flow
1. User opens Solution page
2. Live sensor data auto-loaded from Firebase
3. User clicks "Analyze Hazard Conditions"
4. Frontend calls Groq API with sensor data + prompt
5. LLaMA3 model analyzes data and returns JSON
6. Frontend parses response and displays:
   - Hazard level (SAFE/WARNING/DANGER/CRITICAL)
   - Chemical identification
   - Mitigation steps
   - PPE requirements
   - Do-not list
   - Emergency contacts

## Port Mapping

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend (dev) | 5173 | HTTP | Vite dev server |
| Frontend (prod) | 8080 | HTTP | Production build |
| CV Backend | 5000 | HTTP | Flask REST API |
| ESP32-CAM | 81 | HTTP | MJPEG stream + capture |
| Firebase | 443 | HTTPS | Realtime Database + Storage |
| Groq API | 443 | HTTPS | AI inference |

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Local Network (WiFi)                    │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  ESP32-CAM   │    │  IoT Nodes   │    │  Developer   │ │
│  │  192.168.x.x │    │  192.168.x.x │    │  Machine     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
└─────────┼────────────────────┼────────────────────┼─────────┘
          │                    │                    │
          │                    │                    │
          └────────────────────┴────────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Internet   │
                        └──────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
         ┌──────────────┐            ┌──────────────┐
         │   Firebase   │            │   Groq API   │
         │    Cloud     │            │    Cloud     │
         └──────────────┘            └──────────────┘
```

## Security Considerations

### Authentication
- Firebase Authentication (Email/Password)
- Protected routes in frontend (ProtectedRoute component)
- Session management via Firebase Auth tokens

### Database Security
- Firebase Security Rules for read/write access control
- User-based permissions (authenticated users only)
- No public write access

### API Security
- CORS enabled on CV Backend (Flask-CORS)
- API keys stored in environment variables
- No hardcoded credentials in code

### Network Security
- HTTPS for Firebase and Groq API
- Local network for ESP32-CAM (not exposed to internet)
- Optional: VPN for remote access to local network

## Scalability

### Current Limitations
- Single ESP32-CAM stream (one camera)
- Single IoT node (iotA)
- CV Backend runs on single machine
- Firebase free tier limits (10GB storage, 1GB/day download)

### Scaling Options
- **Multiple Cameras**: Add more ESP32-CAM modules with unique IDs
- **Multiple IoT Nodes**: Add iotB, iotC, etc. to Firebase
- **Load Balancing**: Deploy multiple CV Backend instances behind nginx
- **Cloud Deployment**: Host CV Backend on AWS/GCP/Azure
- **Firebase Upgrade**: Blaze plan for higher limits
- **Edge Computing**: Run CV Backend on edge devices (Jetson Nano, Raspberry Pi 4)

## Performance Metrics

### CV Backend
- **Face Detection**: 10-15 FPS (DNN), 20-30 FPS (Haar)
- **Face Recognition**: 8-20 FPS (throttled to prevent CPU saturation)
- **Stream Latency**: 100-300ms (local network)
- **Memory Usage**: 200-500 MB (depends on number of known faces)

### Frontend
- **Initial Load**: 1-2 seconds
- **Firebase Sync Latency**: 50-100ms
- **Chart Rendering**: 60 FPS (Recharts)
- **Bundle Size**: ~2 MB (gzipped)

### IoT Nodes
- **Sensor Read Frequency**: 1-5 seconds
- **Firebase Write Frequency**: 1-5 seconds
- **Power Consumption**: 100-200 mA (ESP32)

---

**Next**: [Frontend Documentation](./FRONTEND.md)
