# System Architecture Overview

Complete architectural overview of the AROHAN system.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AROHAN System                             │
│                  Autonomous Safety Monitoring                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │   Frontend   │ │  Firebase  │ │  Backend   │
        │  React App   │ │   Cloud    │ │  Flask CV  │
        └──────────────┘ └────────────┘ └────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                        ┌───────▼────────┐
                        │   ESP32-CAM    │
                        │  + IoT Sensors │
                        └────────────────┘
```

---

## System Components

### 1. Frontend Application
**Technology**: React 18 + TypeScript + Vite

**Responsibilities**:
- User interface and visualization
- Real-time data display
- User authentication
- Rover control interface
- Alert management
- Historical data analysis

**Key Features**:
- Responsive design (mobile + desktop)
- Real-time charts (Recharts)
- Live camera streaming
- Dark/Light theme support
- Protected routes with authentication

**Port**: 8080

---

### 2. Firebase Cloud Services

**Services Used**:
- **Realtime Database**: Live IoT data sync
- **Authentication**: Email/password auth
- **Storage**: Snapshot images
- **Hosting**: Production deployment
- **Analytics**: Usage tracking

**Database Structure**:
```
ronin/
├── iot/              # IoT sensor readings
├── rover/            # Rover control & status
│   ├── control/      # Control commands
│   ├── status/       # Rover status
│   └── sensors/      # Rover sensor data
├── alerts/           # Alert history
├── history/          # Historical logs
├── settings/         # System configuration
└── validation/       # Validation events
```

**Security**:
- Authentication required for all operations
- Row-level security rules
- Token-based access control

---

### 3. Computer Vision Backend
**Technology**: Python 3.13 + Flask 3.0

**Responsibilities**:
- Face detection and recognition
- Accident detection
- Snapshot capture and processing
- Image storage (local + Firebase)
- Alert generation

**Key Features**:
- OpenCV face detection
- Optional face_recognition library
- Firebase Admin SDK integration
- RESTful API endpoints
- CORS enabled for frontend

**Port**: 5000

**Endpoints**:
- `GET /health` - Health check
- `POST /analyze-frame` - Analyze camera frame
- `GET /alerts` - Get all alerts
- `GET /snapshots/<filename>` - Get snapshot image

---

### 4. IoT Hardware Layer

**ESP32-CAM**:
- Live MJPEG streaming
- Snapshot capture
- WiFi connectivity
- IP: 192.168.1.18:81

**Sensors**:
- **MQ2**: Gas/Smoke detection (analog)
- **MQ135**: Air quality (digital threshold)
- **DHT11/22**: Temperature & humidity
- **Flame Sensor**: Fire detection (digital)
- **PIR**: Motion detection (digital)

**Communication**:
- WiFi → Firebase Realtime Database
- HTTP endpoints for camera control
- Real-time data push every 1-5 seconds

---

## Data Flow

### 1. Sensor Data Flow
```
IoT Sensors → ESP32 → Firebase Realtime DB → Frontend
                                           ↓
                                      Backend (Analysis)
```

**Process**:
1. Sensors read environmental data
2. ESP32 processes and sends to Firebase
3. Frontend subscribes to Firebase updates
4. Backend analyzes data for anomalies
5. Alerts generated if thresholds exceeded

---

### 2. Camera Stream Flow
```
ESP32-CAM → MJPEG Stream → Frontend Display
          ↓
          Backend (Face Recognition)
          ↓
          Firebase Storage (Snapshots)
```

**Process**:
1. ESP32-CAM captures video
2. Streams MJPEG to frontend
3. Backend requests frames for analysis
4. Face detection/recognition performed
5. Snapshots saved locally and to Firebase

---

### 3. Authentication Flow
```
User → Frontend → Firebase Auth → Token
                                    ↓
                            Realtime Database
                            (Token Validation)
```

**Process**:
1. User enters credentials
2. Firebase Auth validates
3. Token stored in IndexedDB
4. Token attached to all database requests
5. Database rules verify token
6. Auto-refresh on expiry

---

### 4. Alert Flow
```
Sensor Data → Hazard Calculation → Threshold Check
                                          ↓
                                    Alert Generated
                                          ↓
                                    Firebase Database
                                          ↓
                                    Frontend Notification
```

**Process**:
1. Sensor readings analyzed
2. Hazard score calculated
3. Compared against thresholds
4. Alert created if exceeded
5. Stored in Firebase
6. Frontend displays notification
7. User can acknowledge/resolve

---

## Technology Stack

### Frontend Stack
```
React 18.3.1
├── TypeScript 5.8.3
├── Vite 5.4.19 (Build Tool)
├── React Router 6.30.1 (Routing)
├── TanStack Query 5.83.0 (Data Fetching)
├── Shadcn/ui (UI Components)
│   └── Radix UI (Primitives)
├── Tailwind CSS 3.4.17 (Styling)
├── Recharts 2.15.4 (Charts)
├── Lucide React (Icons)
├── React Hook Form 7.61.1 (Forms)
├── Zod 3.25.76 (Validation)
└── Firebase SDK 12.6.0
```

### Backend Stack
```
Python 3.13.1
├── Flask 3.0.0 (Web Framework)
├── Flask-CORS 4.0.0 (CORS Support)
├── OpenCV 4.12.0.88 (Computer Vision)
├── NumPy 2.2.1 (Numerical Computing)
├── Requests (HTTP Client)
├── Firebase Admin SDK (Cloud Integration)
└── face_recognition (Optional - Advanced Recognition)
```

### Database & Cloud
```
Firebase
├── Realtime Database (NoSQL)
├── Authentication (Email/Password)
├── Storage (File Storage)
├── Hosting (Static Hosting)
└── Analytics (Usage Tracking)
```

---

## Security Architecture

### Authentication
- Email/password authentication
- Token-based access control
- Session persistence in IndexedDB
- Auto-refresh on token expiry
- Email verification support

### Authorization
- Database rules enforce authentication
- Row-level security
- Read/write permissions per path
- No public access

### Data Protection
- HTTPS only in production
- CORS configured for frontend
- Environment variables for secrets
- No credentials in code

---

## Scalability Considerations

### Current Capacity
- Single ESP32-CAM device
- Single backend instance
- Firebase free tier limits
- Suitable for small-scale deployment

### Scaling Options
1. **Multiple Cameras**: Add more ESP32-CAM devices
2. **Load Balancing**: Multiple backend instances
3. **Firebase Upgrade**: Paid tier for higher limits
4. **CDN**: Firebase Hosting includes CDN
5. **Database Sharding**: Partition data by zone/location

---

## Performance Metrics

### Frontend
- Initial load: ~1-2 seconds
- Hot reload: Instant
- Bundle size: ~500KB (gzipped)
- Lighthouse score: 90+

### Backend
- Health check: <50ms
- Frame analysis: 200-500ms
- Face detection: 100-300ms
- API response: <100ms

### Database
- Read latency: <100ms
- Write latency: <50ms
- Real-time sync: <200ms
- Concurrent connections: 100+

---

## Deployment Architecture

### Development
```
Local Machine
├── Frontend (localhost:8080)
├── Backend (localhost:5000)
└── Firebase (Cloud)
```

### Production
```
Firebase Hosting
├── Frontend (Static Files)
└── CDN Distribution

Backend
├── Cloud Server / VPS
└── Reverse Proxy (Nginx)

Firebase Cloud
├── Realtime Database
├── Authentication
└── Storage
```

---

## Monitoring & Logging

### Frontend Monitoring
- Browser console logs
- Network request tracking
- Error boundary for crashes
- Firebase Analytics

### Backend Monitoring
- Flask debug logs
- OpenCV operation logs
- Firebase Admin SDK logs
- Health check endpoint

### Database Monitoring
- Firebase Console
- Real-time connection status
- Read/write metrics
- Security rule violations

---

## Disaster Recovery

### Backup Strategy
- Firebase automatic backups
- Export database regularly
- Version control for code
- Snapshot storage redundancy

### Recovery Procedures
1. Database restore from backup
2. Redeploy from Git repository
3. Reconfigure environment variables
4. Verify all services operational

---

## Future Enhancements

### Planned Features
1. Multi-camera support
2. Mobile app (React Native)
3. Advanced AI models (TensorFlow)
4. Predictive analytics
5. Cloud Functions for automation
6. WebSocket for lower latency
7. Offline mode support
8. Data export functionality

### Infrastructure Improvements
1. Kubernetes deployment
2. Microservices architecture
3. Message queue (RabbitMQ)
4. Time-series database (InfluxDB)
5. Grafana dashboards
6. Automated testing pipeline

---

## Related Documentation

- [Technology Stack Details](TECH_STACK.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Authentication Flow](AUTHENTICATION.md)
- [API Documentation](../api/FRONTEND_API.md)

---

**Last Updated**: February 28, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
