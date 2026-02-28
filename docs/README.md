# AROHAN - Autonomous Safety Monitoring System

## Documentation Index

Welcome to the AROHAN project documentation. This comprehensive guide covers all aspects of the system from setup to deployment.

---

## 📚 Documentation Structure

### Getting Started
- [Quick Start Guide](setup/QUICK_START.md) - Get up and running in 5 minutes
- [Installation Guide](setup/INSTALLATION.md) - Detailed installation instructions
- [Configuration Guide](setup/CONFIGURATION.md) - Environment and Firebase setup

### Architecture
- [System Overview](architecture/SYSTEM_OVERVIEW.md) - High-level architecture
- [Technology Stack](architecture/TECH_STACK.md) - Technologies and frameworks used
- [Database Schema](architecture/DATABASE_SCHEMA.md) - Firebase Realtime Database structure
- [Authentication Flow](architecture/AUTHENTICATION.md) - Security and auth implementation

### API Documentation
- [Frontend API](api/FRONTEND_API.md) - React hooks and services
- [Backend API](api/BACKEND_API.md) - Flask CV backend endpoints
- [Firebase API](api/FIREBASE_API.md) - Database operations

### Deployment
- [Production Deployment](deployment/PRODUCTION.md) - Deploy to Firebase Hosting
- [Environment Setup](deployment/ENVIRONMENT.md) - Production environment configuration
- [CI/CD Pipeline](deployment/CICD.md) - Automated deployment setup

### Troubleshooting
- [Common Issues](troubleshooting/COMMON_ISSUES.md) - Frequently encountered problems
- [Debug Guide](troubleshooting/DEBUG_GUIDE.md) - Debugging techniques
- [FAQ](troubleshooting/FAQ.md) - Frequently asked questions

---

## 🎯 Project Overview

**AROHAN** is a full-stack autonomous safety monitoring system that combines:
- Real-time IoT sensor monitoring (MQ2, MQ135, DHT, Flame, Motion)
- Computer vision and face recognition
- Live ESP32-CAM streaming
- Firebase cloud integration
- Responsive web dashboard with real-time charts
- Automated alert system
- Rover control interface

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AROHAN System                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Frontend   │◄────►│   Firebase   │◄────►│  Backend  │ │
│  │ React + Vite │      │   Realtime   │      │  Flask CV │ │
│  │ Port: 8080   │      │   Database   │      │ Port: 5000│ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         ▲                      ▲                     ▲       │
│         │                      │                     │       │
│         └──────────────────────┴─────────────────────┘       │
│                                │                              │
│                                ▼                              │
│                    ┌────────────────────┐                    │
│                    │   ESP32-CAM        │                    │
│                    │   + IoT Sensors    │                    │
│                    │   192.168.1.18:81  │                    │
│                    └────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Firebase CLI
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ronin

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements_cv.txt

# Configure environment
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Firebase credentials

# Start services
cd frontend && npm run dev          # Terminal 1
cd backend && python start_cv_backend.py  # Terminal 2
```

### Access Application
- Frontend: http://localhost:8080
- Backend: http://localhost:5000
- Firebase Console: https://console.firebase.google.com/project/ronin-80b29

---

## 📊 Key Features

### Real-Time Monitoring
- Live sensor data visualization
- Hazard score calculation
- Risk level assessment
- Historical data tracking

### Computer Vision
- Face detection and recognition
- Accident detection
- Snapshot capture and storage
- Firebase Storage integration

### Rover Control
- Manual and autonomous modes
- Live camera streaming
- Mission tracking
- Emergency stop functionality

### Alert System
- Real-time alert generation
- Severity classification
- Alert history and timeline
- Automated notifications

---

## 🛠️ Technology Stack

### Frontend
- React 18.3.1
- TypeScript 5.8.3
- Vite 5.4.19
- Shadcn/ui + Tailwind CSS
- Recharts for data visualization
- Firebase SDK 12.6.0

### Backend
- Python 3.13.1
- Flask 3.0.0
- OpenCV 4.12.0.88
- NumPy 2.2.1
- Firebase Admin SDK

### Database & Auth
- Firebase Realtime Database
- Firebase Authentication
- Firebase Storage
- Firebase Hosting

### Hardware
- ESP32-CAM
- MQ2 Gas Sensor
- MQ135 Air Quality Sensor
- DHT Temperature/Humidity Sensor
- Flame Sensor
- PIR Motion Sensor

---

## 📖 Documentation Sections

### For Developers
- [Setup Guide](setup/INSTALLATION.md) - Development environment setup
- [Architecture](architecture/SYSTEM_OVERVIEW.md) - System design and structure
- [API Reference](api/FRONTEND_API.md) - API documentation
- [Debug Guide](troubleshooting/DEBUG_GUIDE.md) - Debugging techniques

### For Operators
- [Quick Start](setup/QUICK_START.md) - Get started quickly
- [Configuration](setup/CONFIGURATION.md) - System configuration
- [Troubleshooting](troubleshooting/COMMON_ISSUES.md) - Problem resolution

### For Administrators
- [Deployment](deployment/PRODUCTION.md) - Production deployment
- [Environment Setup](deployment/ENVIRONMENT.md) - Environment configuration
- [Security](architecture/AUTHENTICATION.md) - Security best practices

---

## 🔗 Useful Links

- **Firebase Console**: https://console.firebase.google.com/project/ronin-80b29
- **Project Repository**: [GitHub URL]
- **Issue Tracker**: [Issues URL]
- **Documentation**: You're here!

---

## 📞 Support

For issues, questions, or contributions:
1. Check [Common Issues](troubleshooting/COMMON_ISSUES.md)
2. Review [FAQ](troubleshooting/FAQ.md)
3. Check [Debug Guide](troubleshooting/DEBUG_GUIDE.md)
4. Contact development team

---

## 📄 License

[Your License Here]

---

## 👥 Team

- Shadan
- Shivam

---

**Version**: 1.0.0  
**Last Updated**: February 28, 2026  
**Status**: Production Ready
