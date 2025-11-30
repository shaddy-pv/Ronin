# ESP32-CAM Integration Guide

This document explains how the RONIN dashboard integrates with ESP32-CAM for live video streaming and face recognition capabilities.

## Overview

The camera integration consists of several key components:

- **Camera Service**: Handles ESP32-CAM communication and streaming
- **Face Recognition Service**: Provides face detection hooks for future ML integration
- **Camera Context**: React context for managing camera state across components
- **Camera Feed Component**: UI component for displaying live video with overlays
- **Camera Settings Component**: Configuration interface for camera parameters

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# ESP32-CAM Configuration
VITE_ESP32_BASE_URL=http://192.168.1.18
VITE_ESP32_STREAM_ENDPOINT=/stream
VITE_ESP32_CAPTURE_ENDPOINT=/capture
VITE_ESP32_CONTROL_ENDPOINT=/control
```

### ESP32-CAM Setup

1. **Flash ESP32-CAM** with the standard CameraWebServer firmware
2. **Configure WiFi** to connect to your lab network
3. **Set static IP** to `192.168.1.18` (or update environment variables)
4. **Verify endpoints**:
   - Stream: `http://192.168.1.18/stream`
   - Capture: `http://192.168.1.18/capture`
   - Control: `http://192.168.1.18/control` (optional)

## Architecture

### Camera Service (`src/services/cameraService.ts`)

Handles all ESP32-CAM communication:

```typescript
// Start streaming
cameraService.startStream();

// Capture single frame
const frame = await cameraService.captureFrame();

// Update camera settings
await cameraService.updateSettings({
  framesize: 8, // VGA
  quality: 12,
  brightness: 0
});

// Subscribe to frames
const unsubscribe = cameraService.onFrame((frame) => {
  console.log('New frame:', frame);
});
```

### Face Recognition Service (`src/services/faceRecognitionService.ts`)

Provides hooks for face detection and recognition:

```typescript
// Enable face detection
faceRecognitionService.setEnabled(true);

// Process frames for faces
const faces = await faceRecognitionService.processFrame(frame);

// Subscribe to detections
const unsubscribe = faceRecognitionService.onFaceDetection((faces) => {
  console.log('Detected faces:', faces);
});
```

### Camera Context (`src/contexts/CameraContext.tsx`)

React context providing camera state and controls:

```typescript
const {
  isStreaming,
  streamStatus,
  currentFrame,
  detectedFaces,
  startStream,
  stopStream,
  captureFrame,
  toggleFaceRecognition
} = useCamera();
```

## Components

### CameraFeed Component

Main camera display component with controls:

```tsx
<CameraFeed 
  showControls={true}
  showFaceDetection={true}
/>
```

Features:
- Live video streaming from ESP32-CAM
- Face detection overlays (when enabled)
- Stream controls (start/stop/capture)
- Connection status indicators
- FPS counter and frame statistics

### CameraSettings Component

Configuration interface for camera parameters:

```tsx
<CameraSettingsComponent />
```

Features:
- ESP32-CAM connection settings
- Image quality controls (resolution, quality, brightness, etc.)
- Auto-control toggles (AWB, AEC, AGC)
- Face recognition settings

## Face Recognition Integration

### Current Implementation

The face recognition service is designed with hooks for future ML integration:

- **Mock Detection**: Currently returns simulated face detections
- **Processing Pipeline**: Frame processing infrastructure is ready
- **Overlay System**: Bounding boxes and labels are rendered on detected faces
- **Configuration**: Adjustable confidence thresholds and processing intervals

### Future Integration Options

1. **face-api.js**: Browser-based face detection and recognition
2. **MediaPipe**: Google's ML framework with face detection models
3. **TensorFlow.js**: Custom face recognition models
4. **Backend Processing**: Send frames to server for processing

### Adding Real Face Detection

To integrate a real face detection library:

1. **Install the library** (e.g., `npm install face-api.js`)
2. **Update `detectFaces` method** in `FaceRecognitionService`
3. **Load models** in the `initialize` method
4. **Replace mock detection** with actual ML inference

Example with face-api.js:

```typescript
// In initialize()
await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
await faceapi.nets.faceLandmark68Net.loadFromUri('/models');

// In detectFaces()
const detections = await faceapi
  .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
  .withFaceLandmarks();

return detections.map(detection => ({
  id: `face_${Date.now()}_${Math.random()}`,
  confidence: detection.detection.score,
  boundingBox: {
    x: detection.detection.box.x,
    y: detection.detection.box.y,
    width: detection.detection.box.width,
    height: detection.detection.box.height,
  },
  landmarks: detection.landmarks ? {
    leftEye: detection.landmarks.getLeftEye()[0],
    rightEye: detection.landmarks.getRightEye()[0],
    nose: detection.landmarks.getNose()[0],
    mouth: detection.landmarks.getMouth()[0],
  } : undefined,
  timestamp: Date.now(),
  isKnown: false,
}));
```

## Troubleshooting

### Common Issues

1. **Stream not loading**:
   - Check ESP32-CAM IP address and network connectivity
   - Verify camera is powered and running CameraWebServer firmware
   - Check browser console for CORS or network errors

2. **Poor video quality**:
   - Adjust framesize and quality settings in camera configuration
   - Check network bandwidth and stability
   - Ensure adequate lighting for the camera

3. **Face detection not working**:
   - Verify face recognition is enabled in settings
   - Check browser console for processing errors
   - Ensure adequate lighting and face visibility

### Network Configuration

For lab network setup:
- ESP32-CAM should be on same network as development machine
- Consider setting up static IP for ESP32-CAM
- Ensure firewall allows connections to ESP32-CAM ports

### Performance Optimization

- Adjust processing interval for face detection based on performance needs
- Use appropriate frame size for your use case (VGA recommended for face detection)
- Consider reducing FPS for lower bandwidth usage

## Security Considerations

- ESP32-CAM streams are unencrypted by default
- Consider implementing authentication for camera access
- Be mindful of privacy when implementing face recognition
- Store face recognition data securely if implementing person identification

## Future Enhancements

1. **Person Recognition**: Identify known individuals
2. **Motion Detection**: Alert on movement in camera view
3. **Recording**: Save video clips or time-lapse
4. **Multiple Cameras**: Support for multiple ESP32-CAM units
5. **PTZ Control**: Pan/tilt/zoom if hardware supports it
6. **Night Vision**: IR LED control for low-light conditions