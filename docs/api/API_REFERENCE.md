# API Reference

Complete API documentation for AROHAN system.

---

## Frontend API

### React Hooks

#### useIoTReadings
Subscribe to live IoT sensor readings.

```typescript
import { useIoTReadings } from '@/hooks/useIoTReadings';

const { data, loading, error } = useIoTReadings('/ronin/iot');

// Returns:
interface IoTReadings {
  mq2: number;
  mq135: number;
  mq135_digital: 0 | 1;
  temperature: number;
  humidity: number;
  flame: boolean;
  motion: boolean;
  hazardScore: number;
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER';
  status: {
    online: boolean;
    lastHeartbeat: number;
  };
}
```

#### useHazardScore
Get current hazard score and risk level.

```typescript
import { useHazardScore } from '@/hooks/useHazardScore';

const { hazardScore, riskLevel, loading, error } = useHazardScore();
```

#### useRover
Control and monitor rover.

```typescript
import { useRover } from '@/hooks/useRover';

const {
  control,
  status,
  loading,
  setDirection,
  setMode,
  emergencyStop
} = useRover();

// Control rover
await setDirection('forward', 50);
await setMode('auto');
await emergencyStop();
```

#### useAlerts
Manage alerts.

```typescript
import { useAlerts } from '@/hooks/useAlerts';

const {
  alerts,
  unresolvedAlerts,
  loading,
  addAlert,
  resolveAlert
} = useAlerts();

// Add alert
await addAlert({
  type: 'gas_leak',
  severity: 'high',
  summary: 'High gas levels detected'
});

// Resolve alert
await resolveAlert(alertId);
```

---

## Backend API

### Base URL
```
http://localhost:5000
```

### Endpoints

#### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "opencv_ready": true,
  "known_faces": 2,
  "alerts_count": 5,
  "esp32_url": "http://192.168.1.18:81"
}
```

**Status Codes**:
- `200 OK`: Backend is healthy
- `500 Internal Server Error`: Backend error

---

#### POST /analyze-frame
Analyze camera frame for faces and accidents.

**Request**:
```json
{
  "source": "esp32"
}
```

**Response**:
```json
{
  "success": true,
  "faces_detected": 2,
  "faces_recognized": ["John_Doe", "Jane_Smith"],
  "accident_detected": false,
  "snapshot_url": "/snapshots/snapshot_1234567890.jpg",
  "timestamp": 1234567890
}
```

**Status Codes**:
- `200 OK`: Analysis successful
- `400 Bad Request`: Invalid request
- `500 Internal Server Error`: Analysis failed

---

#### GET /alerts
Get all alerts from backend.

**Response**:
```json
{
  "alerts": [
    {
      "id": "alert_1",
      "type": "face_detected",
      "severity": "medium",
      "summary": "Unknown face detected",
      "timestamp": 1234567890,
      "resolved": false
    }
  ],
  "count": 1
}
```

**Status Codes**:
- `200 OK`: Alerts retrieved
- `500 Internal Server Error`: Failed to retrieve

---

#### GET /snapshots/<filename>
Get snapshot image.

**Parameters**:
- `filename`: Snapshot filename (e.g., `snapshot_1234567890.jpg`)

**Response**:
- Image file (JPEG)

**Status Codes**:
- `200 OK`: Image found
- `404 Not Found`: Image not found

---

## Firebase API

### Database Structure

```
ronin/
├── iot/
│   ├── mq2: number
│   ├── mq135: number
│   ├── mq135_digital: 0 | 1
│   ├── temperature: number
│   ├── humidity: number
│   ├── flame: boolean
│   ├── motion: boolean
│   ├── hazardScore: number
│   ├── riskLevel: string
│   └── status/
│       ├── online: boolean
│       └── lastHeartbeat: number
├── rover/
│   ├── control/
│   │   ├── direction: string
│   │   ├── speed: number
│   │   ├── mode: string
│   │   └── emergency: boolean
│   ├── status/
│   │   ├── battery: number
│   │   ├── location: string
│   │   └── online: boolean
│   └── sensors/
│       ├── mq2: number
│       ├── mq135: number
│       ├── temperature: number
│       └── humidity: number
├── alerts/
│   └── <alertId>/
│       ├── timestamp: number
│       ├── type: string
│       ├── severity: string
│       ├── summary: string
│       └── resolved: boolean
├── history/
│   └── <logId>/
│       ├── timestamp: number
│       ├── mq2: number
│       ├── temperature: number
│       ├── hazardScore: number
│       └── riskLevel: string
└── settings/
    ├── thresholds/
    │   ├── mq2/
    │   ├── temperature/
    │   └── hazardScore/
    └── roverBehavior/
        ├── autoDispatch: boolean
        └── returnToBase: boolean
```

### Firebase Operations

#### Read Data
```typescript
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

const iotRef = ref(database, 'ronin/iot');
onValue(iotRef, (snapshot) => {
  const data = snapshot.val();
  console.log(data);
});
```

#### Write Data
```typescript
import { ref, set } from 'firebase/database';
import { database } from '@/lib/firebase';

const iotRef = ref(database, 'ronin/iot');
await set(iotRef, {
  mq2: 150,
  temperature: 25,
  hazardScore: 15
});
```

#### Update Data
```typescript
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';

const roverRef = ref(database, 'ronin/rover/control');
await update(roverRef, {
  direction: 'forward',
  speed: 50
});
```

---

## Authentication API

### Firebase Auth

#### Sign Up
```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const userCredential = await createUserWithEmailAndPassword(
  auth,
  email,
  password
);
```

#### Login
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const userCredential = await signInWithEmailAndPassword(
  auth,
  email,
  password
);
```

#### Logout
```typescript
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

await signOut(auth);
```

#### Get Current User
```typescript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
```

---

## WebSocket API (ESP32-CAM)

### Camera Stream
```
ws://192.168.1.18:81/stream
```

### Control Commands
```typescript
// Forward
POST http://192.168.1.18:81/control
Body: { "direction": "forward", "speed": 50 }

// Stop
POST http://192.168.1.18:81/control
Body: { "direction": "stop", "speed": 0 }
```

---

## Error Handling

### Frontend Errors
```typescript
try {
  const { data } = useIoTReadings();
} catch (error) {
  console.error('Failed to fetch IoT data:', error);
  // Handle error
}
```

### Backend Errors
```python
@app.errorhandler(Exception)
def handle_error(error):
    return jsonify({
        'success': False,
        'error': str(error)
    }), 500
```

### Firebase Errors
```typescript
import { ref, onValue } from 'firebase/database';

onValue(iotRef, 
  (snapshot) => {
    // Success
  },
  (error) => {
    console.error('Firebase error:', error);
    // Handle error
  }
);
```

---

## Rate Limits

### Firebase
- **Reads**: 100,000/day (free tier)
- **Writes**: 20,000/day (free tier)
- **Concurrent connections**: 100 (free tier)

### Backend
- No rate limits (local deployment)
- Configure rate limiting for production

---

## API Examples

### Complete IoT Data Fetch
```typescript
import { useIoTReadings } from '@/hooks/useIoTReadings';
import { useEffect } from 'react';

function Dashboard() {
  const { data, loading, error } = useIoTReadings();

  useEffect(() => {
    if (data) {
      console.log('MQ2:', data.mq2);
      console.log('Temperature:', data.temperature);
      console.log('Hazard Score:', data.hazardScore);
    }
  }, [data]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Hazard Score: {data.hazardScore}</h1>
      <p>Risk Level: {data.riskLevel}</p>
    </div>
  );
}
```

### Rover Control
```typescript
import { useRover } from '@/hooks/useRover';

function RoverControl() {
  const { setDirection, setMode, emergencyStop } = useRover();

  const handleForward = async () => {
    await setDirection('forward', 50);
  };

  const handleStop = async () => {
    await emergencyStop();
  };

  return (
    <div>
      <button onClick={handleForward}>Forward</button>
      <button onClick={handleStop}>Emergency Stop</button>
    </div>
  );
}
```

---

## Related Documentation

- [System Overview](../architecture/SYSTEM_OVERVIEW.md)
- [Configuration Guide](../setup/CONFIGURATION.md)
- [Troubleshooting](../troubleshooting/COMMON_ISSUES.md)

---

**Last Updated**: February 28, 2026  
**Version**: 1.0.0
