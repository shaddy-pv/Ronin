# Common Issues and Solutions

Frequently encountered problems and their solutions.

---

## Frontend Issues

### Issue: "No Data in Firebase" Message

**Symptoms**:
- Dashboard shows "No Data in Firebase" message
- Data exists in Firebase Console
- Works after login but not after page refresh

**Causes**:
1. Wrong Firebase path in code
2. Authentication race condition
3. Firebase rules not deployed

**Solutions**:

```bash
# 1. Verify Firebase path
# Check if data is at /ronin/iot or /arohan/iot in Firebase Console

# 2. Deploy Firebase rules
firebase deploy --only database

# 3. Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (macOS)

# 4. Clear browser cache
# Chrome: Settings → Privacy → Clear browsing data
```

**Prevention**:
- Always deploy rules after changes
- Use correct Firebase path in code
- Wait for auth state before fetching data

---

### Issue: Frontend Won't Start

**Symptoms**:
```
Error: Cannot find module 'vite'
npm ERR! code ELIFECYCLE
```

**Solutions**:

```bash
# Solution 1: Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

# Solution 2: Clear npm cache
npm cache clean --force
npm install

# Solution 3: Check Node.js version
node --version
# Should be 18.0.0 or higher

# Solution 4: Update npm
npm install -g npm@latest
```

---

### Issue: Permission Denied in Firebase

**Symptoms**:
```
Error: permission_denied at /ronin/iot
Status: 403 Forbidden
```

**Causes**:
1. Firebase rules not deployed
2. User not authenticated
3. Wrong Firebase project

**Solutions**:

```bash
# 1. Deploy rules
firebase deploy --only database

# 2. Check authentication
# Browser console:
firebase.auth().currentUser
# Should show user object, not null

# 3. Verify Firebase project
firebase use
# Should show: ronin-80b29

# 4. Login again
# Logout and login in the app
```

---

### Issue: Charts Not Updating

**Symptoms**:
- Dashboard loads but charts don't update
- Data is stale

**Solutions**:

```bash
# 1. Check browser console for errors
# F12 → Console

# 2. Check Network tab
# F12 → Network → Filter: firebaseio
# Look for 200 OK responses

# 3. Verify Firebase connection
# Check FirebaseConnectionStatus component

# 4. Restart frontend
cd frontend
npm run dev
```

---

## Backend Issues

### Issue: Backend Won't Start

**Symptoms**:
```
ModuleNotFoundError: No module named 'cv2'
ImportError: No module named 'flask'
```

**Solutions**:

```bash
# Solution 1: Install dependencies
cd backend
pip install -r requirements_cv.txt

# Solution 2: Upgrade pip
python -m pip install --upgrade pip
pip install -r requirements_cv.txt

# Solution 3: Use virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
pip install -r requirements_cv.txt

# Solution 4: Check Python version
python --version
# Should be 3.8.0 or higher
```

---

### Issue: Face Recognition Not Working

**Symptoms**:
```
⚠️ face_recognition library not available
Using basic detection only
```

**Cause**:
- face_recognition library not installed
- Requires dlib (which requires CMake)

**Solutions**:

```bash
# Windows
# 1. Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/

# 2. Install CMake
choco install cmake

# 3. Install dlib and face_recognition
pip install dlib
pip install face-recognition

# macOS
brew install cmake
pip install dlib
pip install face-recognition

# Linux (Ubuntu/Debian)
sudo apt-get install build-essential cmake
pip install dlib
pip install face-recognition
```

**Alternative**:
- System works with basic OpenCV detection
- face_recognition is optional for advanced features

---

### Issue: ESP32-CAM Connection Failed

**Symptoms**:
```
Error: Failed to connect to ESP32-CAM
Connection refused
```

**Solutions**:

```bash
# 1. Check ESP32-CAM IP address
ping 192.168.1.18

# 2. Test camera endpoint
curl http://192.168.1.18:81/capture

# 3. Update .env files
# backend/.env
ESP32_CAM_URL=http://192.168.1.18:81

# frontend/.env
VITE_ESP32_BASE_URL=http://192.168.1.18

# 4. Ensure same network
# ESP32-CAM and computer must be on same WiFi

# 5. Check ESP32-CAM power
# Ensure adequate power supply (5V, 2A recommended)
```

---

## Firebase Issues

### Issue: Firebase Login Fails

**Symptoms**:
```
Error: auth/invalid-email
Error: auth/user-not-found
Error: auth/wrong-password
```

**Solutions**:

```bash
# 1. Verify email format
# Must be valid email: user@example.com

# 2. Check Firebase Console
# https://console.firebase.google.com/project/ronin-80b29/authentication
# Verify user exists

# 3. Reset password
# Use "Forgot Password" link

# 4. Check Firebase configuration
# Verify .env file has correct credentials

# 5. Enable Email/Password auth
# Firebase Console → Authentication → Sign-in method
# Enable Email/Password
```

---

### Issue: Database Rules Deployment Fails

**Symptoms**:
```
Error: HTTP Error: 401, Unauthorized
Error: Permission denied
```

**Solutions**:

```bash
# 1. Login to Firebase
firebase logout
firebase login

# 2. Select correct project
firebase use ronin-80b29

# 3. Check rules syntax
# Validate database.rules.json

# 4. Deploy with force
firebase deploy --only database --force

# 5. Check Firebase permissions
# Ensure you have Editor/Owner role in Firebase Console
```

---

## Authentication Issues

### Issue: User Not Authenticated After Refresh

**Symptoms**:
- Login works
- Page refresh logs user out
- "User not authenticated" in console

**Cause**:
- Auth state not persisted
- Race condition on page load

**Solutions**:

```bash
# 1. Check browser storage
# F12 → Application → IndexedDB → firebaseLocalStorageDb
# Should contain authUser

# 2. Clear browser data and re-login
# Settings → Privacy → Clear browsing data

# 3. Check auth persistence
# Should be using LOCAL persistence (default)

# 4. Verify code waits for auth
# useIoTReadings should use onAuthStateChanged
```

---

## Network Issues

### Issue: CORS Errors

**Symptoms**:
```
Access to fetch at 'http://localhost:5000' blocked by CORS policy
```

**Solutions**:

```bash
# 1. Verify Flask-CORS installed
pip list | grep Flask-CORS

# 2. Check backend CORS configuration
# backend/cv_backend.py should have:
# CORS(app)

# 3. Restart backend
cd backend
python start_cv_backend.py

# 4. Check browser console
# Verify Origin header matches
```

---

### Issue: Port Already in Use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::8080
Error: Address already in use: 5000
```

**Solutions**:

```bash
# Frontend (Port 8080)
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8080 | xargs kill -9

# Backend (Port 5000)
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

---

## Performance Issues

### Issue: Slow Dashboard Loading

**Symptoms**:
- Dashboard takes >5 seconds to load
- Charts lag
- Slow response

**Solutions**:

```bash
# 1. Check network speed
# F12 → Network → Check request times

# 2. Clear browser cache
Ctrl+Shift+Delete

# 3. Optimize Firebase queries
# Use indexOn in database rules

# 4. Check Firebase quota
# Firebase Console → Usage tab

# 5. Build for production
cd frontend
npm run build
npm run preview
```

---

### Issue: High Memory Usage

**Symptoms**:
- Browser tab uses >500MB RAM
- Backend uses >500MB RAM
- System slowdown

**Solutions**:

```bash
# Frontend
# 1. Close unused tabs
# 2. Disable browser extensions
# 3. Use production build

# Backend
# 1. Limit snapshot storage
# 2. Clear old snapshots
cd backend/static/snapshots
# Delete old files

# 3. Restart backend periodically
```

---

## Data Issues

### Issue: Sensor Data Not Updating

**Symptoms**:
- Dashboard shows old data
- Timestamp not changing
- IoT status: OFFLINE

**Solutions**:

```bash
# 1. Check ESP32-CAM connection
ping 192.168.1.18

# 2. Verify Firebase write permissions
# Check database.rules.json

# 3. Check ESP32-CAM code
# Ensure it's writing to /ronin/iot

# 4. Monitor Firebase Console
# https://console.firebase.google.com/project/ronin-80b29/database
# Watch for real-time updates

# 5. Check ESP32-CAM logs
# Serial monitor for error messages
```

---

### Issue: Historical Data Missing

**Symptoms**:
- History page shows no data
- Charts have no historical points

**Cause**:
- History logging not enabled
- Data not being written to /ronin/history

**Solutions**:

```bash
# 1. Check Firebase Console
# Navigate to /ronin/history
# Verify data exists

# 2. Enable history logging
# Check clientMonitoring service

# 3. Manually add test data
# Use Firebase Console to add sample history entry

# 4. Check history retention
# Old data may be auto-deleted
```

---

## Build Issues

### Issue: Production Build Fails

**Symptoms**:
```
npm run build
Error: Build failed
```

**Solutions**:

```bash
# 1. Check for TypeScript errors
npm run lint

# 2. Clear build cache
rm -rf frontend/dist
rm -rf frontend/.vite

# 3. Reinstall dependencies
cd frontend
rm -rf node_modules
npm install

# 4. Build with verbose output
npm run build -- --debug

# 5. Check disk space
df -h  # Linux/macOS
```

---

## Quick Diagnostic Commands

```bash
# Check all services
curl http://localhost:8080        # Frontend
curl http://localhost:5000/health # Backend
firebase projects:list            # Firebase

# Check logs
# Frontend: Browser console (F12)
# Backend: Terminal output

# Check Firebase connection
# Browser console:
firebase.auth().currentUser
firebase.database().ref('/ronin/iot').once('value')

# Check environment
node --version
python --version
firebase --version
npm --version
```

---

## Getting Help

If issues persist:

1. Check [Debug Guide](DEBUG_GUIDE.md)
2. Review [FAQ](FAQ.md)
3. Check [System Overview](../architecture/SYSTEM_OVERVIEW.md)
4. Contact development team

---

**Last Updated**: February 28, 2026  
**Version**: 1.0.0
