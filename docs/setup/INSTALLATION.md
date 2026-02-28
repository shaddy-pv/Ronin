# Installation Guide

Complete installation instructions for AROHAN system.

---

## System Requirements

### Software Requirements
- **Node.js**: 18.0.0 or higher
- **Python**: 3.8 or higher
- **npm**: 8.0.0 or higher
- **pip**: 21.0.0 or higher
- **Git**: 2.30.0 or higher
- **Firebase CLI**: Latest version

### Hardware Requirements (Optional)
- ESP32-CAM module
- MQ2 Gas Sensor
- MQ135 Air Quality Sensor
- DHT11/DHT22 Temperature/Humidity Sensor
- Flame Sensor
- PIR Motion Sensor

### Operating System
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+, Debian 10+)

---

## Installation Steps

### 1. Install Prerequisites

#### Node.js and npm
```bash
# Download from https://nodejs.org/
# Or use package manager:

# Windows (using Chocolatey)
choco install nodejs

# macOS (using Homebrew)
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Python and pip
```bash
# Download from https://python.org/
# Or use package manager:

# Windows (using Chocolatey)
choco install python

# macOS (using Homebrew)
brew install python@3.11

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install python3 python3-pip
```

#### Firebase CLI
```bash
npm install -g firebase-tools
```

#### Git
```bash
# Download from https://git-scm.com/
# Or use package manager

# Windows (using Chocolatey)
choco install git

# macOS (using Homebrew)
brew install git

# Linux (Ubuntu/Debian)
sudo apt-get install git
```

---

### 2. Clone Repository

```bash
git clone <repository-url>
cd ronin
```

---

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment
```bash
cp .env.example .env
```

Edit `frontend/.env`:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=ronin-80b29.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://ronin-80b29-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=ronin-80b29
VITE_FIREBASE_STORAGE_BUCKET=ronin-80b29.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ESP32-CAM Configuration
VITE_ESP32_BASE_URL=http://192.168.1.18
VITE_ESP32_STREAM_ENDPOINT=/
VITE_ESP32_CAPTURE_ENDPOINT=/capture

# Computer Vision Backend
VITE_CV_BACKEND_URL=http://localhost:5000

# Gemini AI API (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

### 4. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements_cv.txt
```

#### Optional: Install Face Recognition
```bash
# Requires CMake
pip install dlib
pip install face-recognition
```

#### Configure Environment
Backend `.env` is pre-configured:
```env
ESP32_CAM_URL=http://192.168.1.18:81
```

#### Add Known Faces (Optional)
```bash
# Place face images in backend/known_faces/
# Format: PersonName.jpg
# Example: John_Doe.jpg, Jane_Smith.jpg
```

---

### 5. Firebase Setup

#### Login to Firebase
```bash
firebase login
```

#### Initialize Project (if needed)
```bash
firebase init
# Select: Database, Hosting
# Use existing project: ronin-80b29
```

#### Deploy Database Rules
```bash
firebase deploy --only database
```

---

### 6. Verify Installation

#### Check Node.js
```bash
node --version
# Should show v18.0.0 or higher
```

#### Check Python
```bash
python --version
# Should show Python 3.8.0 or higher
```

#### Check Firebase CLI
```bash
firebase --version
# Should show latest version
```

#### Check Frontend Dependencies
```bash
cd frontend
npm list --depth=0
# Should show all dependencies installed
```

#### Check Backend Dependencies
```bash
cd backend
pip list | grep -E "flask|opencv|numpy"
# Should show Flask, opencv-python, numpy
```

---

### 7. Start Services

#### Start Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.4.19  ready in 1061 ms
➜  Local:   http://localhost:8080/
➜  Network: http://192.168.1.13:8080/
```

#### Start Backend
```bash
cd backend
python start_cv_backend.py
```

Expected output:
```
🚀 AROHAN CV Backend Startup
========================================
✅ All required packages are installed
📷 ESP32-CAM URL: http://192.168.1.18
🎯 Starting CV Backend...
 * Running on http://127.0.0.1:5000
```

---

### 8. Access Application

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## Post-Installation

### Create User Account
1. Navigate to http://localhost:8080
2. Click "Sign Up"
3. Enter email and password
4. Verify email (check inbox)
5. Login to dashboard

### Configure ESP32-CAM (Optional)
1. Update IP address in `.env` files
2. Test connection: `curl http://192.168.1.18:81/capture`
3. Restart services

### Add Firebase Service Account (Optional)
1. Download `serviceAccountKey.json` from Firebase Console
2. Place in `backend/` folder
3. Restart backend for Firebase Storage uploads

---

## Troubleshooting

### npm install fails
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### pip install fails
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with verbose output
pip install -r requirements_cv.txt -v
```

### Firebase login fails
```bash
# Logout and login again
firebase logout
firebase login --reauth
```

### Port already in use
```bash
# Frontend (8080)
# Kill process using port
lsof -ti:8080 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8080   # Windows

# Backend (5000)
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

---

## Next Steps

- [Configuration Guide](CONFIGURATION.md) - Advanced configuration
- [Architecture Overview](../architecture/SYSTEM_OVERVIEW.md) - System design
- [API Documentation](../api/FRONTEND_API.md) - API reference

---

## Uninstallation

### Remove Frontend
```bash
cd frontend
rm -rf node_modules dist
```

### Remove Backend
```bash
cd backend
pip uninstall -r requirements_cv.txt -y
```

### Remove Firebase CLI
```bash
npm uninstall -g firebase-tools
```

---

**Installation Complete!** Proceed to [Configuration Guide](CONFIGURATION.md) for advanced setup.
