import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Download, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AlertDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: any | null;
  onResolve?: (alertId: string) => Promise<void>;
}

export const AlertDetailModal = ({ open, onOpenChange, alert, onResolve }: AlertDetailModalProps) => {
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();

  if (!alert) return null;

  const handleResolve = async () => {
    if (!onResolve || alert.resolved) return;
    
    setResolving(true);
    try {
      await onResolve(alert.id);
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      });
    } finally {
      setResolving(false);
    }
  };

  const handleDownload = () => {
    // Create a JSON snapshot of the alert
    const snapshot = {
      ...alert,
      downloadedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alert-${alert.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Snapshot Downloaded",
      description: "Alert data has been saved to your device."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Alert Details – {alert.type}</DialogTitle>
            {alert.resolved && (
              <div className="px-3 py-1 bg-safe/10 text-safe text-xs font-semibold rounded-full">
                ✓ Resolved
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Timestamp</div>
              <div className="font-semibold">{new Date(alert.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Severity</div>
              <StatusBadge status={alert.severity} size="sm" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Alert ID</div>
              <div className="font-mono text-xs">{alert.id}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className={`font-semibold ${alert.resolved ? 'text-safe' : 'text-warning'}`}>
                {alert.resolved ? 'Resolved' : 'Open'}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-secondary p-4 rounded-lg">
            <div className="text-sm font-semibold mb-2">Summary</div>
            <div className="text-sm text-muted-foreground">{alert.summary}</div>
          </div>

          {/* Sensor Readings */}
          {alert.sensorData && (
            <div>
              <div className="text-sm font-semibold mb-3">Sensor Readings at Alert Time</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background p-3 rounded border border-border">
                  <div className="text-xs text-muted-foreground">MQ-2 (Gas)</div>
                  <div className="text-lg font-bold">{alert.sensorData.mq2 || 'N/A'}</div>
                </div>
                <div className="bg-background p-3 rounded border border-border">
                  <div className="text-xs text-muted-foreground">MQ-135 (Air)</div>
                  <div className="text-lg font-bold">{alert.sensorData.mq135 || 'N/A'}</div>
                </div>
                <div className="bg-background p-3 rounded border border-border">
                  <div className="text-xs text-muted-foreground">Temperature</div>
                  <div className="text-lg font-bold">{alert.sensorData.temp ? `${alert.sensorData.temp}°C` : 'N/A'}</div>
                </div>
                <div className="bg-background p-3 rounded border border-border">
                  <div className="text-xs text-muted-foreground">Flame Sensor</div>
                  <div className="text-lg font-bold">{alert.sensorData.flame ? "🔥 Detected" : "None"}</div>
                </div>
                <div className="bg-background p-3 rounded border border-border col-span-2">
                  <div className="text-xs text-muted-foreground">Motion Sensor</div>
                  <div className="text-lg font-bold">{alert.sensorData.motion ? "👤 Motion" : "No Motion"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Hazard Score Info */}
          {alert.hazardScore !== undefined && (
            <div className="bg-secondary p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Hazard Score at Alert Time</div>
                <div className="text-2xl font-bold">{alert.hazardScore}/100</div>
              </div>
              <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    alert.hazardScore < 30 ? 'bg-safe' : 
                    alert.hazardScore < 60 ? 'bg-warning' : 'bg-danger'
                  }`}
                  style={{ width: `${alert.hazardScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Rover Actions */}
          {alert.roverAction && (
            <div className="bg-secondary p-4 rounded-lg">
              <div className="text-sm font-semibold mb-3">Rover Response</div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-semibold">Alert triggered</span>
                  <span className="text-muted-foreground ml-auto">{alert.timestamp}</span>
                </div>
                {alert.roverAction.dispatched && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="font-semibold">{alert.roverAction.dispatchType}</span>
                      <span className="text-muted-foreground ml-auto">+2s</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="font-semibold">Rover reached zone</span>
                      <span className="text-muted-foreground ml-auto">+45s</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-safe"></div>
                      <span className="font-semibold">Investigation complete</span>
                      <span className="text-muted-foreground ml-auto">+3m 20s</span>
                    </div>
                  </>
                )}
                <div className="mt-3 p-3 bg-background rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Outcome</div>
                  <div className="text-sm font-semibold">{alert.roverAction.outcome}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button 
              variant="default" 
              className="flex-1"
              onClick={handleResolve}
              disabled={alert.resolved || resolving}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {resolving ? 'Resolving...' : alert.resolved ? 'Already Resolved' : 'Mark as Resolved'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download Snapshot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
