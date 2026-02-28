# Quick Start Guide

Get AROHAN up and running in 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Git installed

---

## Step 1: Clone and Install

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
```

---

## Step 2: Configure Environment

### Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=ronin-80b29.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://ronin-80b29-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=ronin-80b29
VITE_FIREBASE_STORAGE_BUCKET=ronin-80b29.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

VITE_ESP32_BASE_URL=http://192.168.1.18
VITE_CV_BACKEND_URL=http://localhost:5000
```

### Backend Configuration

Backend `.env` is already configured:
```env
ESP32_CAM_URL=http://192.168.1.18:81
```

---

## Step 3: Deploy Firebase Rules

```bash
firebase login
firebase deploy --only database
```

---

## Step 4: Start Services

Open two terminals:

**Terminal 1 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend**:
```bash
cd backend
python start_cv_backend.py
```

---

## Step 5: Access Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## Step 6: Login

1. Open http://localhost:8080
2. Click "Sign Up" to create an account
3. Or login with existing credentials
4. Dashboard will load with real-time data

---

## Verify Installation

### Check Frontend
```bash
curl http://localhost:8080
# Should return HTML
```

### Check Backend
```bash
curl http://localhost:5000/health
# Should return: {"status":"healthy","opencv_ready":true,...}
```

### Check Firebase Connection
1. Open browser console (F12)
2. Look for: `[useIoTReadings] User authenticated, fetching data for: ...`
3. Check Network tab for Firebase requests (200 OK)

---

## Next Steps

- [Full Installation Guide](INSTALLATION.md) - Detailed setup instructions
- [Configuration Guide](CONFIGURATION.md) - Advanced configuration
- [Architecture Overview](../architecture/SYSTEM_OVERVIEW.md) - Understand the system

---

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend errors
```bash
cd backend
pip install --upgrade -r requirements_cv.txt
python start_cv_backend.py
```

### Firebase permission denied
```bash
firebase deploy --only database
# Then refresh browser
```

---

## Quick Commands Reference

```bash
# Start frontend
cd frontend && npm run dev

# Start backend
cd backend && python start_cv_backend.py

# Deploy Firebase rules
firebase deploy --only database

# Build for production
cd frontend && npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

**Need Help?** Check [Common Issues](../troubleshooting/COMMON_ISSUES.md) or [FAQ](../troubleshooting/FAQ.md)
