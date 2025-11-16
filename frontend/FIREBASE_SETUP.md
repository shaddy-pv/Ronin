# Firebase Setup Guide for RONIN

## ✅ Installation Complete

Firebase has been successfully integrated into the RONIN frontend application.

## 📦 What's Been Added

### 1. Firebase Configuration (`src/lib/firebase.ts`)
- Initialized Firebase app with your project credentials
- Set up Realtime Database connection
- Configured Analytics

### 2. Firebase Service Layer (`src/lib/firebaseService.ts`)
Complete service functions for:
- **IoT Readings**: Subscribe to real-time sensor data
- **Rover Control**: Send commands and read rover state
- **Rover Status**: Monitor battery, location, online status
- **Alerts**: Create, read, and resolve alerts
- **History**: Log and retrieve historical data
- **Hazard Score**: Calculate and classify risk levels

### 3. Custom React Hooks
Easy-to-use hooks for components:
- `useIoTReadings()` - Real-time IoT sensor data
- `useRover()` - Rover control and status
- `useAlerts()` - Alert management
- `useHistory()` - Historical logs

### 4. Mock Data Generator (`src/lib/mockData.ts`)
Test your UI without hardware:
- Generate realistic sensor readings
- Simulate rover behavior
- Create sample alerts and history
- Real-time data simulation

### 5. Firebase Utilities (`src/lib/initializeFirebase.ts`)
Helper functions to:
- Initialize Firebase structure
- Reset database to default state
- Populate with test data

## 🚀 Quick Start

### Using Firebase in Components

```tsx
import { useIoTReadings } from '@/hooks/useIoTReadings';
import { useRover } from '@/hooks/useRover';

function Dashboard() {
  const { data: iotData, loading } = useIoTReadings();
  const { control, status, setDirection } = useRover();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Hazard Score: {iotData?.hazardScore}</h1>
      <button onClick={() => setDirection('forward', 50)}>
        Move Forward
      </button>
    </div>
  );
}
```

### Initialize Firebase (First Time Setup)

Add this to your `App.tsx` or main component:

```tsx
import { initializeFirebaseStructure } from '@/lib/initializeFirebase';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize Firebase structure on first load
    initializeFirebaseStructure();
  }, []);

  return <YourApp />;
}
```

## 📊 Firebase Database Structure

```
/ronin
  /iot
    mq2: number
    mq135: number
    temperature: number
    humidity: number
    flame: boolean
    motion: boolean
    hazardScore: number
    status:
      online: boolean
      lastHeartbeat: timestamp
  
  /rover
    /control
      direction: "forward" | "back" | "left" | "right" | "stop"
      speed: number (0-100)
      mode: "auto" | "manual"
      emergency: boolean
    /status
      battery: number
      location: string
      online: boolean
  
  /alerts
    {alertId}:
      timestamp: number
      type: string
      severity: "low" | "medium" | "high" | "critical"
      summary: string
      resolved: boolean
  
  /history
    {logId}:
      timestamp: number
      mq2: number
      mq135: number
      temperature: number
      flame: boolean
      motion: boolean
      hazardScore: number
      riskLevel: "SAFE" | "WARNING" | "DANGER"
```

## 🧪 Testing Without Hardware

Use the mock data simulator for development:

```tsx
import { MockDataSimulator } from '@/lib/mockData';
import { useEffect } from 'react';

function TestComponent() {
  useEffect(() => {
    const simulator = new MockDataSimulator();
    
    // Simulate IoT readings every 3 seconds
    simulator.startIoTSimulation((data) => {
      console.log('Mock IoT data:', data);
    }, 3000);

    return () => simulator.stopAll();
  }, []);

  return <div>Testing with mock data...</div>;
}
```

## 🔐 Firebase Security Rules

**IMPORTANT**: Update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "ronin": {
      ".read": true,
      ".write": true,
      "iot": {
        ".indexOn": ["hazardScore", "status/lastHeartbeat"]
      },
      "alerts": {
        ".indexOn": ["timestamp", "severity", "resolved"]
      },
      "history": {
        ".indexOn": ["timestamp", "riskLevel"]
      }
    }
  }
}
```

For production, implement proper authentication and restrict access.

## 📝 Next Steps

1. **Update your Dashboard** to use `useIoTReadings()`
2. **Update Rover Console** to use `useRover()`
3. **Update Alerts page** to use `useAlerts()`
4. **Update History page** to use `useHistory()`
5. **Test with mock data** before connecting hardware
6. **Configure Firebase Security Rules** for production

## 🔧 Available Functions

### IoT Functions
- `subscribeToIoTReadings(callback)` - Listen to sensor data
- `calculateHazardScore(mq135, mq2, temp, ranges)` - Calculate hazard score
- `getRiskLevel(hazardScore)` - Get risk classification

### Rover Functions
- `updateRoverControl(control)` - Update rover control state
- `setRoverDirection(direction, speed)` - Move rover
- `setRoverMode(mode)` - Switch between auto/manual
- `triggerEmergencyStop()` - Emergency stop
- `subscribeToRoverStatus(callback)` - Monitor rover status

### Alert Functions
- `addAlert(alert)` - Create new alert
- `resolveAlert(alertId)` - Mark alert as resolved
- `subscribeToAlerts(callback)` - Listen to alerts

### History Functions
- `addHistoryLog(log)` - Add history entry
- `subscribeToHistory(callback)` - Listen to history

## 🐛 Troubleshooting

**Issue**: "Firebase not initialized"
- Make sure you import firebase config before using hooks

**Issue**: "No data received"
- Check Firebase console to verify data exists
- Verify database URL in config includes your region
- Check browser console for errors

**Issue**: "Permission denied"
- Update Firebase security rules
- Verify authentication if enabled

## 📚 Resources

- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- RONIN Project Documentation

---

Firebase integration is ready! Start building your real-time safety monitoring system. 🚀
