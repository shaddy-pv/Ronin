import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  ServerOff, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { cvBackendService } from '@/services/cvBackendService';

interface CVBackendStatusProps {
  className?: string;
}

export const CVBackendStatus: React.FC<CVBackendStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<{
    connected: boolean;
    health?: any;
    error?: string;
    loading: boolean;
  }>({
    connected: false,
    loading: true
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await cvBackendService.getStatus();
      setStatus({
        connected: result.connected,
        health: result.health,
        error: result.error,
        loading: false
      });
    } catch (error) {
      setStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">CV Backend Status</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={status.loading}
        >
          {status.loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.connected ? (
              <Server className="w-4 h-4 text-green-500" />
            ) : (
              <ServerOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">Backend</span>
          </div>
          <Badge variant={status.connected ? "default" : "destructive"}>
            {status.connected ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Health Details */}
        {status.connected && status.health && (
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Detector:</span>
              <span className={status.health.detector ? 'text-green-500' : 'text-red-500'}>
                {status.health.detector ? status.health.detector.toUpperCase() : 'Not Ready'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Recognizer:</span>
              <span className="text-green-500">{status.health.recognizer || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Known Faces:</span>
              <span>{status.health.known_encodings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Alerts:</span>
              <span>{status.health.alerts_count || 0}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {!status.connected && status.error && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-xs">
            <AlertCircle className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
            <span className="text-destructive">{status.error}</span>
          </div>
        )}

        {/* Setup Instructions */}
        {!status.connected && (
          <div className="p-3 bg-secondary rounded-lg text-xs">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">CV Backend Offline</span>
            </div>
            <p className="text-muted-foreground mb-2">
              The computer vision backend is not running. Face detection and analysis features are disabled.
            </p>
            <div className="space-y-1 text-muted-foreground">
              <p><strong>To start the backend:</strong></p>
              <code className="block bg-background p-1 rounded text-xs">
                cd backend && python start_cv_backend.py
              </code>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status.connected && (
          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded text-xs">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-green-500">CV Backend is running and ready</span>
          </div>
        )}
      </div>
    </Card>
  );
};