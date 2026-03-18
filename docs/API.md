# CV Backend API Reference

**Base URL**: `http://localhost:5000`

## Endpoints

### GET /
**Description**: Service information

**Response**:
```json
{
  "service": "AROHAN CV Backend FINAL"
}
```

---

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

---

### GET /stream-annotated
**Description**: MJPEG stream with face detection boxes

**Response**: `multipart/x-mixed-replace; boundary=frame`

**Headers**:
- `Content-Type: multipart/x-mixed-replace; boundary=frame`
- `Cache-Control: no-cache`
- `Access-Control-Allow-Origin: *`

**Usage**:
```html
<img src="http://localhost:5000/stream-annotated" />
```

---

### GET /stream-raw
**Description**: Raw MJPEG stream from ESP32 (proxy)

**Response**: `multipart/x-mixed-replace; boundary=frame`

**Usage**:
```html
<img src="http://localhost:5000/stream-raw" />
```

---

### GET /annotated-frame
**Description**: Single annotated JPEG frame

**Response**: `image/jpeg`

**Usage**:
```javascript
fetch('http://localhost:5000/annotated-frame')
  .then(res => res.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    img.src = url;
  });
```

---

### POST /analyze-frame
**Description**: Analyze single frame and return JSON

**Request**:
```json
{
  "source": "esp32" | "base64",
  "image": "data:image/jpeg;base64,/9j/4AAQ..."  // if source=base64
}
```

**Response**:
```json
{
  "status": "success",
  "faces_detected": 2,
  "faces": [
    {
      "x": 100,
      "y": 150,
      "w": 80,
      "h": 80,
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

**Error Response**:
```json
{
  "error": "no frame"
}
```

---

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

---

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

---

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

---

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

**Error Response**:
```json
{
  "error": "no face detected"
}
```

---

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

---

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

---

### GET /static/snapshots/{filename}
**Description**: Serve snapshot images

**Response**: `image/jpeg`

**Example**: `http://localhost:5000/static/snapshots/snap_1710691200.jpg`

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (missing parameters) |
| 500 | Internal Server Error |

## CORS

All endpoints support CORS with `Access-Control-Allow-Origin: *`

---

**Next**: [Setup Guide](./SETUP.md)
