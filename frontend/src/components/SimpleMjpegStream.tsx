/**
 * Simple MJPEG Stream Component
 * 
 * Uses direct MJPEG stream with <img> tag - NO CORS ISSUES!
 * Perfect for ESP32-CAM that doesn't have CORS headers.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Camera, Download, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { database, app } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleMjpegStreamProps {
  streamUrl: string;
  nodeId: string;
  roverId?: string;
  className?: string;
  showControls?: boolean;
  onSnapshotSaved?: (metadata: any) => void;
}

export const SimpleMjpegStream: React.FC<SimpleMjpegStreamProps> = ({
  streamUrl,
  nodeId,
  roverId,
  className = '',
  showControls = true,
  onSnapshotSaved
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<any[]>([]);
  const [faceRecognitionActive, setFaceRecognitionActive] = useState(false);
  const recognitionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Start MJPEG stream (no CORS issues!)
  const startStream = useCallback(() => {
    if (!imgRef.current) {
      console.error('❌ imgRef not available');
      return;
    }
    
    console.log('🚀 Starting MJPEG stream:', streamUrl);
    console.log('📷 Image element:', imgRef.current);
    
    setIsStreaming(true);
    setHasError(false);
    setErrorMessage('');
    
    // Direct MJPEG stream - bypasses CORS completely
    const finalUrl = streamUrl;
    console.log('🔗 Final URL:', finalUrl);
    imgRef.current.src = finalUrl;
    
    console.log('✅ Image src set to:', imgRef.current.src);
  }, [streamUrl]);

  // Stop stream
  const stopStream = useCallback(() => {
    if (!imgRef.current) return;
    
    console.log('🛑 Stopping stream');
    imgRef.current.src = '';
    setIsStreaming(false);
    setHasError(false);
  }, []);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    console.log('✅ Stream connected');
    setHasError(false);
    setErrorMessage('');
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    console.error('❌ Stream error');
    setHasError(true);
    setErrorMessage('Cannot connect to ESP32-CAM. Check IP address and network connection.');
  }, []);

  // Capture snapshot and upload to Firebase
  const captureSnapshot = useCallback(async () => {
    if (!imgRef.current || !canvasRef.current) return;
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to save snapshots.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCapturing(true);
    
    try {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      
      // Draw image to canvas
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');
      
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.95);
      });
      
      // Generate filename
      const timestamp = Date.now();
      const fileName = `snapshot_${nodeId}_${timestamp}.jpg`;
      
      // Upload to Firebase Storage
      const storage = getStorage(app);
      const fileRef = storageRef(storage, `ronin/snapshots/${fileName}`);
      
      await uploadBytes(fileRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          nodeId,
          roverId: roverId || '',
          timestamp: timestamp.toString(),
          uploadedBy: currentUser.uid
        }
      });
      
      // Get download URL
      const downloadUrl = await getDownloadURL(fileRef);
      
      // Create metadata
      const metadata = {
        id: `snapshot_${timestamp}`,
        timestamp,
        nodeId,
        roverId,
        imageUrl: downloadUrl,
        fileName,
        size: blob.size
      };
      
      // Save metadata to Realtime Database
      const snapshotsRef = dbRef(database, 'ronin/snapshots');
      const newSnapshotRef = push(snapshotsRef);
      await set(newSnapshotRef, metadata);
      
      // Callback
      if (onSnapshotSaved) {
        onSnapshotSaved(metadata);
      }
      
      toast({
        title: 'Snapshot Saved',
        description: `Captured and uploaded to Firebase Storage`,
      });
      
    } catch (error) {
      console.error('Snapshot error:', error);
      toast({
        title: 'Snapshot Failed',
        description: error instanceof Error ? error.message : 'Failed to save snapshot',
        variant: 'destructive'
      });
    } finally {
      setIsCapturing(false);
    }
  }, [currentUser, nodeId, roverId, onSnapshotSaved, toast]);

  // Toggle face recognition
  const toggleFaceRecognition = useCallback(() => {
    if (faceRecognitionActive) {
      // Stop recognition
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
      setFaceRecognitionActive(false);
      setDetectedFaces([]);
      toast({
        title: 'Face Recognition Stopped',
        description: 'Face detection has been disabled',
      });
    } else {
      // Start recognition
      setFaceRecognitionActive(true);
      toast({
        title: 'Face Recognition Started',
        description: 'Analyzing faces every 3 seconds',
      });
      
      // Analyze immediately
      analyzeFrame();
      
      // Then analyze every 3 seconds
      recognitionIntervalRef.current = setInterval(() => {
        analyzeFrame();
      }, 3000);
    }
  }, [faceRecognitionActive, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
    };
  }, []);

  // Analyze frame for face detection
  const analyzeFrame = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:5000/analyze-frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: 'esp32' }),
      });

      if (!response.ok) {
        throw new Error('CV Backend not responding');
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.alert) {
        const alert = result.alert;
        
        // Extract face bounding boxes if available
        if (alert.meta && alert.meta.bounding_box) {
          // Determine label based on alert type
          let faceLabel = 'Unknown Person';
          if (alert.type === 'KNOWN_FACE') {
            // Extract name from message like "Known person detected: John Doe"
            const nameParts = alert.message.split(': ');
            faceLabel = nameParts.length > 1 ? `Known: ${nameParts[1]}` : 'Known Person';
          } else if (alert.type === 'UNKNOWN_FACE') {
            faceLabel = 'Unknown Person';
          }
          
          setDetectedFaces([{
            x: alert.meta.bounding_box.x,
            y: alert.meta.bounding_box.y,
            w: alert.meta.bounding_box.w,
            h: alert.meta.bounding_box.h,
            label: faceLabel,
            confidence: alert.confidence || 0.5,
            isKnown: alert.type === 'KNOWN_FACE'
          }]);
          
          // Draw boxes after a short delay to ensure image is loaded
          setTimeout(() => drawFaceBoxes(), 100);
        }
        
        // Show appropriate toast based on alert type
        if (alert.type === 'KNOWN_FACE') {
          toast({
            title: '✅ Known Face Detected',
            description: alert.message,
          });
        } else if (alert.type === 'UNKNOWN_FACE') {
          toast({
            title: '⚠️ Unknown Face Detected',
            description: 'Unrecognized person detected in frame',
          });
        } else if (alert.type === 'ACCIDENT') {
          toast({
            title: '🚨 Accident Alert',
            description: alert.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Detection Result',
            description: alert.message,
          });
        }
      } else {
        toast({
          title: 'No Faces Detected',
          description: 'No faces found in the current frame',
        });
        setDetectedFaces([]);
      }
      
    } catch (error) {
      console.error('Analyze error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Make sure CV backend is running on port 5000',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  // Draw face detection boxes on overlay canvas
  const drawFaceBoxes = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const img = imgRef.current;
    
    if (!canvas || !img || detectedFaces.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match image
    canvas.width = img.naturalWidth || 640;
    canvas.height = img.naturalHeight || 480;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each face box
    detectedFaces.forEach((face) => {
      const color = face.isKnown ? '#10b981' : '#f59e0b';
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(face.x, face.y, face.w, face.h);
      
      // Draw label background
      ctx.font = '16px sans-serif';
      const text = `${face.label} (${Math.round(face.confidence * 100)}%)`;
      const textMetrics = ctx.measureText(text);
      const labelWidth = textMetrics.width + 12;
      const labelHeight = 24;
      
      ctx.fillStyle = color;
      ctx.fillRect(face.x, face.y - labelHeight - 2, labelWidth, labelHeight);
      
      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, face.x + 6, face.y - 8);
    });
  }, [detectedFaces]);

  // Download snapshot locally
  const downloadSnapshot = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const img = imgRef.current;
    
    canvas.width = img.naturalWidth || 640;
    canvas.height = img.naturalHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rover-snapshot-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Downloaded',
          description: 'Snapshot saved to your device',
        });
      }
    }, 'image/jpeg', 0.95);
  }, [toast]);

  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">ESP32-CAM Live Stream</h2>
        <Badge variant={isStreaming && !hasError ? "default" : "destructive"} className="gap-1">
          {isStreaming && !hasError ? (
            <>
              <Wifi className="w-3 h-3" />
              STREAMING
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              OFFLINE
            </>
          )}
        </Badge>
      </div>

      {/* Video Display */}
      <div className="aspect-video bg-secondary border-2 border-border rounded-lg overflow-hidden relative">
        {/* Image element - always rendered */}
        <img
          ref={imgRef}
          alt="ESP32-CAM MJPEG Stream"
          className="w-full h-full object-contain bg-black"
          style={{ 
            display: isStreaming && !hasError ? 'block' : 'none',
            transform: 'rotate(180deg)',
            imageRendering: 'auto'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="eager"
          decoding="async"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Face detection overlay canvas */}
        {detectedFaces.length > 0 && (
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
          />
        )}
        
        {/* Live indicator */}
        {isStreaming && !hasError && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
        )}
        
        {/* Offline message */}
        {(!isStreaming || hasError) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <VideoOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                {hasError ? 'Connection error' : 'Camera stream offline'}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasError ? 'Check ESP32-CAM connection' : 'Click "Start Stream" to begin'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={isStreaming ? "destructive" : "default"}
            size="sm"
            onClick={isStreaming ? stopStream : startStream}
            className="gap-2"
          >
            {isStreaming ? (
              <>
                <VideoOff className="w-4 h-4" />
                Stop Stream
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                Start Stream
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={captureSnapshot}
            disabled={!isStreaming || hasError || isCapturing || !currentUser}
            className="gap-2"
            title={!currentUser ? 'Login required to save snapshots' : ''}
          >
            <Camera className="w-4 h-4" />
            {isCapturing ? 'Saving...' : 'Save Snapshot'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={downloadSnapshot}
            disabled={!isStreaming || hasError}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>

          <Button
            variant={faceRecognitionActive ? "default" : "outline"}
            size="sm"
            onClick={toggleFaceRecognition}
            disabled={!isStreaming || hasError}
            className="gap-2"
          >
            {faceRecognitionActive ? (
              <>
                <Camera className="w-4 h-4" />
                Stop Recognition
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Face Recognition
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Face Detection Results */}
      {detectedFaces.length > 0 && (
        <div className={`mt-4 p-3 rounded-lg ${
          detectedFaces[0].isKnown 
            ? 'bg-green-500/10 border border-green-500/20' 
            : 'bg-orange-500/10 border border-orange-500/20'
        }`}>
          <div className="flex items-start gap-2">
            <Camera className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              detectedFaces[0].isKnown ? 'text-green-500' : 'text-orange-500'
            }`} />
            <div className="text-xs">
              <p className={`font-semibold mb-1 ${
                detectedFaces[0].isKnown ? 'text-green-500' : 'text-orange-500'
              }`}>
                {detectedFaces.length} Face{detectedFaces.length > 1 ? 's' : ''} Detected
              </p>
              {detectedFaces.map((face, idx) => (
                <p key={idx} className="text-muted-foreground">
                  • <span className={face.isKnown ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                    {face.label}
                  </span> - {Math.round(face.confidence * 100)}% confidence
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {hasError && errorMessage && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-destructive mb-1">Connection Error</p>
              <p className="text-muted-foreground">{errorMessage}</p>
              <p className="mt-2 text-muted-foreground">
                <strong>Troubleshooting:</strong><br />
                • Verify ESP32-CAM IP: {streamUrl}<br />
                • Check same WiFi network<br />
                • Test direct access: <a href={streamUrl} target="_blank" rel="noopener noreferrer" className="underline">{streamUrl}</a><br />
                • Check ESP32-CAM power supply
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="mt-4 p-3 bg-secondary rounded-lg border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <div>
            <span className="font-semibold">Status:</span>{" "}
            <span className={isStreaming && !hasError ? "text-green-500" : "text-red-500"}>
              {isStreaming && !hasError ? "Live Stream" : "Disconnected"}
            </span>
          </div>
          
          <div>
            <span className="font-semibold">Method:</span>{" "}
            <span className="text-muted-foreground">Direct MJPEG</span>
          </div>
          
          <div>
            <span className="font-semibold">Node:</span>{" "}
            <span className="text-muted-foreground">{nodeId}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
