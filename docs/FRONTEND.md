# Frontend Documentation

## Technology Stack

### Core Dependencies
- **react** (18.3.1) - UI framework
- **react-dom** (18.3.1) - React DOM renderer
- **typescript** (5.8.3) - Type-safe JavaScript
- **vite** (5.4.19) - Build tool and dev server

### UI & Styling
- **tailwindcss** (3.4.17) - Utility-first CSS framework
- **@radix-ui/react-*** - Headless UI primitives (40+ components)
- **lucide-react** (0.462.0) - Icon library
- **class-variance-authority** (0.7.1) - CVA for component variants
- **tailwind-merge** (2.6.0) - Merge Tailwind classes
- **tailwindcss-animate** (1.0.7) - Animation utilities

### Data & State
- **firebase** (12.6.0) - Realtime Database, Auth, Storage
- **@tanstack/react-query** (5.83.0) - Server state management
- **react-hook-form** (7.61.1) - Form management
- **zod** (3.25.76) - Schema validation

### Routing & Navigation
- **react-router-dom** (6.30.1) - Client-side routing

### Charts & Visualization
- **recharts** (2.15.4) - Chart library

### Utilities
- **date-fns** (3.6.0) - Date manipulation
- **sonner** (1.7.4) - Toast notifications
- **clsx** (2.1.1) - Conditional classNames
- **cmdk** (1.1.1) - Command palette

### Dev Dependencies
- **@vitejs/plugin-react-swc** (3.11.0) - Fast React refresh
- **autoprefixer** (10.4.21) - CSS vendor prefixes
- **eslint** (9.32.0) - Linting
- **typescript-eslint** (8.38.0) - TypeScript ESLint

## Folder Structure

```
frontend/
├── src/
│   ├── pages/              # Page components (routes)
│   ├── components/         # Reusable components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic services
│   ├── lib/                # Utilities and helpers
│   ├── contexts/           # React contexts
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root component with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── tailwind.config.ts      # Tailwind config
```


## Pages

### Dashboard.tsx
**Path**: `/dashboard`  
**Purpose**: Main monitoring dashboard with live sensor data and hazard score

**Features**:
- Live IoT sensor readings (MQ-2, MQ-135, temperature, humidity, flame, motion)
- Calculated hazard score (0-100) with color-coded risk level
- Sensor contribution breakdown
- Real-time charts (last 60 minutes)
- IoT node online/offline status
- Sensor detail drawers for deep-dive analysis

**Firebase Reads**:
- `ronin/iot_nodes/iotA` - Live sensor data via `useIoTReadings` hook

**Key Components Used**:
- `SensorDashboard` - Sensor cards grid
- `SensorDetailDrawer` - Detailed sensor analysis
- `HazardScoreModal` - Hazard calculation explanation
- `RealtimeChartData` - Live trend charts

### RoverConsole.tsx
**Path**: `/rover`  
**Purpose**: Rover control interface with live camera stream

**Features**:
- Live MJPEG stream from CV Backend (`/stream-raw`)
- Manual control buttons (Forward, Back, Left, Right, Stop)
- Saved paths panel with navigation
- Rover mission status tracking
- Snapshot capture with Firebase upload
- Rover online/offline status (30-second heartbeat)

**Firebase Reads**:
- `ronin/rover/status` - Rover heartbeat
- `ronin/rover/mission` - Mission tracking

**Firebase Writes**:
- `ronin/rover/control` - Movement commands
- `ronin/rover/target` - Saved path navigation

**Key Components Used**:
- `SimpleMjpegStream` - MJPEG stream display
- `SavedPaths` - Path management panel
- `RoverMissionStatus` - Mission tracking

### FaceRecognitionPage.tsx
**Path**: `/face-recognition`  
**Purpose**: Face detection and recognition monitoring

**Features**:
- Live annotated stream from CV Backend (`/stream-annotated`)
- Face detection with bounding boxes
- Known/unknown face identification
- Confidence scores
- CV Backend status panel
- Recent alerts display

**CV Backend API Calls**:
- `GET /stream-annotated` - Annotated MJPEG stream
- `GET /health` - Backend status check

**Key Components Used**:
- `RealTimeFaceRecognition` - Annotated stream display
- `CVBackendStatus` - Backend health monitoring
- `RecentAlerts` - Alert feed


### SolutionPage.tsx
**Path**: `/solution`  
**Purpose**: AI-powered hazard analysis using Groq LLaMA3

**Features**:
- Real-time sensor data display
- Groq AI hazard analysis button
- Structured analysis results:
  - Hazard level (SAFE/WARNING/DANGER/CRITICAL)
  - Chemical identification
  - Summary and detailed analysis
  - Immediate actions required
  - Mitigation steps
  - PPE requirements
  - Do-not list (actions to avoid)
  - Emergency contact information
- Color-coded severity indicators
- IoT node online/offline status

**Firebase Reads**:
- `ronin/iot_nodes/iotA` - Live sensor data

**External API Calls**:
- `POST https://api.groq.com/openai/v1/chat/completions` - Groq AI analysis

**Key Logic**:
- Builds detailed prompt with sensor readings
- Parses JSON response from LLaMA3
- Handles errors (401, 429, stale data, missing API key)
- Displays structured analysis with icons and formatting

### AlertsPage.tsx
**Path**: `/alerts`  
**Purpose**: Alert history and management

**Features**:
- Alert list with severity badges
- Filter by type (Fire, Gas Leak, Face Detection, etc.)
- Search by message content
- Alert detail modal with snapshot
- Clear all alerts button
- Alert count by severity

**Firebase Reads**:
- `ronin/alerts` - Alert history via `useAlerts` hook

**Key Components Used**:
- `AlertDetailModal` - Full alert details with image
- `StatusBadge` - Severity indicators

### HistoryPage.tsx
**Path**: `/history`  
**Purpose**: Historical sensor data analysis

**Features**:
- Time range selector (1 hour, 6 hours, 24 hours, 7 days)
- Multi-line charts for all sensors
- Data export (CSV/JSON)
- Statistics (min, max, average)
- Hazard score trends

**Firebase Reads**:
- `ronin/history` - Historical sensor data via `useHistory` hook

**Key Components Used**:
- Recharts `LineChart`, `XAxis`, `YAxis`, `Tooltip`, `Legend`

### SettingsPage.tsx
**Path**: `/settings`  
**Purpose**: System configuration and preferences

**Features**:
- Rover behavior settings (auto-dispatch, return to base)
- Alert preferences (severity thresholds)
- Display settings (theme, units)
- System information
- Firebase connection status

**Firebase Reads/Writes**:
- `ronin/settings` - User preferences via `useSettings` hook


## Custom Hooks

### useIoTReadings.ts
**Purpose**: Subscribe to live IoT sensor data from Firebase

**Returns**:
```typescript
{
  data: IoTReadings | null,
  loading: boolean,
  error: Error | null
}
```

**Firebase Path**: `ronin/iot_nodes/iotA`

**Features**:
- Real-time updates via `onValue()`
- Data normalization (handles missing fields)
- Online/offline detection (30-second heartbeat)
- Hazard score calculation
- Risk level classification (SAFE/WARNING/DANGER)

### useRoverAlerts.ts
**Purpose**: Manage rover alerts (local + CV Backend sync)

**Returns**:
```typescript
{
  alerts: RoverAlert[],
  recentAlerts: RoverAlert[],
  addAlert: (type, message, options) => void,
  clearAlerts: () => void,
  removeAlert: (id) => void
}
```

**Features**:
- localStorage persistence
- CV Backend polling (30-second interval)
- Automatic backend availability detection
- Deduplication of alerts

**CV Backend API**:
- `GET /alerts` - Fetch alerts
- `POST /alerts` - Add alert

### useCalculatedHazardScore.ts
**Purpose**: Calculate hazard score from sensor readings

**Returns**:
```typescript
{
  hazardScore: number,
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER',
  contributions: SensorContribution[]
}
```

**Algorithm**:
- MQ-2: 30% weight (gas detection)
- MQ-135: 60% weight (air quality)
- Temperature: 10% weight (heat)
- Flame: +40 points if detected
- Motion: +5 points if detected

### useRealtimeChartData.ts
**Purpose**: Build time-series data for charts

**Parameters**:
```typescript
{
  windowMinutes: number,  // Time window (default: 60)
  maxPoints: number       // Max data points (default: 20)
}
```

**Returns**:
```typescript
{
  chartData: ChartDataPoint[],
  isRoverConnected: boolean,
  dataPointCount: number
}
```

**Features**:
- Automatic data point addition (every 3 seconds)
- Time window filtering
- Duplicate detection
- Rover sensor integration

### useRoverMissionTracking.ts
**Purpose**: Track rover mission status

**Returns**:
```typescript
{
  mission: RoverMission | null,
  isActive: boolean,
  progress: number
}
```

**Firebase Path**: `ronin/rover/mission`

**Mission States**:
- IDLE - No active mission
- DISPATCHED - Mission assigned
- EN_ROUTE - Traveling to target
- ARRIVED - Reached destination
- INVESTIGATING - Performing inspection
- RETURNING - Coming back to base
- COMPLETED - Mission finished


## Services

### roverMissionService.ts
**Purpose**: Rover mission management functions

**Functions**:
- `dispatchRover(target, reason)` - Send rover to location
- `setRoverEnRoute()` - Update to EN_ROUTE state
- `markRoverArrived()` - Mark arrival at target
- `startInvestigation()` - Begin investigation phase
- `completeMission()` - Return to base
- `resetMission()` - Reset to IDLE
- `subscribeToMission(callback)` - Listen to mission updates
- `updateMissionProgress(progress)` - Update progress (0-100)

**Firebase Writes**:
- `ronin/rover/mission` - Mission status
- `ronin/rover/control` - Movement commands

### clientMonitoring.ts
**Purpose**: Client-side monitoring service (runs in browser)

**Features**:
- Auto-create alerts on hazards
- Periodic history logging (every 5 minutes)
- Battery monitoring with auto-return
- Connection status monitoring
- Auto-dispatch on high hazard scores

**Methods**:
- `start()` - Start monitoring
- `stop()` - Stop monitoring
- `isRunning()` - Check if active
- `setHistoryInterval(minutes)` - Configure logging frequency

**Alert Triggers**:
- Fire detected (flame sensor)
- High gas levels (MQ-2 > 700)
- Poor air quality (MQ-135 > 900)
- High temperature (> 40°C)
- High hazard score (> 60)
- Motion detected
- Low battery (< 20%)
- Critical battery (< 10%)
- Node offline/online

### cvBackendService.ts
**Purpose**: CV Backend API client

**Functions**:
- `checkHealth()` - Backend health check
- `getAlerts()` - Fetch alert history
- `analyzeFrame(image)` - Analyze single frame
- `reloadFaces()` - Retrain face recognition
- `addFace(name, image)` - Add new person
- `getKnownFaces()` - List registered people
- `updateESP32URL(url)` - Change ESP32 IP

**Base URL**: `http://localhost:5000` (configurable via `VITE_CV_BACKEND_URL`)

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser.

### Firebase Configuration
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### ESP32-CAM Configuration
```bash
VITE_ESP32_BASE_URL=http://192.168.1.22
VITE_ESP32_STREAM_ENDPOINT=/stream
VITE_ESP32_CAPTURE_ENDPOINT=/capture
```

### CV Backend Configuration
```bash
VITE_CV_BACKEND_URL=http://localhost:5000
```

### Groq AI Configuration
```bash
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
```

## State Management

### Firebase Real-time Listeners
- All sensor data uses Firebase `onValue()` for real-time updates
- Automatic reconnection on network loss
- Optimistic UI updates with error rollback

### React Context
- `AuthContext` - User authentication state
- `FirebaseContext` - Firebase app instance

### Local State
- Component-level state with `useState`
- Form state with `react-hook-form`
- Server state with `@tanstack/react-query`

### localStorage
- Alerts persistence
- Saved paths
- User preferences

## Routing

```typescript
/ → /dashboard (redirect)
/login → Login page
/signup → Signup page
/dashboard → Dashboard (protected)
/rover → Rover Console (protected)
/face-recognition → Face Recognition (protected)
/solution → Solution Page (protected)
/alerts → Alerts Page (protected)
/history → History Page (protected)
/settings → Settings Page (protected)
/camera-test → Camera Test (protected)
* → 404 Not Found
```

All routes except `/login` and `/signup` are protected by `ProtectedRoute` component (requires authentication).

---

**Next**: [Backend Documentation](./BACKEND.md)
