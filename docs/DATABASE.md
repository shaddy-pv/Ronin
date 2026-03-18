# Firebase Database Structure

## Complete Schema

```
ronin/
├── iot_nodes/
│   └── iotA/
│       ├── mq2: number                    # Gas sensor (0-1023)
│       ├── mq135: number                  # Air quality analog (0-1023)
│       ├── mq135_raw: 0 | 1               # Air quality digital
│       ├── mq135_digital: 0 | 1           # Air quality threshold
│       ├── temperature: number            # Temperature (°C)
│       ├── humidity: number               # Humidity (%)
│       ├── flame: boolean                 # Flame detected
│       ├── motion: boolean                # Motion detected
│       ├── hazardScore: number            # Calculated score (0-100)
│       ├── riskLevel: string              # SAFE | WARNING | DANGER
│       ├── status/
│       │   ├── online: boolean
│       │   └── lastHeartbeat: number      # Unix timestamp (ms)
│       └── emergency/
│           ├── active: boolean
│           └── timestamp: number
│
├── alerts/
│   └── {alertId}/
│       ├── id: string                     # Unique alert ID
│       ├── type: string                   # Alert type
│       ├── message: string                # Alert message
│       ├── createdAt: string              # ISO timestamp
│       ├── confidence: number             # 0.0-1.0
│       ├── snapshotUrl: string            # Image URL
│       └── meta: object                   # Additional data
│           ├── faces: number
│           └── box: {x, y, w, h}
│
├── history/
│   └── {readingId}/
│       ├── timestamp: number              # Unix timestamp (ms)
│       ├── mq2: number
│       ├── mq135: number
│       ├── temperature: number
│       ├── humidity: number
│       ├── flame: boolean
│       ├── motion: boolean
│       ├── hazardScore: number
│       └── riskLevel: string
│
├── rover/
│   ├── control/
│   │   ├── direction: string              # forward|backward|left|right|stop
│   │   ├── speed: number                  # 0-100
│   │   ├── mode: string                   # manual|auto
│   │   └── timestamp: number
│   │
│   ├── status/
│   │   ├── online: boolean
│   │   ├── timestamp: number              # Heartbeat
│   │   └── battery: number                # 0-100
│   │
│   ├── mission/
│   │   ├── state: string                  # Mission state
│   │   ├── target: string                 # Target location
│   │   ├── reason: string                 # Dispatch reason
│   │   ├── dispatchedAt: number
│   │   ├── enRouteAt: number
│   │   ├── arrivedAt: number
│   │   ├── completedAt: number
│   │   ├── updatedAt: number
│   │   └── progress: number               # 0-100
│   │
│   └── target/
│       ├── lat: number                    # GPS latitude
│       ├── lng: number                    # GPS longitude
│       ├── label: string                  # Path name
│       └── timestamp: number
│
└── settings/
    └── roverBehavior/
        ├── autoDispatchEnabled: boolean
        ├── returnToBaseAfterCheck: boolean
        └── autoDispatchThreshold: number
```


## Alert Types

| Type | Description | Severity |
|------|-------------|----------|
| `KNOWN_FACE` | Known person detected | LOW |
| `UNKNOWN_FACE` | Unknown person detected | MEDIUM |
| `ACCIDENT` | Potential accident detected | HIGH |
| `Fire Detected` | Flame sensor triggered | CRITICAL |
| `Gas Leak` | MQ-2 > 700 | HIGH |
| `Poor Air Quality` | MQ-135 > 900 | MEDIUM |
| `High Temperature` | Temperature > 40°C | MEDIUM |
| `High Hazard Level` | Hazard score > 60 | HIGH |
| `Motion Detected` | PIR sensor triggered | LOW |
| `Low Battery` | Battery < 20% | MEDIUM |
| `Critical Battery` | Battery < 10% | HIGH |
| `Node Offline` | Heartbeat timeout | HIGH |
| `Node Online` | Node reconnected | LOW |

## Mission States

| State | Description | Progress |
|-------|-------------|----------|
| `IDLE` | No active mission | 0 |
| `DISPATCHED` | Mission assigned | 0 |
| `EN_ROUTE` | Traveling to target | 50 |
| `ARRIVED` | Reached destination | 100 |
| `INVESTIGATING` | Performing inspection | 100 |
| `RETURNING` | Coming back to base | 75 |
| `COMPLETED` | Mission finished | 100 |
| `OFFLINE` | Rover disconnected | - |

## Frontend Read Paths

| Path | Hook/Component | Purpose |
|------|----------------|---------|
| `ronin/iot_nodes/iotA` | `useIoTReadings` | Live sensor data |
| `ronin/alerts` | `useAlerts` | Alert history |
| `ronin/history` | `useHistory` | Historical data |
| `ronin/rover/status` | `RoverConsole` | Rover online/offline |
| `ronin/rover/mission` | `useRoverMissionTracking` | Mission tracking |
| `ronin/settings` | `useSettings` | User preferences |

## Frontend Write Paths

| Path | Component | Purpose |
|------|-----------|---------|
| `ronin/rover/control` | `RoverConsole` | Movement commands |
| `ronin/rover/target` | `SavedPaths` | Navigation targets |
| `ronin/rover/mission` | `roverMissionService` | Mission updates |
| `ronin/settings` | `SettingsPage` | Configuration |

## Backend Write Paths

| Path | Source | Purpose |
|------|--------|---------|
| `ronin/alerts/{id}` | `cv_backend.py` | Face detection alerts |
| `ronin/snapshots/{filename}` | Firebase Storage | Snapshot images |

## IoT Node Write Paths

| Path | Source | Purpose |
|------|--------|---------|
| `ronin/iot_nodes/iotA` | ESP32/Arduino | Sensor readings |

## Data Retention

| Path | Retention | Cleanup |
|------|-----------|---------|
| `ronin/iot_nodes/iotA` | Latest only | Overwrite |
| `ronin/alerts` | Last 1000 | Manual |
| `ronin/history` | Last 1000 | Auto (clientMonitoring) |
| `ronin/rover/status` | Latest only | Overwrite |
| `ronin/rover/mission` | Latest only | Overwrite |
| Snapshots (disk) | Last 200 | Auto (cv_backend) |
| Snapshots (Firebase) | Unlimited | Manual |

## Security Rules

```json
{
  "rules": {
    "ronin": {
      ".read": "auth != null",
      ".write": "auth != null",
      "iot_nodes": {
        ".write": true
      },
      "rover": {
        "control": {
          ".write": "auth != null"
        },
        "status": {
          ".write": true
        }
      }
    }
  }
}
```

**Key Points**:
- All reads require authentication
- Most writes require authentication
- IoT nodes can write without auth (device credentials)
- Rover status can be written without auth (heartbeat)

## Example Data

### IoT Reading
```json
{
  "mq2": 450,
  "mq135": 0,
  "mq135_raw": 0,
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
  },
  "emergency": {
    "active": false,
    "timestamp": 0
  }
}
```

### Alert
```json
{
  "id": "a_1710691200_0",
  "type": "KNOWN_FACE",
  "message": "Known: shadan",
  "createdAt": "2026-03-17T10:30:00.000Z",
  "confidence": 0.87,
  "snapshotUrl": "http://localhost:5000/static/snapshots/snap_1710691200.jpg",
  "meta": {
    "faces": 1,
    "box": {
      "x": 100,
      "y": 150,
      "w": 80,
      "h": 80
    }
  }
}
```

### Rover Mission
```json
{
  "state": "EN_ROUTE",
  "target": "Investigation Site",
  "reason": "High hazard score detected (75.3/100)",
  "dispatchedAt": 1710691200000,
  "enRouteAt": 1710691205000,
  "updatedAt": 1710691205000,
  "progress": 50
}
```

---

**Next**: [API Reference](./API.md)
