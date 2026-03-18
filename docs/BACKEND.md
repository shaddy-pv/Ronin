# CV Backend Documentation

## Overview

**Language**: Python 3.10+  
**Framework**: Flask 3.0.0  
**Port**: 5000  
**Main File**: `backend/cv_backend.py`

## Dependencies

```
flask==3.0.0                 # Web framework
flask-cors==4.0.0            # CORS support
opencv-contrib-python        # Computer vision (DNN + Haar)
numpy                        # Numerical operations
requests                     # HTTP client for ESP32
Pillow                       # Image processing
python-dotenv                # Environment variables
face-recognition             # FaceNet encodings (optional)
firebase-admin               # Firebase integration (optional)
```

## Architecture

### Key Classes

#### ESP32Reader
**Purpose**: Background thread for continuous frame reading from ESP32-CAM

**Strategy**:
1. Try MJPEG stream first (`/stream` endpoint)
2. Fall back to polling `/capture` endpoint if stream fails
3. Auto-discovery: scans local network if ESP32 unreachable

**Methods**:
- `start(url)` - Start reading thread
- `stop()` - Stop reading
- `frame()` - Get latest enhanced frame
- `raw_jpg()` - Get latest raw JPEG
- `update_url(url)` - Hot-swap ESP32 IP

**Features**:
- Automatic reconnection with exponential backoff
- Frame enhancement (CLAHE + gamma correction)
- Connection status tracking
- Frame counter

#### RecogWorker
**Purpose**: Background recognition thread (never blocks stream)

**Throttling**: `RECOG_MIN_INTERVAL = 0.05s` (max 20 FPS)

**Methods**:
- `start()` - Start worker thread
- `stop()` - Stop worker
- `get()` - Get latest annotated frame + results

**Process**:
1. Pick up latest frame from ESP32Reader
2. Run face detection
3. Run face recognition with quality filtering
4. Apply FaceTracker majority voting
5. Annotate frame with bounding boxes
6. Store result for stream consumption


#### FaceTracker
**Purpose**: IoU-based face tracking across frames

**Configuration**:
- `VOTE_WINDOW = 5` - Majority vote over 5 frames
- `IOU_THRESH = 0.20` - IoU threshold for track matching
- `TRACK_TTL = 2.5s` - Track expiration time

**Features**:
- Prevents recognition flickering on camera shake
- Assigns unique track IDs to faces
- Majority voting for stable name assignment
- Automatic track cleanup

**Methods**:
- `update(detections, raw_results)` - Update tracks with new detections
- `clear()` - Clear all tracks

#### EncodeCache
**Purpose**: LRU cache for face encodings

**Configuration**:
- Cache size: 128 entries
- Key: 8x8 downsampled face patch hash

**Features**:
- Reduces redundant encoding computation
- Stable across minor lighting changes
- Near-zero collision rate between different people

**Methods**:
- `get(img, rect)` - Retrieve cached encoding
- `put(img, rect, enc)` - Store encoding
- `clear()` - Clear cache

#### CVBackend
**Purpose**: Main application class

**Responsibilities**:
- Flask app initialization
- Face detection (DNN or Haar)
- Face recognition (FaceNet or LBP+HOG)
- Training pipeline
- Alert management
- Firebase integration
- Route definitions

## Recognition Pipeline

### 1. Frame Acquisition
```
ESP32Reader → _enhance() → Latest frame slot
```

### 2. Face Detection
```
detect_faces() → DNN (res10 SSD 300x300) or Haar cascade
→ List of bounding boxes [x, y, w, h]
```

**DNN Detection**:
- Model: res10_300x300_ssd.caffemodel
- Config: deploy.prototxt
- Confidence threshold: 0.35
- Min face size: 20x20 pixels

**Haar Detection** (fallback):
- Cascade: haarcascade_frontalface_default.xml
- Scale factor: 1.05
- Min neighbors: 5
- Min size: 40x40 pixels

### 3. Quality Filtering
```
_quality_ok() → Blur check + Size check + Aspect ratio check
```

**Criteria**:
- Minimum sharpness: 8.0 (Laplacian variance)
- Minimum size: 30x30 pixels
- Aspect ratio: 0.5 to 1.8 (roughly square)

### 4. Face Encoding
```
_encode_live() → FaceNet 128-dim or LBP+HOG+HSV
```

**FaceNet** (if face_recognition available):
- 128-dimensional encoding
- L2 distance matching
- Threshold: 0.55 (configurable)

**LBP+HOG+HSV** (fallback):
- Face resized to 64x64 pixels
- LBP histogram (32 bins × 16 cells)
- HSV histogram (32 bins × 3 channels)
- HOG (9 bins × 16 cells)
- Cosine similarity matching
- Threshold: 0.38 (configurable)

### 5. Matching
```
Vectorized distance/similarity → Best match → Confidence score
```

**FaceNet**:
```python
distances = np.linalg.norm(known_encodings - live_encoding, axis=1)
best_match = names[np.argmin(distances)]
confidence = max(0.0, 1.0 - min_distance)
```

**LBP+HOG**:
```python
similarities = normalized_known @ normalized_live
best_match = names[np.argmax(similarities)]
confidence = max_similarity
```

### 6. Tracking
```
FaceTracker.update() → 5-frame majority vote → Stable name
```

### 7. Annotation
```
annotate() → Draw bounding boxes + names + confidence
```

**Colors**:
- Green (0, 230, 0) - Known face
- Red (0, 0, 230) - Unknown face


## Training Pipeline

### 1. Image Loading
```
known_faces/person_name/*.jpg → PIL.Image → OpenCV BGR
```

**Folder Structure**:
```
known_faces/
├── shadan/
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── photo3.jpg
└── shivam/
    ├── photo1.jpg
    └── photo2.jpg
```

### 2. Enhancement
```
_enhance() → CLAHE + Gamma correction (once per image)
```

### 3. Face Detection
```
detect_faces() → Find largest face in image
```

### 4. Augmentation
```
Original image → 5 variants:
1. Original
2. Horizontal flip
3. Darker (-35 brightness)
4. Brighter (+35 brightness)
5. Slight blur (Gaussian 3x3)
```

**CRITICAL**: Augmentation happens AFTER enhancement, not before. This prevents double-processing artifacts.

### 5. Encoding
```
_encode_for_training() → NO quality gate (accepts all variants)
```

**Why no quality gate?**
- Augmented images (especially blur) are intentionally soft
- Quality gate was rejecting valid training data
- Result: Only 1-2 encodings per person → poor recognition

### 6. Storage
```
pickle.dump() → encodings.pkl
{
  'names': ['shadan', 'shadan', 'shivam', ...],
  'encodings': [enc1, enc2, enc3, ...],
  'mode': 'face_recognition' or 'lbp_hog',
  'trained_at': '2026-03-17T10:30:00',
  'num_people': 2,
  'num_encodings': 10
}
```

### 7. Matrix Building
```
enc_matrix = np.stack(encodings)  # For vectorized matching
```

## API Endpoints

### GET /
**Description**: Service information

**Response**:
```json
{
  "service": "AROHAN CV Backend FINAL"
}
```

### GET /health
**Description**: System health check

**Response**:
```json
{
  "status": "healthy",
  "detector": "dnn",
  "recognizer": "face_recognition",
  "known_faces": 2,
  "per_person_encodings": {
    "shadan": 5,
    "shivam": 5
  },
  "total_encodings": 10,
  "esp32_connected": true,
  "esp32_frames": 1234,
  "esp32_error": "",
  "threshold": 0.55
}
```

### GET /stream-annotated
**Description**: MJPEG stream with face detection boxes

**Response**: `multipart/x-mixed-replace; boundary=frame`

**Features**:
- Annotated frames with bounding boxes
- Name labels and confidence scores
- Face count overlay
- Auto-alert generation (5-second cooldown per person)

### GET /stream-raw
**Description**: Raw MJPEG stream from ESP32 (proxy)

**Response**: `multipart/x-mixed-replace; boundary=frame`

**Use Case**: Rover Console raw stream display

### GET /annotated-frame
**Description**: Single annotated JPEG frame

**Response**: `image/jpeg`

**Use Case**: Snapshot capture

### POST /analyze-frame
**Description**: Analyze single frame and return JSON

**Request**:
```json
{
  "source": "esp32" | "base64",
  "image": "base64_encoded_image"  // if source=base64
}
```

**Response**:
```json
{
  "status": "success",
  "faces_detected": 2,
  "faces": [
    {
      "x": 100, "y": 150, "w": 80, "h": 80,
      "name": "shadan",
      "confidence": 0.87,
      "is_known": true,
      "track_id": 1
    }
  ],
  "alerts": [...],
  "snapshot_url": "http://localhost:5000/static/snapshots/snap_1234.jpg"
}
```

### GET /alerts
**Description**: Get recent alerts (last 50)

**Response**:
```json
[
  {
    "id": "a_1710691200_0",
    "type": "KNOWN_FACE",
    "message": "Known: shadan",
    "createdAt": "2026-03-17T10:30:00",
    "confidence": 0.87,
    "snapshotUrl": "http://localhost:5000/static/snapshots/snap_1234.jpg",
    "meta": {
      "faces": 1,
      "box": {"x": 100, "y": 150, "w": 80, "h": 80}
    }
  }
]
```

### POST /alerts
**Description**: Add manual alert

**Request**:
```json
{
  "id": "alert_123",
  "type": "MANUAL",
  "message": "Test alert",
  "createdAt": "2026-03-17T10:30:00",
  "confidence": 1.0
}
```

**Response**:
```json
{
  "status": "ok",
  "id": "alert_123"
}
```


### POST /reload-faces
**Description**: Retrain face recognition model

**Response**:
```json
{
  "status": "ok",
  "known_people": ["shadan", "shivam"],
  "encodings": 10
}
```

**Use Case**: After adding new images to `known_faces/` folder

### POST /add-face
**Description**: Add new person at runtime

**Request**:
```json
{
  "name": "john",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response**:
```json
{
  "status": "ok",
  "name": "john",
  "known_people": ["shadan", "shivam", "john"],
  "encodings": 15
}
```

**Process**:
1. Decode base64 image
2. Enhance image
3. Detect face
4. Save to `known_faces/john/john_001.jpg`
5. Retrain model

### GET /known-faces
**Description**: List registered people

**Response**:
```json
{
  "known_people": ["shadan", "shivam"],
  "face_images": {
    "shadan": 3,
    "shivam": 2
  },
  "total_encodings": 10
}
```

### POST /update-esp32-url
**Description**: Hot-swap ESP32 IP address

**Request**:
```json
{
  "url": "http://192.168.1.50:81"
}
```

**Response**:
```json
{
  "status": "ok",
  "url": "http://192.168.1.50:81"
}
```

### GET /static/snapshots/{filename}
**Description**: Serve snapshot images

**Response**: `image/jpeg`

**Example**: `http://localhost:5000/static/snapshots/snap_1710691200.jpg`

## Configuration (.env)

```bash
# ESP32-CAM
ESP32_CAM_URL=http://192.168.1.22:81

# Backend
BACKEND_URL=http://localhost:5000
PORT=5000

# Face Recognition
FR_DISTANCE_THRESHOLD=0.55        # FaceNet L2 distance (0.0-1.0)
CONFIDENCE_THRESHOLD=0.38         # LBP cosine similarity (0.0-1.0)
BLUR_THRESHOLD=8.0                # Minimum sharpness
FACE_DETECTOR_MODE=dnn            # 'dnn' or 'haar'

# Limits
MAX_ALERTS=1000                   # Max alerts in memory
MAX_SNAPSHOTS=200                 # Max snapshot files

# Firebase (optional)
FIREBASE_CREDENTIALS=firebase-credentials.json
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
```

## Performance Tuning

### Recognition Speed
- **DNN detection**: 10-15 FPS
- **Haar detection**: 20-30 FPS
- **FaceNet encoding**: 15-20 FPS
- **LBP+HOG encoding**: 30-40 FPS

### Throttling
```python
RECOG_MIN_INTERVAL = 0.05  # 20 FPS max
```

**Why throttle?**
- Prevents CPU saturation
- Allows stream to remain smooth
- Reduces power consumption

### Memory Usage
- **Base**: 100-200 MB
- **Per person**: +5-10 MB (depends on encoding count)
- **Cache**: +10-20 MB (128 entries)

### Optimization Tips
1. Use DNN for accuracy, Haar for speed
2. Reduce face size for LBP (64px is optimal)
3. Increase `RECOG_MIN_INTERVAL` if CPU overloaded
4. Use FaceNet for best accuracy, LBP for no-dlib systems
5. Keep known_faces/ images under 1MB each

## Troubleshooting

### ESP32 Not Connecting
1. Check IP address: `ping 192.168.1.22`
2. Check port: `curl http://192.168.1.22:81/capture`
3. Enable auto-discovery: Backend will scan network
4. Check WiFi credentials on ESP32

### face_recognition Install Fails
1. Install cmake: `pip install cmake`
2. Install dlib: `pip install dlib`
3. If still fails, backend auto-falls back to LBP+HOG

### Wrong Person Recognized
1. Check training data: Need 3+ images per person
2. Retrain: `POST /reload-faces`
3. Adjust threshold: Lower `FR_DISTANCE_THRESHOLD`
4. Check lighting: Add images in different lighting

### Stream Lag
1. Reduce recognition FPS: Increase `RECOG_MIN_INTERVAL`
2. Use Haar instead of DNN: `FACE_DETECTOR_MODE=haar`
3. Check network: ESP32 should be on same LAN
4. Reduce ESP32 resolution: 640x480 is optimal

---

**Next**: [System Flow](./SYSTEM_FLOW.md)
