# AROHAN CV Backend - Face Recognition Service

**Purpose**: Computer Vision backend for ESP32-CAM face recognition and accident detection

---

## 🚀 Quick Start

### 1. Install Requirements
```bash
pip install -r requirements_cv.txt
```

### 2. Setup Known Faces
Place face images in `known_faces/` folder:
- Format: `PersonName.jpg` (e.g., `John_Doe.jpg`)
- One face per image
- Clear, front-facing photos

### 3. Configure ESP32-CAM URL
```bash
# Set environment variable
export ESP32_CAM_URL=http://192.168.1.18:81

# Or edit .env file
echo "ESP32_CAM_URL=http://192.168.1.18:81" > .env
```

### 4. Run Backend
```bash
python start_cv_backend.py
```

Backend will start on `http://localhost:5000`

---

## 📡 API Endpoints

### Analyze Frame
```bash
POST /analyze-frame
Body: { "source": "esp32" }
```

### Get Alerts
```bash
GET /alerts
```

### Health Check
```bash
GET /health
```

---

## 🔧 Features

- ✅ **Face Recognition** using `face_recognition` library
- ✅ **Firebase Integration** (optional) - uploads snapshots
- ✅ **Accident Detection** - basic scene analysis
- ✅ **Alert System** - stores and retrieves alerts
- ✅ **Snapshot Storage** - saves images locally and to Firebase

---

## 📁 File Structure

```
backend/
├── cv_backend.py           # Main CV backend service
├── start_cv_backend.py     # Startup script
├── requirements_cv.txt     # Python dependencies
├── known_faces/            # Known face images
├── static/snapshots/       # Saved snapshots
└── .env                    # Environment variables
```

---

## 🔑 Environment Variables

- `ESP32_CAM_URL` - ESP32-CAM base URL (default: http://192.168.1.18:81)

---

## 📦 Dependencies

- `flask` - Web framework
- `flask-cors` - CORS support
- `opencv-python` - Computer vision
- `face-recognition` - Face recognition
- `firebase-admin` - Firebase integration (optional)
- `numpy` - Numerical operations
- `requests` - HTTP requests

---

## 🎯 Usage

### From Frontend
The frontend automatically calls the CV backend when analyzing camera feeds.

### Manual Testing
```bash
# Check health
curl http://localhost:5000/health

# Analyze frame
curl -X POST http://localhost:5000/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{"source": "esp32"}'

# Get alerts
curl http://localhost:5000/alerts
```

---

## 🔒 Firebase Setup (Optional)

1. Download `serviceAccountKey.json` from Firebase Console
2. Place in backend folder or parent directory
3. Backend will automatically detect and use it

**Without Firebase**: Snapshots saved locally only

---

## ⚠️ Troubleshooting

### Face recognition not working
```bash
# Install dlib (required for face_recognition)
pip install dlib
```

### ESP32-CAM connection failed
- Check ESP32-CAM IP address
- Ensure ESP32-CAM is on same network
- Try accessing `http://192.168.1.18:81/capture` in browser

### Firebase not working
- Check `serviceAccountKey.json` exists
- Verify Firebase project configuration
- Backend works without Firebase (local storage only)

---

## 📝 Notes

- Face recognition requires good lighting
- Known faces should be clear, front-facing photos
- Snapshots are saved to `static/snapshots/`
- Alerts are stored in memory (restart clears them)
- Firebase integration is optional but recommended

---

**Status**: ✅ Production Ready
