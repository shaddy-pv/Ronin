#!/usr/bin/env python3
"""
AROHAN Rover Computer Vision Backend
Provides face recognition and accident detection for ESP32-CAM feeds
"""

import os
import cv2
import json
import time
import requests
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Try to import Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials, storage, db
    FIREBASE_AVAILABLE = True
    print("✅ Firebase Admin SDK available")
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠️ Firebase Admin SDK not available - snapshots won't be uploaded to Firebase")

# Try to import face_recognition library
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
    print("✅ face_recognition library available")
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("⚠️ face_recognition library not available - using basic detection only")

# Configuration
ESP32_CAM_BASE_URL = os.getenv('ESP32_CAM_URL', 'http://192.168.1.18:81')
SNAPSHOTS_DIR = Path('static/snapshots')
KNOWN_FACES_DIR = Path('known_faces')
CONFIDENCE_THRESHOLD = 0.7
MAX_ALERTS = 1000

# Ensure directories exist
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
KNOWN_FACES_DIR.mkdir(parents=True, exist_ok=True)

@dataclass
class RoverAlert:
    id: str
    type: str  # KNOWN_FACE, UNKNOWN_FACE, ACCIDENT, SYSTEM
    message: str
    createdAt: str
    confidence: Optional[float] = None
    snapshotUrl: Optional[str] = None
    meta: Optional[Dict] = None

class CVBackend:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        
        self.alerts: List[RoverAlert] = []
        self.known_faces: Dict[str, np.ndarray] = {}
        self.face_cascade = None
        self.is_processing = False
        self.firebase_initialized = False
        
        # Initialize Firebase
        self._init_firebase()
        
        # Initialize OpenCV
        self._init_opencv()
        
        # Load known faces
        self._load_known_faces()
        
        # Setup routes
        self._setup_routes()
    
    def _init_firebase(self):
        """Initialize Firebase Admin SDK"""
        if not FIREBASE_AVAILABLE:
            return
        
        try:
            # Check if already initialized
            if firebase_admin._apps:
                print("✅ Firebase already initialized")
                self.firebase_initialized = True
                return
            
            # Look for service account key
            service_account_paths = [
                'serviceAccountKey.json',
                '../serviceAccountKey.json',
                os.path.expanduser('~/serviceAccountKey.json')
            ]
            
            service_account_path = None
            for path in service_account_paths:
                if os.path.exists(path):
                    service_account_path = path
                    break
            
            if not service_account_path:
                print("⚠️ Firebase service account key not found - snapshots won't be uploaded")
                return
            
            # Initialize Firebase
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'arohan-rover.firebasestorage.app',
                'databaseURL': 'https://arohan-rover-default-rtdb.firebaseio.com'
            })
            
            self.firebase_initialized = True
            print("✅ Firebase initialized successfully")
            
        except Exception as e:
            print(f"⚠️ Firebase initialization failed: {e}")
            self.firebase_initialized = False
    
    def _init_opencv(self):
        """Initialize OpenCV face detection"""
        try:
            # Load Haar cascade for face detection
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            if self.face_cascade.empty():
                print("❌ Failed to load face cascade")
                return False
            
            print("✅ OpenCV face detection initialized")
            return True
            
        except Exception as e:
            print(f"❌ OpenCV initialization error: {e}")
            return False
    
    def _load_known_faces(self):
        """Load known face encodings from directory"""
        try:
            if not FACE_RECOGNITION_AVAILABLE:
                print("⚠️ face_recognition not available - skipping face encoding")
                return
            
            for face_file in KNOWN_FACES_DIR.glob('*.jpg'):
                name = face_file.stem.replace('_', ' ')  # Convert filename to readable name
                
                # Load image using face_recognition library
                img = face_recognition.load_image_file(str(face_file))
                
                # Get face encodings
                encodings = face_recognition.face_encodings(img)
                
                if len(encodings) > 0:
                    # Store the first face encoding found
                    self.known_faces[name] = encodings[0]
                    print(f"✅ Loaded known face: {name}")
                else:
                    print(f"⚠️ No face found in {face_file.name}")
            
            print(f"📁 Loaded {len(self.known_faces)} known faces")
            
        except Exception as e:
            print(f"❌ Error loading known faces: {e}")
    
    def _setup_routes(self):
        """Setup Flask routes"""
        
        @self.app.route('/analyze-frame', methods=['POST'])
        def analyze_frame():
            try:
                data = request.get_json() or {}
                source = data.get('source', 'esp32')
                
                if source == 'esp32':
                    # Fetch frame from ESP32-CAM
                    frame = self._fetch_esp32_frame()
                    if frame is None:
                        return jsonify({'error': 'Failed to fetch frame from ESP32-CAM'}), 500
                else:
                    return jsonify({'error': 'Only ESP32 source supported currently'}), 400
                
                # Analyze the frame
                result = self._analyze_frame(frame)
                return jsonify(result)
                
            except Exception as e:
                print(f"❌ Analyze frame error: {e}")
                return jsonify({'error': str(e)}), 500
        
        @self.app.route('/alerts', methods=['GET'])
        def get_alerts():
            # Return recent alerts (most recent first)
            recent_alerts = sorted(self.alerts, key=lambda x: x.createdAt, reverse=True)[:50]
            return jsonify([asdict(alert) for alert in recent_alerts])
        
        @self.app.route('/alerts', methods=['POST'])
        def add_alert():
            try:
                data = request.get_json()
                alert = RoverAlert(**data)
                self.alerts.append(alert)
                
                # Keep only recent alerts
                if len(self.alerts) > MAX_ALERTS:
                    self.alerts = self.alerts[-MAX_ALERTS:]
                
                return jsonify({'status': 'success', 'id': alert.id})
                
            except Exception as e:
                return jsonify({'error': str(e)}), 400
        
        @self.app.route('/static/snapshots/<filename>')
        def serve_snapshot(filename):
            return send_from_directory(SNAPSHOTS_DIR, filename)
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({
                'status': 'healthy',
                'opencv_ready': self.face_cascade is not None,
                'known_faces': len(self.known_faces),
                'alerts_count': len(self.alerts),
                'esp32_url': ESP32_CAM_BASE_URL
            })
    
    def _fetch_esp32_frame(self) -> Optional[np.ndarray]:
        """Fetch a frame from ESP32-CAM"""
        try:
            # Try port 81 first, then fallback to base URL
            urls_to_try = [
                f"{ESP32_CAM_BASE_URL}/capture",
                "http://192.168.1.18/capture"
            ]
            
            for url in urls_to_try:
                try:
                    response = requests.get(url, timeout=5)
                    if response.status_code == 200:
                        # Convert to OpenCV image
                        img_array = np.frombuffer(response.content, np.uint8)
                        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                        if frame is not None:
                            return frame
                except:
                    continue
            
            print(f"❌ Failed to fetch from all URLs")
            return None
            
        except Exception as e:
            print(f"❌ Failed to fetch ESP32-CAM frame: {e}")
            return None
    
    # Old fetch method removed - use _fetch_esp32_frame() instead
    
    def _upload_snapshot_to_firebase(self, snapshot_path: Path, snapshot_filename: str) -> Optional[str]:
        """Upload snapshot to Firebase Storage and return download URL"""
        if not self.firebase_initialized:
            return None
        
        try:
            bucket = storage.bucket()
            blob = bucket.blob(f'arohan/snapshots/{snapshot_filename}')
            
            # Upload file
            blob.upload_from_filename(str(snapshot_path))
            
            # Make publicly accessible
            blob.make_public()
            
            # Return public URL
            return blob.public_url
            
        except Exception as e:
            print(f"⚠️ Failed to upload to Firebase: {e}")
            return None
    
    def _save_alert_to_firebase(self, alert: RoverAlert):
        """Save alert to Firebase Realtime Database"""
        if not self.firebase_initialized:
            return
        
        try:
            ref = db.reference('arohan/alerts')
            ref.push(asdict(alert))
            print(f"✅ Alert saved to Firebase: {alert.type}")
            
        except Exception as e:
            print(f"⚠️ Failed to save alert to Firebase: {e}")
    
    def _analyze_frame(self, frame: np.ndarray) -> Dict:
        """Analyze frame for faces and accidents"""
        try:
            timestamp = datetime.now().isoformat()
            
            # Save snapshot locally
            snapshot_filename = f"snapshot_{int(time.time())}.jpg"
            snapshot_path = SNAPSHOTS_DIR / snapshot_filename
            cv2.imwrite(str(snapshot_path), frame)
            
            # Try to upload to Firebase
            firebase_url = self._upload_snapshot_to_firebase(snapshot_path, snapshot_filename)
            snapshot_url = firebase_url if firebase_url else f"http://localhost:5000/static/snapshots/{snapshot_filename}"
            
            # Detect faces
            faces = self._detect_faces(frame)
            
            if len(faces) == 0:
                # No faces detected - check for accident indicators
                accident_detected = self._detect_accident(frame)
                
                if accident_detected:
                    alert = RoverAlert(
                        id=f"alert_{int(time.time())}",
                        type="ACCIDENT",
                        message="Potential accident detected - no faces visible with unusual scene",
                        createdAt=timestamp,
                        confidence=0.6,
                        snapshotUrl=snapshot_url,
                        meta={"faces_detected": 0}
                    )
                    self.alerts.append(alert)
                    self._save_alert_to_firebase(alert)
                    
                    return {
                        'status': 'success',
                        'alert': asdict(alert)
                    }
            else:
                # Faces detected - analyze each face
                for i, (x, y, w, h) in enumerate(faces):
                    face_roi = frame[y:y+h, x:x+w]
                    
                    # Check if face is known (simplified)
                    is_known, name, confidence = self._recognize_face(face_roi)
                    
                    alert_type = "KNOWN_FACE" if is_known else "UNKNOWN_FACE"
                    message = f"Known person detected: {name}" if is_known else "Unknown person detected"
                    
                    alert = RoverAlert(
                        id=f"alert_{int(time.time())}_{i}",
                        type=alert_type,
                        message=message,
                        createdAt=timestamp,
                        confidence=confidence,
                        snapshotUrl=snapshot_url,
                        meta={
                            "faces_detected": len(faces),
                            "face_index": i,
                            "bounding_box": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
                        }
                    )
                    self.alerts.append(alert)
                    self._save_alert_to_firebase(alert)
                    
                    print(f"✅ Face detected: {alert_type} - {message}")
                    
                    # Return first face detection
                    return {
                        'status': 'success',
                        'alert': asdict(alert)
                    }
            
            # No significant events
            return {
                'status': 'success',
                'message': 'Frame analyzed, no significant events detected'
            }
            
        except Exception as e:
            print(f"❌ Frame analysis error: {e}")
            return {'error': str(e)}
    
    def _detect_faces(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces in frame using OpenCV"""
        if self.face_cascade is None:
            return []
        
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Apply histogram equalization to improve detection in poor lighting
            gray = cv2.equalizeHist(gray)
            
            # Try multiple detection passes with different parameters
            # Pass 1: Standard detection
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            # Pass 2: If no faces found, try more sensitive detection
            if len(faces) == 0:
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.05,
                    minNeighbors=3,
                    minSize=(20, 20)
                )
            
            # Convert numpy array to list of tuples
            if len(faces) > 0:
                print(f"✅ Detected {len(faces)} face(s)")
                return [tuple(face) for face in faces]
            
            print("⚠️ No faces detected in frame")
            return []
            
        except Exception as e:
            print(f"❌ Face detection error: {e}")
            return []
    
    def _recognize_face(self, face_roi: np.ndarray) -> Tuple[bool, Optional[str], float]:
        """Recognize face using face_recognition library"""
        if len(self.known_faces) == 0:
            return False, None, 0.5
        
        if not FACE_RECOGNITION_AVAILABLE:
            return False, None, 0.5
        
        try:
            # Convert BGR (OpenCV) to RGB (face_recognition)
            rgb_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
            
            # Get face encoding for the detected face
            face_encodings = face_recognition.face_encodings(rgb_face)
            
            if len(face_encodings) == 0:
                return False, None, 0.5
            
            face_encoding = face_encodings[0]
            
            # Compare with all known faces
            known_names = list(self.known_faces.keys())
            known_encodings = list(self.known_faces.values())
            
            # Calculate face distances (lower = more similar)
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)
            
            # Find best match
            best_match_index = np.argmin(face_distances)
            best_distance = face_distances[best_match_index]
            
            # Threshold for recognition (0.6 is standard, lower = stricter)
            if best_distance < 0.6:
                confidence = 1.0 - best_distance  # Convert distance to confidence
                return True, known_names[best_match_index], float(confidence)
            
            return False, None, 0.5
            
        except Exception as e:
            print(f"❌ Face recognition error: {e}")
            return False, None, 0.5
    
    def _detect_accident(self, frame: np.ndarray) -> bool:
        """Simple accident detection based on scene analysis"""
        try:
            # Simple heuristic: check for unusual brightness/darkness
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            mean_brightness = np.mean(gray)
            
            # Very dark (< 30) or very bright (> 200) might indicate accident
            if mean_brightness < 30 or mean_brightness > 200:
                return True
            
            # Check for motion blur (simplified)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            if laplacian_var < 100:  # Very blurry
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ Accident detection error: {e}")
            return False
    
    def run(self, host='0.0.0.0', port=5000, debug=False):
        """Run the Flask server"""
        print(f"🚀 Starting CV Backend on {host}:{port}")
        print(f"📷 ESP32-CAM URL: {ESP32_CAM_BASE_URL}")
        print(f"📁 Snapshots directory: {SNAPSHOTS_DIR}")
        print(f"👥 Known faces: {len(self.known_faces)}")
        
        self.app.run(host=host, port=port, debug=debug)

if __name__ == '__main__':
    backend = CVBackend()
    backend.run(debug=True)