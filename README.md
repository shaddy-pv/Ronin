# AROHAN - Autonomous Safety Monitoring System

[![Status](https://img.shields.io/badge/status-production-green)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-orange)]()

Real-time IoT safety monitoring system with computer vision, face recognition, and autonomous rover control.

---

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>
cd ronin

# Install dependencies
cd frontend && npm install
cd ../backend && pip install -r requirements_cv.txt

# Configure environment
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Firebase credentials

# Deploy Firebase rules
firebase deploy --only database

# Start services
cd frontend && npm run dev          # Terminal 1
cd backend && python start_cv_backend.py  # Terminal 2
```

**Access**: http://localhost:8080

📖 **Full Documentation**: [docs/README.md](docs/README.md)

---

## ✨ Features

- **Real-Time Monitoring**: Live sensor data visualization with hazard score calculation
- **Computer Vision**: Face detection, recognition, and accident detection
- **Rover Control**: Manual and autonomous modes with live camera streaming
- **Alert System**: Automated alert generation with severity classification
- **Historical Analysis**: Data logging and trend analysis
- **Responsive UI**: Modern dashboard with dark/light themes

---

## 🏗️ Architecture

```
Frontend (React + Vite) ←→ Firebase Cloud ←→ Backend (Flask CV)
                                ↕
                          ESP32-CAM + IoT Sensors
```

**Components**:
- **Frontend**: React 18, TypeScript, Shadcn/ui, Tailwind CSS
- **Backend**: Python 3.13, Flask 3.0, OpenCV 4.12
- **Database**: Firebase Realtime Database
- **Auth**: Firebase Authentication
- **Hardware**: ESP32-CAM, MQ2, MQ135, DHT, Flame, Motion sensors

---

## 📊 System Requirements

- Node.js 18+
- Python 3.8+
- Firebase CLI
- Git

**Optional**:
- ESP32-CAM module
- IoT sensors (MQ2, MQ135, DHT, Flame, PIR)

---

## 📚 Documentation

### Getting Started
- [Quick Start Guide](docs/setup/QUICK_START.md)
- [Installation Guide](docs/setup/INSTALLATION.md)
- [Configuration Guide](docs/setup/CONFIGURATION.md)

### Architecture
- [System Overview](docs/architecture/SYSTEM_OVERVIEW.md)
- [Technology Stack](docs/architecture/TECH_STACK.md)
- [Database Schema](docs/architecture/DATABASE_SCHEMA.md)

### Troubleshooting
- [Common Issues](docs/troubleshooting/COMMON_ISSUES.md)
- [Debug Guide](docs/troubleshooting/DEBUG_GUIDE.md)
- [FAQ](docs/troubleshooting/FAQ.md)

---

## 🎯 Project Structure

```
ronin/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # Custom hooks
│   │   ├── lib/        # Utilities
│   │   └── contexts/   # React contexts
│   └── package.json
├── backend/            # Python CV backend
│   ├── cv_backend.py   # Main backend
│   ├── known_faces/    # Face recognition
│   └── static/         # Snapshots
├── docs/               # Documentation
├── firebase.json       # Firebase config
└── database.rules.json # Security rules
```

---

## 🔧 Development

### Start Development Servers

```bash
# Frontend (http://localhost:8080)
cd frontend
npm run dev

# Backend (http://localhost:5000)
cd backend
python start_cv_backend.py
```

### Build for Production

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Firebase
firebase deploy
```

---

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend health check
curl http://localhost:5000/health

# Firebase connection test
firebase projects:list
```

---

## 📦 Deployment

### Firebase Hosting

```bash
# Build and deploy
cd frontend
npm run build
firebase deploy --only hosting

# Deploy database rules
firebase deploy --only database
```

### Backend Deployment

```bash
# Deploy to VPS/Cloud
# 1. Install dependencies
# 2. Configure environment
# 3. Start with process manager (PM2, systemd)
```

---

## 🔐 Security

- Firebase Authentication (Email/Password)
- Database security rules
- HTTPS only in production
- Environment variables for secrets
- CORS configured

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👥 Team

- **Shadan** - Developer
- **Shivam** - Developer

---

## 🔗 Links

- **Documentation**: [docs/README.md](docs/README.md)
- **Firebase Console**: https://console.firebase.google.com/project/ronin-80b29
- **Issue Tracker**: [GitHub Issues]
- **Project Board**: [GitHub Projects]

---

## 📞 Support

For issues and questions:
1. Check [Common Issues](docs/troubleshooting/COMMON_ISSUES.md)
2. Review [FAQ](docs/troubleshooting/FAQ.md)
3. Open an issue on GitHub
4. Contact development team

---

## 🎉 Acknowledgments

- Firebase for cloud infrastructure
- OpenCV for computer vision
- Shadcn/ui for UI components
- React community for excellent tools

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: February 28, 2026

---

Made with ❤️ by the AROHAN Team
