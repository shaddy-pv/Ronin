# Component Documentation

## Core Components

### SimpleMjpegStream
**File**: `src/components/SimpleMjpegStream.tsx`

**Purpose**: Display MJPEG stream from CV Backend with controls

**Props**:
```typescript
{
  streamUrl: string;           // MJPEG stream URL
  nodeId: string;              // IoT node ID
  roverId: string;             // Rover ID
  showControls?: boolean;      // Show snapshot button
  onSnapshotSaved?: (metadata) => void;  // Snapshot callback
}
```

**State**:
- `isStreaming: boolean` - Stream active status
- `hasError: boolean` - Error state
- `errorMessage: string` - Error details

**Features**:
- Automatic stream start/stop
- Snapshot capture with Firebase upload
- Error handling with retry
- 180° rotation support (CSS transform)

**Used in**: RoverConsole, CameraTest

---

### RealTimeFaceRecognition
**File**: `src/components/RealTimeFaceRecognition.tsx`

**Purpose**: Display annotated face recognition stream

**Props**:
```typescript
{
  streamUrl: string;           // Annotated stream URL
  onBackendStatusChange?: (status) => void;
}
```

**State**:
- `isStreaming: boolean`
- `backendStatus: 'online' | 'offline' | 'error'`
- `hasError: boolean`

**Features**:
- Face detection boxes overlay
- Name labels with confidence scores
- Backend health monitoring
- Toast notifications

**Used in**: FaceRecognitionPage

---

### SensorDashboard
**File**: `src/components/SensorDashboard.tsx`

**Purpose**: Display sensor cards grid

**Props**:
```typescript
{
  iotReadings: IoTReadings;
  onSensorClick?: (sensorType) => void;
}
```

**Features**:
- MQ-2 gas sensor card
- MQ-135 air quality card
- Temperature card
- Humidity card
- Flame sensor indicator
- Motion sensor indicator
- Click to open detail drawer

**Used in**: Dashboard

---

### SensorDetailDrawer
**File**: `src/components/SensorDetailDrawer.tsx`

**Purpose**: Detailed sensor analysis with charts

**Props**:
```typescript
{
  open: boolean;
  onClose: () => void;
  sensorType: 'mq2' | 'mq135' | 'temperature' | 'humidity';
  iotReadings: IoTReadings;
  roverSensors?: RoverSensors;
}
```

**Features**:
- Real-time trend charts (last 60 minutes)
- Fixed IoT vs Rover sensor comparison
- Sensor statistics (min, max, avg)
- Hazard contribution breakdown
- Status indicators

**Used in**: Dashboard

---

### SavedPaths
**File**: `src/components/SavedPaths.tsx`

**Purpose**: Manage saved navigation paths

**Props**: None (uses localStorage)

**State**:
- `paths: SavedPath[]` - List of saved paths
- `roverStatus: 'online' | 'offline'` - Rover connection status

**Features**:
- Add current location
- Navigate to saved path
- Delete path
- localStorage persistence
- Rover online/offline status

**Firebase Writes**:
- `ronin/rover/target` - Navigation command

**Firebase Reads**:
- `ronin/rover/status` - Rover heartbeat

**Used in**: RoverConsole

---

### RoverMissionStatus
**File**: `src/components/RoverMissionStatus.tsx`

**Purpose**: Display current rover mission

**Props**: None

**State**:
- `mission: RoverMission | null`

**Features**:
- Mission state display (IDLE, DISPATCHED, EN_ROUTE, etc.)
- Progress bar (0-100%)
- Target location
- Dispatch reason
- Timestamps

**Firebase Reads**:
- `ronin/rover/mission`

**Used in**: RoverConsole, Dashboard

---

### RecentAlerts
**File**: `src/components/RecentAlerts.tsx`

**Purpose**: Display recent alerts (last 3)

**Props**:
```typescript
{
  alerts: RoverAlert[];
  onAlertClick?: (alert) => void;
}
```

**Features**:
- Alert type badges
- Severity color coding
- Snapshot thumbnails
- Relative timestamps
- Click to view details

**Used in**: Dashboard, FaceRecognitionPage

---

### HazardScoreModal
**File**: `src/components/HazardScoreModal.tsx`

**Purpose**: Explain hazard score calculation

**Props**:
```typescript
{
  open: boolean;
  onClose: () => void;
  contributions: SensorContribution[];
}
```

**Features**:
- Sensor weight breakdown
- Contribution percentages
- Formula explanation
- Visual indicators

**Used in**: Dashboard

---

### CVBackendStatus
**File**: `src/components/CVBackendStatus.tsx`

**Purpose**: Display CV Backend health

**Props**: None

**State**:
- `status: 'online' | 'offline' | 'checking'`
- `health: HealthResponse | null`

**Features**:
- Backend connection status
- Detector type (DNN/Haar)
- Recognizer type (FaceNet/LBP)
- Known faces count
- ESP32 connection status
- Frame count

**API Calls**:
- `GET /health` - Backend health check

**Used in**: FaceRecognitionPage

---

### MonitoringControlPanel
**File**: `src/components/MonitoringControlPanel.tsx`

**Purpose**: Control client-side monitoring service

**Props**: None

**Features**:
- Start/stop monitoring
- Status indicator
- History logging interval
- Auto-dispatch toggle

**Service**: `clientMonitoring`

**Used in**: SettingsPage

---

### AlertDetailModal
**File**: `src/components/AlertDetailModal.tsx`

**Purpose**: Display full alert details

**Props**:
```typescript
{
  alert: RoverAlert | null;
  open: boolean;
  onClose: () => void;
}
```

**Features**:
- Full-size snapshot image
- Alert metadata
- Confidence score
- Timestamp
- Face bounding box info

**Used in**: AlertsPage

---

### HazardAlertBanner
**File**: `src/components/HazardAlertBanner.tsx`

**Purpose**: Display hazard level banner

**Props**:
```typescript
{
  level: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
  chemical?: string;
}
```

**Features**:
- Color-coded by severity
- Icon indicators
- Chemical name display
- Animated pulse for CRITICAL

**Used in**: SolutionPage

---

## Utility Components

### LoadingSpinner
**File**: `src/components/LoadingSpinner.tsx`

**Purpose**: Loading indicator

**Props**:
```typescript
{
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

---

### ErrorState
**File**: `src/components/ErrorState.tsx`

**Purpose**: Error display with retry

**Props**:
```typescript
{
  message: string;
  onRetry?: () => void;
}
```

---

### StatusBadge
**File**: `src/components/StatusBadge.tsx`

**Purpose**: Status indicator badge

**Props**:
```typescript
{
  status: 'online' | 'offline' | 'warning' | 'error';
  label?: string;
}
```

---

### FirebaseConnectionStatus
**File**: `src/components/FirebaseConnectionStatus.tsx`

**Purpose**: Firebase connection indicator (global)

**Props**: None

**Features**:
- Connection status toast
- Auto-hide when connected
- Reconnection attempts

**Used in**: App.tsx (global)

---

## UI Components (Shadcn/ui)

All UI components are in `src/components/ui/` and are based on Radix UI primitives:

- **Button** - Button component with variants
- **Card** - Card container with header/content/footer
- **Badge** - Badge component for labels
- **Dialog** - Modal dialog
- **Drawer** - Side drawer
- **Toast** - Toast notifications
- **Tabs** - Tab navigation
- **Select** - Dropdown select
- **Input** - Text input
- **Slider** - Range slider
- **Switch** - Toggle switch
- **Progress** - Progress bar
- **Separator** - Divider line
- **Tooltip** - Hover tooltip
- **Alert** - Alert box
- **Accordion** - Collapsible sections
- **Chart** - Recharts wrapper

See [Shadcn/ui Documentation](https://ui.shadcn.com/) for full component API.

---

**Documentation Complete!**

For questions or issues, refer to:
- [System Architecture](./ARCHITECTURE.md)
- [Setup Guide](./SETUP.md)
- [API Reference](./API.md)
