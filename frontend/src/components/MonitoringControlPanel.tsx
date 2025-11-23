import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Play, Square, Activity, Info } from 'lucide-react';
import { clientMonitoring } from '@/services/clientMonitoring';
import { useToast } from '@/hooks/use-toast';

export const MonitoringControlPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if monitoring is already running
    setIsRunning(clientMonitoring.isRunning());
  }, []);

  const handleStart = () => {
    try {
      clientMonitoring.start();
      setIsRunning(true);
      toast({
        title: "🤖 Monitoring Started",
        description: "Client-side monitoring is now active. Alerts will be created automatically.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start monitoring",
        variant: "destructive"
      });
    }
  };

  const handleStop = () => {
    try {
      clientMonitoring.stop();
      setIsRunning(false);
      toast({
        title: "Monitoring Stopped",
        description: "Client-side monitoring has been stopped.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop monitoring",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${isRunning ? 'bg-safe/20' : 'bg-muted'}`}>
          <Activity className={`w-6 h-6 ${isRunning ? 'text-safe animate-pulse' : 'text-muted-foreground'}`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold">Client-Side Monitoring</h3>
            <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
              isRunning ? 'bg-safe/20 text-safe' : 'bg-muted text-muted-foreground'
            }`}>
              {isRunning ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {isRunning 
              ? '✓ Automated monitoring is active. Alerts will be created automatically when hazards are detected.'
              : 'Start monitoring to enable automated alert creation and history logging.'
            }
          </p>

          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={isRunning ? handleStop : handleStart}
              variant={isRunning ? "destructive" : "default"}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Monitoring
                </>
              )}
            </Button>
          </div>

          <div className="bg-card/50 rounded-lg p-3 border border-border">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">100% FREE Alternative to Cloud Functions</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Auto-creates alerts on hazards (fire, gas, temperature)</li>
                  <li>Auto-dispatches rover on high hazard score</li>
                  <li>Logs history every 5 minutes</li>
                  <li>Monitors battery and connection status</li>
                </ul>
                <p className="mt-2 text-warning">
                  ⚠️ Note: Monitoring only works while this dashboard is open. Close the browser and monitoring stops.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
