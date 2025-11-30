# 🔧 Face Detection Troubleshooting Guide

## ❌ Problem: Face Not Detected

### 🔍 Quick Diagnosis

Run the diagnostic tool:
```bash
python test_face_detection.py
```

This will automatically check:
- ✅ OpenCV installation
- ✅ Face cascade loading
- ✅ ESP32-CAM connection
- ✅ Face detection with different parameters
- ✅ Image quality (brightness, blur, contrast)
- ✅ Known faces setup

---

## 🎯 Common Issues & Solutions

### 1. ESP32-CAM Connection Failed

**Symptoms**:
- "Failed to fetch ESP32-CAM frame"
- "ESP32 connection failed"

**Solutions**:
```bash
# Check ESP32-CAM is accessible
curl http://192.168.1.18:81/capture --output test.jpg

# If fails, try without port
curl http://192.168.1.18/capture --output test.jpg
```

**Fixes**:
- ✅ Verify ESP32-CAM is powered on
- ✅ Check IP address (might have changed)
- ✅ Ensure on same WiFi network
- ✅ Try accessing in browser: `http://192.168.1.18:81/capture`
- ✅ Update ESP32_CAM_URL in `.env` file

---

### 2. No Faces Detected (Image Quality)

**Symptoms**:
- "No faces detected in frame"
- Backend returns no alerts

**Common Causes**:

#### A. Poor Lighting
```
Too Dark (< 50 brightness)  → Add more light
Too Bright (> 200)          → Reduce light/glare
```

**Fix**: Ensure even, moderate lighting on face

#### B. Blurry Image
```
Sharpness < 100 → Image is blurry
```

**Fix**:
- Clean camera lens
- Adjust camera focus
- Reduce camera shake
- Ensure person is still

#### C. Wrong Distance
```
Too Close (< 30cm)  → Move back
Too Far (> 3m)      → Move closer
```

**Optimal**: 50cm - 2m from camera

#### D. Face Angle
```
Profile view    → Won't detect
Looking down    → Won't detect
Looking away    → Won't detect
```

**Fix**: Face camera directly, front-facing

---

### 3. Detection Parameters Too Strict

**Symptoms**:
- Faces visible but not detected
- Works sometimes but not always

**Solution**: Already fixed in updated `cv_backend.py`

The code now tries TWO detection passes:
1. **Standard**: `scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)`
2. **Sensitive**: `scaleFactor=1.05, minNeighbors=3, minSize=(20, 20)`

If still not working, manually adjust in `cv_backend.py`:
```python
faces = self.face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.03,  # Lower = more sensitive (1.01-1.5)
    minNeighbors=2,    # Lower = more detections (1-10)
    minSize=(15, 15)   # Smaller = detect smaller faces
)
```

---

### 4. Known Faces Not Recognized

**Symptoms**:
- Faces detected but marked as "Unknown"
- Should recognize but doesn't

**Solutions**:

#### A. Add Known Faces
```bash
# Place face images in known_faces/ folder
# Format: PersonName.jpg (e.g., John_Doe.jpg)
```

**Requirements**:
- ✅ Clear, front-facing photo
- ✅ Good lighting
- ✅ One face per image
- ✅ JPG or PNG format
- ✅ Minimum 100x100 pixels

#### B. Check face_recognition Library
```bash
# Install if missing
pip install face_recognition

# Or install with dlib
pip install dlib
pip install face_recognition
```

#### C. Retrain After Adding Faces
Restart the backend after adding new faces:
```bash
python start_cv_backend.py
```

---

### 5. Backend Not Running

**Symptoms**:
- Frontend can't connect to backend
- "CV Backend unavailable"

**Check**:
```bash
# Test backend health
curl http://localhost:5000/health

# Should return:
# {"status": "healthy", "opencv_ready": true, ...}
```

**Fix**:
```bash
# Start backend
python start_cv_backend.py

# Or with debug mode
python cv_backend.py
```

---

## 🧪 Testing Steps

### Step 1: Test ESP32-CAM Connection
```bash
# Should download an image
curl http://192.168.1.18:81/capture --output test.jpg

# Open test.jpg - should see camera feed
```

### Step 2: Run Diagnostic Tool
```bash
python test_face_detection.py

# Check test_output/ folder for:
# - original.jpg (raw camera feed)
# - grayscale.jpg (processed image)
# - detected_faces.jpg (faces marked with green boxes)
```

### Step 3: Test Backend API
```bash
# Start backend
python start_cv_backend.py

# In another terminal, test analyze
curl -X POST http://localhost:5000/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{"source": "esp32"}'

# Should return face detection results
```

### Step 4: Check Logs
Backend prints detailed logs:
```
✅ Face detected: KNOWN_FACE - Known person detected: John Doe
⚠️ No faces detected in frame
❌ Failed to fetch ESP32-CAM frame
```

---

## 📊 Image Quality Requirements

### Optimal Conditions
- **Lighting**: Even, moderate (brightness 80-180)
- **Distance**: 50cm - 2m from camera
- **Angle**: Front-facing, looking at camera
- **Focus**: Sharp, clear image
- **Background**: Simple, not cluttered
- **Movement**: Person should be still

### Minimum Requirements
- **Resolution**: 320x240 minimum
- **Brightness**: 50-200 (out of 255)
- **Sharpness**: > 100 (Laplacian variance)
- **Face Size**: Minimum 30x30 pixels in frame

---

## 🔧 Advanced Fixes

### Improve Detection Sensitivity

Edit `cv_backend.py`, line ~380:
```python
# More sensitive (detects more faces, more false positives)
faces = self.face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.03,  # 1.01-1.1 (lower = more sensitive)
    minNeighbors=2,    # 1-3 (lower = more detections)
    minSize=(15, 15)   # Smaller minimum face size
)

# Less sensitive (fewer false positives, might miss faces)
faces = self.face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.3,   # 1.2-1.5 (higher = less sensitive)
    minNeighbors=8,    # 7-10 (higher = stricter)
    minSize=(50, 50)   # Larger minimum face size
)
```

### Add Image Preprocessing

Already added in updated code:
```python
# Histogram equalization improves detection in poor lighting
gray = cv2.equalizeHist(gray)
```

Additional options:
```python
# Denoise
gray = cv2.fastNlMeansDenoising(gray)

# Increase contrast
gray = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
```

---

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] ESP32-CAM is powered on and accessible
- [ ] Can access `http://192.168.1.18:81/capture` in browser
- [ ] Backend is running (`python start_cv_backend.py`)
- [ ] Backend health check passes (`curl http://localhost:5000/health`)
- [ ] Person is facing camera directly
- [ ] Lighting is adequate (not too dark/bright)
- [ ] Distance is 50cm - 2m from camera
- [ ] Camera lens is clean
- [ ] Known faces are in `known_faces/` folder (if using recognition)
- [ ] Ran diagnostic tool (`python test_face_detection.py`)

---

## 📞 Quick Reference

### Test Commands
```bash
# 1. Test ESP32-CAM
curl http://192.168.1.18:81/capture --output test.jpg

# 2. Run diagnostics
python test_face_detection.py

# 3. Test backend
curl http://localhost:5000/health

# 4. Test face detection
curl -X POST http://localhost:5000/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{"source": "esp32"}'
```

### Log Locations
- Backend logs: Terminal output
- Test images: `test_output/` folder
- Snapshots: `static/snapshots/` folder

### Configuration
- ESP32-CAM URL: `.env` file or `ESP32_CAM_URL` environment variable
- Detection parameters: `cv_backend.py` line ~380
- Known faces: `known_faces/` folder

---

## 🎯 Most Common Solution

**90% of face detection issues are caused by**:
1. ❌ Poor lighting (too dark or too bright)
2. ❌ Wrong angle (not facing camera)
3. ❌ Wrong distance (too close or too far)

**Quick Fix**:
- ✅ Add more light
- ✅ Face camera directly
- ✅ Stand 1 meter from camera
- ✅ Run `python test_face_detection.py`

---

**Still not working?** Check `test_output/detected_faces.jpg` to see what the camera sees.
