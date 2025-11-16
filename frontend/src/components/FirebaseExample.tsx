/**
 * Example component showing how to use Firebase hooks in RONIN
 * Copy patterns from here into your Dashboard, RoverConsole, etc.
 */

import { useIoTReadings } from '@/hooks/useIoTReadings';
import { useRover } from '@/hooks/useRover';
import { useAlerts } from '@/hooks/useAlerts';
import { getRiskLevel } from '@/lib/firebaseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FirebaseExample() {
  // Get real-time IoT data
  const { data: iotData, loading: iotLoading } = useIoTReadings();
  
  // Get rover control and status
  const { control, status, setDirection, setMode, emergencyStop } = useRover();
  
  // Get alerts
  const { unresolvedAlerts, resolveAlert } = useAlerts();

  if (iotLoading) {
    return <div className="p-4">Loading sensor data...</div>;
  }

  const riskLevel = iotData ? getRiskLevel(iotData.hazardScore) : 'SAFE';
  const riskColor = riskLevel === 'SAFE' ? 'text-green-500' : 
                    riskLevel === 'WARNING' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="p-6 space-y-6">
      {/* IoT Sensor Data */}
      <Card>
        <CardHeader>
          <CardTitle>IoT Sensor Readings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">MQ-2 (Gas)</p>
              <p className="text-2xl font-bold">{iotData?.mq2 || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MQ-135 (Air Quality)</p>
              <p className="text-2xl font-bold">{iotData?.mq135 || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temperature</p>
              <p className="text-2xl font-bold">{iotData?.temperature || 0}°C</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Humidity</p>
              <p className="text-2xl font-bold">{iotData?.humidity || 0}%</p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">Hazard Score</p>
            <p className={`text-4xl font-bold ${riskColor}`}>
              {iotData?.hazardScore.toFixed(1) || 0}
            </p>
            <p className={`text-lg font-semibold ${riskColor}`}>{riskLevel}</p>
          </div>

          <div className="flex gap-4 pt-2">
            <div>
              <span className="text-sm">Flame: </span>
              <span className={iotData?.flame ? 'text-red-500 font-bold' : 'text-green-500'}>
                {iotData?.flame ? '🔥 DETECTED' : '✓ Clear'}
              </span>
            </div>
            <div>
              <span className="text-sm">Motion: </span>
              <span className={iotData?.motion ? 'text-yellow-500 font-bold' : 'text-gray-500'}>
                {iotData?.motion ? '👤 DETECTED' : 'None'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rover Control */}
      <Card>
        <CardHeader>
          <CardTitle>Rover Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Mode</p>
              <p className="text-lg font-bold">{control?.mode.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Battery</p>
              <p className="text-lg font-bold">{status?.battery || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Direction</p>
              <p className="text-lg font-bold">{control?.direction.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Speed</p>
              <p className="text-lg font-bold">{control?.speed || 0}%</p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="space-y-2">
            <div className="flex justify-center">
              <Button onClick={() => setDirection('forward', 50)}>↑ Forward</Button>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => setDirection('left', 50)}>← Left</Button>
              <Button onClick={() => setDirection('stop', 0)} variant="destructive">
                ⬛ Stop
              </Button>
              <Button onClick={() => setDirection('right', 50)}>→ Right</Button>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setDirection('back', 50)}>↓ Back</Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={() => setMode(control?.mode === 'auto' ? 'manual' : 'auto')}
              variant="outline"
            >
              Switch to {control?.mode === 'auto' ? 'Manual' : 'Auto'}
            </Button>
            <Button onClick={emergencyStop} variant="destructive">
              🚨 Emergency Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts ({unresolvedAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {unresolvedAlerts.length === 0 ? (
            <p className="text-muted-foreground">No active alerts</p>
          ) : (
            <div className="space-y-2">
              {unresolvedAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-semibold">{alert.type}</p>
                    <p className="text-sm text-muted-foreground">{alert.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
