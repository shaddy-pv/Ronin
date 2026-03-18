/**
 * Real-Time Face Recognition Stream
 * 
 * Displays continuous MJPEG stream from CV backend with face detection overlay.
 * NO FLICKERING - stream never stops, face recognition runs continuously.
 * 
 * This is the PROPER implementation:
 * - Backend continuously processes ESP32-CAM frames
 * - Draws bounding boxes in real-time
 * - Generates alerts automatically when faces detected
 * - Stream never interrupts
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Wifi, WifiOff, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RealTimeFaceRecognitionProps {
  className?: string;
}

export const RealTimeFaceRecognition: React.FC<RealTimeFaceRecognitionProps> = ({ className = '' }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  const cvBackendUrl = import.meta.env.VITE_CV_BACKEND_URL || 'http://localhost:5000';
  const streamUrl = `${cvBackendUrl}/stream-annotated`;

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${cvBackendUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  // Start real-time stream
  const startStream = useCallback(() => {
    if (!imgRef.current) {
      console.error('❌ imgRef not available');
      return;
    }
    
    setIsStreaming(true);
    setHasError(false);
    setErrorMessage('');
    
    // Direct MJPEG stream with face recognition overlay
    imgRef.current.src = streamUrl;
    
    toast({
      title: 'Face Recognition Started',
      description: 'Real-time face detection and recognition is now active',
    });
  }, [streamUrl, toast]);

  // Stop stream
  const stopStream = useCallback(() => {
    if (!imgRef.current) return;
    
    imgRef.current.src = '';
    setIsStreaming(false);
    setHasError(false);
    
    toast({
      title: 'Face Recognition Stopped',
      description: 'Stream has been stopped',
    });
  }, [toast]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    setBackendStatus('online');
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    console.error('❌ Stream error');
    setHasError(true);
    setErrorMessage('Cannot connect to CV backend. Make sure it is running on port 5000.');
    setBackendStatus('offline');
  }, []);

  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Real-Time Face Recognition</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Continuous stream with live face detection overlay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={backendStatus === 'online' ? "default" : "destructive"} className="gap-1">
            {backendStatus === 'online' ? (
              <>
                <CheckCircle className="w-3 h-3" />
                CV BACKEND
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                OFFLINE
              </>
            )}
          </Badge>
          <Badge variant={isStreaming && !hasError ? "default" : "secondary"} className="gap-1">
            {isStreaming && !hasError ? (
              <>
                <Activity className="w-3 h-3 animate-pulse" />
                LIVE
              </>
            ) : (
              <>
                <VideoOff className="w-3 h-3" />
                STOPPED
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Video Display */}
      <div className="aspect-video bg-secondary border-2 border-border rounded-lg overflow-hidden relative">
        {/* Image element for MJPEG stream */}
        <img
          ref={imgRef}
          alt="Real-Time Face Recognition Stream"
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
        
        {/* Live indicator */}
        {isStreaming && !hasError && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            LIVE RECOGNITION
          </div>
        )}
        
        {/* Info overlay */}
        {isStreaming && !hasError && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1.5 rounded-md text-xs">
            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3" />
              <span>Real-time processing active</span>
            </div>
          </div>
        )}
        
        {/* Offline message */}
        {(!isStreaming || hasError) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <VideoOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2 font-semibold">
                {hasError ? 'Connection error' : 'Face recognition stream offline'}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasError ? 'Check CV backend is running' : 'Click "Start Recognition" to begin'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant={isStreaming ? "destructive" : "default"}
          size="sm"
          onClick={isStreaming ? stopStream : startStream}
          disabled={backendStatus === 'offline'}
          className="gap-2"
        >
          {isStreaming ? (
            <>
              <VideoOff className="w-4 h-4" />
              Stop Recognition
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Start Recognition
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={checkBackendHealth}
          className="gap-2"
        >
          <Activity className="w-4 h-4" />
          Check Backend
        </Button>
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
                <strong>To start CV backend:</strong><br />
                <code className="bg-background px-1 py-0.5 rounded">cd backend && python cv_backend.py</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backend Offline Warning */}
      {backendStatus === 'offline' && !isStreaming && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-yellow-600 dark:text-yellow-500 mb-1">CV Backend Offline</p>
              <p className="text-muted-foreground mb-2">
                The computer vision backend is not running. Face recognition features are disabled.
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p><strong>To start the backend:</strong></p>
                <code className="block bg-background p-2 rounded text-xs">
                  cd backend<br />
                  python cv_backend.py
                </code>
                <p className="mt-2">Backend should run on: <code className="bg-background px-1 py-0.5 rounded">http://localhost:5000</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isStreaming && !hasError && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <div>
              <span className="text-green-600 dark:text-green-500 font-semibold">Real-time face recognition active</span>
              <p className="text-muted-foreground mt-1">
                • Faces are detected and recognized continuously<br />
                • Alerts are generated automatically when faces appear<br />
                • Green boxes = Known faces | Red boxes = Unknown faces
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-4 p-3 bg-secondary rounded-lg border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Mode:</span>{" "}
            <span className="text-muted-foreground">Real-time continuous</span>
          </div>
          
          <div>
            <span className="font-semibold">Processing:</span>{" "}
            <span className="text-muted-foreground">~10 FPS</span>
          </div>
          
          <div>
            <span className="font-semibold">Backend:</span>{" "}
            <span className={backendStatus === 'online' ? "text-green-500" : "text-red-500"}>
              {backendStatus === 'online' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div>
            <span className="font-semibold">Stream URL:</span>{" "}
            <span className="text-muted-foreground text-xs">/stream-annotated</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
