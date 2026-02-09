#!/usr/bin/env python3
"""
Face Detection Diagnostic Tool
Tests why face detection might not be working
"""

import cv2
import numpy as np
import requests
from pathlib import Path

print("🔍 AROHAN Face Detection Diagnostic Tool")
print("=" * 50)

# Test 1: Check OpenCV Installation
print("\n1️⃣ Testing OpenCV Installation...")
try:
    print(f"   ✅ OpenCV version: {cv2.__version__}")
except Exception as e:
    print(f"   ❌ OpenCV error: {e}")
    exit(1)

# Test 2: Check Face Cascade
print("\n2️⃣ Testing Face Detection Cascade...")
try:
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    if face_cascade.empty():
        print("   ❌ Face cascade failed to load")
        exit(1)
    else:
        print("   ✅ Face cascade loaded successfully")
except Exception as e:
    print(f"   ❌ Cascade error: {e}")
    exit(1)

# Test 3: Check ESP32-CAM Connection
print("\n3️⃣ Testing ESP32-CAM Connection...")
esp32_urls = [
    "http://192.168.1.18:81/capture",
    "http://192.168.1.18/capture"
]

frame = None
working_url = None

for url in esp32_urls:
    try:
        print(f"   Trying: {url}")
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            img_array = np.frombuffer(response.content, np.uint8)
            frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            if frame is not None:
                print(f"   ✅ Connected to ESP32-CAM at {url}")
                print(f"   📐 Frame size: {frame.shape}")
                working_url = url
                break
    except Exception as e:
        print(f"   ❌ Failed: {e}")

if frame is None:
    print("\n❌ PROBLEM: Cannot connect to ESP32-CAM")
    print("\n🔧 SOLUTIONS:")
    print("   1. Check ESP32-CAM is powered on")
    print("   2. Verify IP address (current: 192.168.1.18)")
    print("   3. Ensure ESP32-CAM is on same network")
    print("   4. Try accessing http://192.168.1.18:81/capture in browser")
    exit(1)

# Test 4: Test Face Detection on Captured Frame
print("\n4️⃣ Testing Face Detection on Captured Frame...")
try:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Try different detection parameters
    print("\n   Testing with different parameters:")
    
    # Standard parameters
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )
    print(f"   Standard (1.1, 5, 30): {len(faces)} faces")
    
    # More sensitive
    faces_sensitive = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.05,
        minNeighbors=3,
        minSize=(20, 20)
    )
    print(f"   Sensitive (1.05, 3, 20): {len(faces_sensitive)} faces")
    
    # Less sensitive
    faces_strict = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=7,
        minSize=(50, 50)
    )
    print(f"   Strict (1.2, 7, 50): {len(faces_strict)} faces")
    
    if len(faces) > 0:
        print(f"\n   ✅ Face detection WORKING! Found {len(faces)} face(s)")
        for i, (x, y, w, h) in enumerate(faces):
            print(f"      Face {i+1}: x={x}, y={y}, w={w}, h={h}")
    elif len(faces_sensitive) > 0:
        print(f"\n   ⚠️ Face detected with SENSITIVE settings: {len(faces_sensitive)} face(s)")
        print("   💡 TIP: Adjust detection parameters in cv_backend.py")
    else:
        print("\n   ❌ NO FACES DETECTED")
        
except Exception as e:
    print(f"   ❌ Detection error: {e}")

# Test 5: Image Quality Analysis
print("\n5️⃣ Analyzing Image Quality...")
try:
    # Check brightness
    mean_brightness = np.mean(gray)
    print(f"   Brightness: {mean_brightness:.1f}/255")
    
    if mean_brightness < 50:
        print("   ⚠️ Image is too DARK - increase lighting")
    elif mean_brightness > 200:
        print("   ⚠️ Image is too BRIGHT - reduce lighting")
    else:
        print("   ✅ Brightness is good")
    
    # Check blur
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    print(f"   Sharpness: {laplacian_var:.1f}")
    
    if laplacian_var < 100:
        print("   ⚠️ Image is BLURRY - check camera focus")
    else:
        print("   ✅ Image sharpness is good")
    
    # Check contrast
    contrast = gray.std()
    print(f"   Contrast: {contrast:.1f}")
    
    if contrast < 30:
        print("   ⚠️ Low contrast - improve lighting conditions")
    else:
        print("   ✅ Contrast is good")
        
except Exception as e:
    print(f"   ❌ Analysis error: {e}")

# Test 6: Save Test Image
print("\n6️⃣ Saving Test Images...")
try:
    test_dir = Path('test_output')
    test_dir.mkdir(exist_ok=True)
    
    # Save original
    cv2.imwrite(str(test_dir / 'original.jpg'), frame)
    print(f"   ✅ Saved: test_output/original.jpg")
    
    # Save grayscale
    cv2.imwrite(str(test_dir / 'grayscale.jpg'), gray)
    print(f"   ✅ Saved: test_output/grayscale.jpg")
    
    # Draw detected faces
    frame_with_faces = frame.copy()
    for (x, y, w, h) in faces_sensitive:  # Use most sensitive detection
        cv2.rectangle(frame_with_faces, (x, y), (x+w, y+h), (0, 255, 0), 2)
    cv2.imwrite(str(test_dir / 'detected_faces.jpg'), frame_with_faces)
    print(f"   ✅ Saved: test_output/detected_faces.jpg")
    
except Exception as e:
    print(f"   ❌ Save error: {e}")

# Test 7: Check Known Faces
print("\n7️⃣ Checking Known Faces...")
known_faces_dir = Path('known_faces')
if known_faces_dir.exists():
    face_files = list(known_faces_dir.glob('*.jpg')) + list(known_faces_dir.glob('*.png'))
    print(f"   Found {len(face_files)} known face images:")
    for face_file in face_files:
        print(f"      - {face_file.name}")
    
    if len(face_files) == 0:
        print("   ⚠️ No known faces found - add face images to known_faces/")
else:
    print("   ⚠️ known_faces/ directory not found")

# Final Diagnosis
print("\n" + "=" * 50)
print("📊 DIAGNOSIS SUMMARY")
print("=" * 50)

issues = []
solutions = []

if frame is None:
    issues.append("❌ Cannot connect to ESP32-CAM")
    solutions.append("1. Check ESP32-CAM power and network connection")

if len(faces) == 0 and len(faces_sensitive) == 0:
    issues.append("❌ No faces detected in frame")
    solutions.append("2. Ensure person is facing camera directly")
    solutions.append("3. Improve lighting conditions")
    solutions.append("4. Move closer to camera (30cm - 2m distance)")
    solutions.append("5. Check camera focus and cleanliness")

if mean_brightness < 50:
    issues.append("⚠️ Image too dark")
    solutions.append("6. Add more lighting to the scene")

if laplacian_var < 100:
    issues.append("⚠️ Image too blurry")
    solutions.append("7. Clean camera lens")
    solutions.append("8. Adjust camera focus")

if len(faces_sensitive) > 0 and len(faces) == 0:
    issues.append("⚠️ Faces detected only with sensitive settings")
    solutions.append("9. Adjust detection parameters in cv_backend.py:")
    solutions.append("   scaleFactor=1.05, minNeighbors=3, minSize=(20, 20)")

if len(issues) == 0:
    print("\n✅ ALL TESTS PASSED!")
    print("   Face detection should be working correctly")
else:
    print("\n🔧 ISSUES FOUND:")
    for issue in issues:
        print(f"   {issue}")
    
    print("\n💡 RECOMMENDED SOLUTIONS:")
    for solution in solutions:
        print(f"   {solution}")

print("\n📁 Check test_output/ folder for captured images")
print("=" * 50)
