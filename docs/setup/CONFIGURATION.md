# Configuration Guide

Complete configuration guide for AROHAN system.

---

## Environment Variables

### Frontend Configuration

**File**: `frontend/.env`

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
VITE_ESP32_CONTROL_ENDPOINT=/control

# Computer Vision Backend
VITE_CV_BACKEND_URL=http://localhost:5000

# Gemini AI API (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Backend Configuration

**File**: `backend/.env`

```env
# ESP32-CAM Configuration
ESP32_CAM_URL=http://192.168.1.18:81
```

---

## Firebase Configuration

### Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `ronin-80b29`
3. Click Settings (⚙️) → Project settings
4. Scroll to "Your apps" section
5. Click on Web app
6. Copy configuration values

### Firebase Services Setup

#### 1. Authentication
```
Firebase Console → Authentication → Sign-in method
→ Enable Email/Password
```

#### 2. Realtime Database
```
Firebase Console → Realtime Database → Create Database
→ Start in test mode (will be secured with rules)
→ Location: Choose nearest region
```

#### 3. Storage
```
Firebase Console → Storage → Get Started
→ Start in test mode
→ Will be used for snapshot uploads
```

#### 4. Hosting (Optional)
```
Firebase Console → Hosting → Get Started
→ Follow setup instructions
```

---

## Database Rules

**File**: `database.rules.json`

```json
{
  "rules": {
    "ronin": {
      ".read": "auth != null",
      ".write": "auth != null",
      
      "iot": {
        ".read": "auth != null",
        ".write": "auth != null",
        ".indexOn": ["hazardScore", "status/lastHeartbeat"]
      },
      
      "rover": {
        ".read": "auth != null",
        ".write": "auth != null"
      },
      
      "alerts": {
        ".read": "auth != null",
        ".write": "auth != null",
        ".indexOn": ["timestamp", "severity", "resolved"]
      },
      
      "history": {
        ".read": "auth != null",
        ".write": "auth != null",
        ".indexOn": ["timestamp", "riskLevel"]
      },
      
      "settings": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

**Deploy Rules**:
```bash
firebase deploy --only database
```

---

## ESP32-CAM Configuration

### Network Setup

1. **Connect ESP32-CAM to WiFi**:
   ```cpp
   const char* ssid = "Your_WiFi_SSID";
   const char* password = "Your_WiFi_Password";
   ```

2. **Find ESP32-CAM IP Address**:
   ```bash
   # Check serial monitor or router DHCP table
   # Example: 192.168.1.18
   ```

3. **Update Configuration**:
   ```env
   # frontend/.env
   VITE_ESP32_BASE_URL=http://192.168.1.18
   
   # backend/.env
   ESP32_CAM_URL=http://192.168.1.18:81
   ```

### Camera Endpoints

- **Stream**: `http://192.168.1.18:81/`
- **Capture**: `http://192.168.1.18:81/capture`
- **Control**: `http://192.168.1.18:81/control`

---

## Sensor Configuration

### Threshold Settings

Configure in Firebase Console at `/ronin/settings/thresholds`:

```json
{
  "mq2": {
    "warning": 500,
    "danger": 700
  },
  "mq135": {
    "threshold": 1
  },
  "temperature": {
    "warning": 30,
    "danger": 35
  },
  "hazardScore": {
    "warning": 30,
    "danger": 60
  }
}
```

### Sensor Weights

Configure hazard score calculation weights:

```json
{
  "weights": {
    "mq2": 0.3,
    "mq135": 0.6,
    "temperature": 0.1
  }
}
```

---

## Face Recognition Setup

### Add Known Faces

1. **Prepare Images**:
   - Clear, front-facing photos
   - Good lighting
   - One face per image
   - Format: JPG

2. **Name Format**:
   ```
   FirstName_LastName.jpg
   Example: John_Doe.jpg, Jane_Smith.jpg
   ```

3. **Add to Backend**:
   ```bash
   # Copy images to:
   backend/known_faces/
   ```

4. **Restart Backend**:
   ```bash
   cd backend
   python start_cv_backend.py
   ```

---

## Production Configuration

### Frontend Production Build

```bash
cd frontend
npm run build
```

**Output**: `frontend/dist/`

### Environment Variables for Production

```env
# Use production Firebase project
VITE_FIREBASE_PROJECT_ID=ronin-80b29-prod

# Use production backend URL
VITE_CV_BACKEND_URL=https://api.yourdomain.com

# Use production ESP32-CAM URL
VITE_ESP32_BASE_URL=https://camera.yourdomain.com
```

### Backend Production Configuration

```python
# Use production settings
DEBUG = False
HOST = '0.0.0.0'
PORT = 5000

# Use HTTPS
SSL_CERT = '/path/to/cert.pem'
SSL_KEY = '/path/to/key.pem'
```

---

## Security Configuration

### CORS Settings

**Backend** (`backend/cv_backend.py`):
```python
from flask_cors import CORS

# Development
CORS(app)

# Production
CORS(app, origins=[
    'https://yourdomain.com',
    'https://ronin-80b29.web.app'
])
```

### Firebase Security Rules

**Restrict by User**:
```json
{
  "rules": {
    "ronin": {
      "users": {
        "$uid": {
          ".read": "$uid === auth.uid",
          ".write": "$uid === auth.uid"
        }
      }
    }
  }
}
```

---

## Performance Configuration

### Frontend Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/database'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
});
```

### Backend Optimization

```python
# Limit snapshot storage
MAX_SNAPSHOTS = 100

# Cleanup old snapshots
def cleanup_old_snapshots():
    snapshots = sorted(os.listdir('static/snapshots'))
    if len(snapshots) > MAX_SNAPSHOTS:
        for snapshot in snapshots[:-MAX_SNAPSHOTS]:
            os.remove(f'static/snapshots/{snapshot}')
```

---

## Monitoring Configuration

### Firebase Analytics

```typescript
// Enable analytics
import { getAnalytics } from 'firebase/analytics';
const analytics = getAnalytics(app);
```

### Backend Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
```

---

## Backup Configuration

### Database Backup

```bash
# Export Firebase data
firebase database:get / > backup.json

# Import Firebase data
firebase database:set / backup.json
```

### Snapshot Backup

```bash
# Backup snapshots
tar -czf snapshots-backup.tar.gz backend/static/snapshots/

# Restore snapshots
tar -xzf snapshots-backup.tar.gz -C backend/static/
```

---

## Advanced Configuration

### Custom Domain Setup

1. **Firebase Hosting**:
   ```bash
   firebase hosting:channel:deploy production
   ```

2. **Add Custom Domain**:
   ```
   Firebase Console → Hosting → Add custom domain
   → Follow DNS configuration steps
   ```

### SSL Certificate

```bash
# Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

---

## Configuration Checklist

- [ ] Frontend `.env` configured
- [ ] Backend `.env` configured
- [ ] Firebase credentials added
- [ ] Database rules deployed
- [ ] ESP32-CAM IP configured
- [ ] Sensor thresholds set
- [ ] Known faces added (optional)
- [ ] CORS configured
- [ ] Security rules reviewed
- [ ] Backup strategy implemented

---

## Related Documentation

- [Installation Guide](INSTALLATION.md)
- [Quick Start](QUICK_START.md)
- [System Overview](../architecture/SYSTEM_OVERVIEW.md)
- [Troubleshooting](../troubleshooting/COMMON_ISSUES.md)

---

**Last Updated**: February 28, 2026  
**Version**: 1.0.0
