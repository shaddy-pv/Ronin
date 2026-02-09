/**
 * Rover Dispatch Notification Popup
 * 
 * Shows a prominent notification when rover is dispatched
 * Displays dispatch reason and auto-dismisses after a few seconds
 */

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { X, AlertTriangle, Navigation, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const RoverDispatchNotification = () => {
  const [show, setShow] = useState(false);
  const [dispatchInfo, setDispatchInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState(10);

  // Listen for rover dispatch events
  useEffect(() => {
    const alertsRef = ref(database, 'arohan/alerts');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Get most recent "Rover Dispatched" alert
      const alerts = Object.values(data) as any[];
      const dispatchAlerts = alerts
        .filter(a => a.type === 'Rover Dispatched' && !a.resolved)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (dispatchAlerts.length > 0) {
        const latestDispatch = dispatchAlerts[0];
        
        // Only show if it's recent (within last 30 seconds)
        const timeSinceDispatch = Date.now() - latestDispatch.timestamp;
        if (timeSinceDispatch < 30000) {
          setDispatchInfo(latestDispatch);
          setShow(true);
          setCountdown(10);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setShow(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show]);

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show || !dispatchInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md mx-4 border-2 border-warning shadow-2xl animate-in zoom-in duration-300">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-full">
                <Navigation className="w-6 h-6 text-warning animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-warning">🤖 Rover Dispatched</h3>
                <p className="text-sm text-muted-foreground">Autonomous response activated</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Animated Status */}
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div className="flex-1">
              <div className="font-semibold text-primary">Calling Rover...</div>
              <div className="text-xs text-muted-foreground">Initiating autonomous investigation</div>
            </div>
          </div>

          {/* Dispatch Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Reason:</div>
                <div className="text-sm text-muted-foreground">
                  {dispatchInfo.details?.reason || dispatchInfo.summary || 'High hazard detected'}
                </div>
              </div>
            </div>

            {dispatchInfo.details?.hazardScore && (
              <div className="p-3 bg-danger/10 rounded-lg border border-danger/20">
                <div className="text-xs text-muted-foreground mb-1">Hazard Score</div>
                <div className="text-2xl font-bold text-danger">
                  {dispatchInfo.details.hazardScore.toFixed(1)}/100
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Critical threshold exceeded
                </div>
              </div>
            )}

            {dispatchInfo.details?.location && (
              <div className="text-sm">
                <span className="text-muted-foreground">Target: </span>
                <span className="font-semibold">{dispatchInfo.details.location}</span>
              </div>
            )}
          </div>

          {/* Action Info */}
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              Rover will investigate and report findings
            </div>
            <div className="text-xs text-muted-foreground text-center mt-1">
              Auto-dismissing in {countdown}s
            </div>
          </div>

          {/* Dismiss Button */}
          <Button
            onClick={handleDismiss}
            className="w-full"
            variant="outline"
          >
            Acknowledge & Dismiss
          </Button>
        </div>
      </Card>
    </div>
  );
};
