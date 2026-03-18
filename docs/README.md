# AROHAN Rover Command Center

## What is AROHAN?

AROHAN (Autonomous Rover for Observation and Hazard Analysis Network) is a comprehensive IoT-based safety monitoring and autonomous rover control system designed for industrial environments, construction sites, and hazardous areas. The system combines real-time sensor monitoring, computer vision-based face recognition, AI-powered hazard analysis, and autonomous rover control into a unified command center.

### Problem Statement

Industrial and hazardous environments face multiple safety challenges:
- **Real-time hazard detection**: Gas leaks, fire, high temperatures, and poor air quality require immediate detection
- **Personnel safety**: Tracking authorized personnel and detecting unauthorized access
- **Emergency response**: Rapid assessment and response to dangerous conditions
- **Remote monitoring**: Need for 24/7 monitoring without constant human presence
- **Data-driven decisions**: Lack of historical data for safety trend analysis

### Solution

AROHAN provides:
- **Live IoT sensor monitoring** with real-time hazard score calculation
- **Computer vision** for face detection, recognition, and accident detection
- **AI-powered analysis** using Groq LLaMA3 for hazard assessment and safety recommendations
- **Autonomous rover** with remote control and auto-dispatch capabilities
- **Historical data logging** for trend analysis and compliance reporting
- **Alert system** with severity classification and automated notifications

### Who Uses AROHAN?

- **Safety Officers**: Monitor hazardous conditions and respond to alerts
- **Site Managers**: Track safety metrics and compliance
- **Security Personnel**: Identify authorized/unauthorized personnel
- **Emergency Responders**: Access real-time data during incidents
- **Operations Teams**: Control rover for remote inspection

## Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type-safe development
- **Vite 5.4.19** - Build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first styling
- **Shadcn/ui** - Component library (Radix UI primitives)
- **Firebase 12.6.0** - Realtime Database for live data sync
- **React Router v6.30.1** - Client-side routing
- **Recharts 2.15.4** - Data visualization
- **Groq AI API** - LLaMA3-8B-8192 for hazard analysis
- **Lucide React 0.462.0** - Icon library
- **React Hook Form 7.61.1** - Form management
- **Zod 3.25.76** - Schema validation
- **date-fns 3.6.0** - Date utilities
- **Sonner 1.7.4** - Toast notifications

### Backend (CV Backend)
- **Python 3.10+** - Programming language
- **Flask 3.0.0** - Web framework
- **Flask-CORS 4.0.0** - Cross-origin resource sharing
- **OpenCV 4.x** - Computer vision (DNN + Haar cascade face detection)
- **face_recognition** - FaceNet-based face encoding (dlib)
- **NumPy** - Numerical operations
- **Pillow** - Image processing
- **Requests** - HTTP client for ESP32 communication
- **Firebase Admin SDK** - Alert sync and snapshot storage
- **python-dotenv** - Environment configuration

### Database & Cloud
- **Firebase Realtime Database** - NoSQL real-time data sync
- **Firebase Storage** - Snapshot image storage
- **Firebase Authentication** - User authentication (Email/Password)

### Hardware
- **ESP32-CAM (AI-Thinker)** - Camera module with WiFi
- **MQ-2 Gas Sensor** - Combustible gas detection (LPG, propane, methane)
- **MQ-135 Air Quality Sensor** - Air quality monitoring (CO2, NH3, benzene)
- **DHT11/DHT22** - Temperature and humidity sensor
- **Flame Sensor** - Fire detection
- **PIR Motion Sensor** - Motion detection
- **Ultrasonic Sensor (HC-SR04)** - Distance measurement
- **Rover Chassis** - Motor-driven platform with L298N motor driver

## Quick Links

- [System Architecture](./ARCHITECTURE.md) - High-level system design and component interaction
- [Frontend Documentation](./FRONTEND.md) - Complete React/TypeScript frontend guide
- [Backend Documentation](./BACKEND.md) - CV Backend (Flask/Python) reference
- [System Flow](./SYSTEM_FLOW.md) - End-to-end data flow diagrams
- [Database Schema](./DATABASE.md) - Firebase Realtime Database structure
- [API Reference](./API.md) - CV Backend REST API endpoints
- [Setup Guide](./SETUP.md) - Installation and configuration
- [Component Reference](./COMPONENTS.md) - React component documentation

## Key Features

### 1. Real-Time Monitoring Dashboard
- Live sensor data visualization (gas, temperature, humidity, flame, motion)
- Calculated hazard score (0-100) with risk level classification
- Online/offline status for IoT nodes and rover
- Historical trend charts with configurable time windows

### 2. Computer Vision System
- **Face Detection**: DNN-based (res10 SSD) with Haar cascade fallback
- **Face Recognition**: FaceNet encodings with IoU-based tracking
- **Quality Filtering**: Blur detection, size validation, aspect ratio checks
- **Training Pipeline**: Automatic augmentation (flip, brightness, blur)
- **Caching**: LRU cache for face encodings to reduce computation

### 3. AI-Powered Hazard Analysis
- Groq LLaMA3-8B-8192 model for natural language analysis
- Real-time sensor data interpretation
- Chemical identification and risk assessment
- PPE recommendations and safety protocols
- Emergency contact information
- Do-not list (actions to avoid)

### 4. Autonomous Rover Control
- Manual control (forward, backward, left, right, stop)
- Auto-dispatch on high hazard scores
- Mission tracking (IDLE → DISPATCHED → EN_ROUTE → INVESTIGATING → RETURNING)
- Saved path navigation
- Live camera stream with 180° rotation correction
- Battery monitoring with auto-return on low battery

### 5. Alert System
- Severity classification (LOW, MEDIUM, HIGH, CRITICAL)
- Alert types: Fire, Gas Leak, Air Quality, High Temperature, Motion, Known/Unknown Face
- Snapshot capture with Firebase Storage upload
- Alert history with filtering and search
- Real-time notifications via Firebase

### 6. Historical Data Analysis
- Sensor data logging every 5 minutes
- Trend visualization with Recharts
- Export capabilities for compliance reporting
- Automatic cleanup (keeps last 1000 entries)

## System Requirements

### Development Environment
- **Node.js 18+** (for frontend)
- **Python 3.10+** (for CV backend)
- **Git** (version control)
- **Firebase CLI** (optional, for deployment)

### Hardware (Optional)
- **ESP32-CAM module** (AI-Thinker board)
- **IoT sensors** (MQ-2, MQ-135, DHT, Flame, PIR)
- **Rover chassis** with motor driver
- **Power supply** (5V for ESP32, 12V for motors)

### Cloud Services (Free Tier)
- **Firebase** (Realtime Database + Storage + Auth)
- **Groq** (14,400 requests/day free tier)

## Project Status

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: March 17, 2026

## License

MIT License - See LICENSE file for details

## Team

**AROHAN Development Team (TECHEEZ)**
- Shadan - Developer
- Shivam - Developer

## Support

For issues, questions, or contributions:
1. Check the [Setup Guide](./SETUP.md) for installation help
2. Review [System Flow](./SYSTEM_FLOW.md) for understanding data flow
3. Consult [API Reference](./API.md) for backend integration
4. Open an issue on GitHub for bugs or feature requests

---

**Made with ❤️ by the AROHAN Team**
