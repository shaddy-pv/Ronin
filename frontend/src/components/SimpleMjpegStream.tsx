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

  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Start MJPEG stream (no CORS issues!)
  const startStream = useCallback(() => {
    if (!imgRef.current) {
      console.error('❌ imgRef not available');
      return;
    }
    
    setIsStreaming(true);
    setHasError(false);
    setErrorMessage('');
    
    // Direct MJPEG stream - bypasses CORS completely
    const finalUrl = streamUrl;
    imgRef.current.src = finalUrl;
  }, [streamUrl]);

  // Stop stream
  const stopStream = useCallback(() => {
    if (!imgRef.current) return;
    
    imgRef.current.src = '';
    setIsStreaming(false);
    setHasError(false);
  }, []);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
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
        </div>
      )}
      
      {/* Face Recognition Info */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Camera className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Want Face Recognition?</p>
            <p className="text-muted-foreground">
              For real-time face detection and recognition, visit the dedicated <strong>Face Recognition</strong> page from the sidebar.
              It provides continuous processing without interrupting the stream.
            </p>
          </div>
        </div>
      </div>

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
