# RONIN - Autonomous Safety Monitoring System

An autonomous safety system combining fixed IoT safety nodes and an autonomous rover for hazardous condition detection and verification.

## 🏗️ Project Structure

This project is organized into three main directories:

```
ronin/
├── frontend/     # React/TypeScript web application
├── backend/      # Backend services and APIs
└── server/       # Server-side code and WebSocket handlers
```

### Frontend
React web application with dashboard, rover console, alerts, and settings pages.
- **Location**: `frontend/`
- **Tech Stack**: React, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **See**: [frontend/README.md](./frontend/README.md)

### Backend
Backend services for data processing, business logic, and API endpoints.
- **Location**: `backend/`
- **See**: [backend/README.md](./backend/README.md)

### Server
Server-side code for WebSocket connections, authentication, and middleware.
- **Location**: `server/`
- **See**: [server/README.md](./server/README.md)

## 🚀 Quick Start

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Backend & Server

_Implementation coming soon..._

## 📡 System Architecture

RONIN consists of:

1. **Fixed IoT Safety Node** (ESP8266)
   - Monitors MQ-2, MQ-135, DHT11, Flame, PIR sensors
   - Calculates weighted Hazard Score (0-100)
   - Sends live readings to Firebase
   - Activates emergency protocols

2. **Autonomous Rover** (ESP32-CAM)
   - Responds to hazardous conditions
   - Streams live camera feed
   - Sends sensor readings
   - Controlled manually or automatically via Firebase

3. **Web Application** (React)
   - Dashboard with risk cards and graphs
   - Rover console with live camera + controls
   - Alerts page + History logs
   - Settings page for thresholds

All components communicate through **Firebase Realtime Database**.

## 🔥 Firebase Structure

```
/ronin
   /iot
      readings: { mq2, mq135, temperature, humidity, flame, motion }
      hazardScore: number
      status: { online, lastHeartbeat }
   /rover
      control: { direction, speed, mode, emergency }
      status: { battery, location, online }
   /alerts
      alertId: { timestamp, type, severity, summary, resolved }
   /history
      logId: { timestamp, mq2, mq135, temperature, flame, motion, hazardScore, riskLevel }
```

## 📊 Hazard Score Model

RONIN uses a mathematical model to compute hazard level:

1. **Normalization** (0–100): `Norm = 100 * (Rx - Rmin) / (Rmax - Rmin)`
2. **Weighted Score**: `HazardScore = (0.6 * Norm(MQ135)) + (0.3 * Norm(MQ2)) + (0.1 * Norm(Temperature))`
3. **Zones**: 0–30 = SAFE, 30–60 = WARNING, 60–100 = DANGER

## 🛠️ Technologies

- **Frontend**: React, TypeScript, Vite, shadcn/ui, Tailwind CSS, Recharts
- **Backend**: _Coming soon_
- **Server**: _Coming soon_
- **Database**: Firebase Realtime Database
- **IoT**: ESP8266, ESP32-CAM

## 📄 License

_To be determined_
