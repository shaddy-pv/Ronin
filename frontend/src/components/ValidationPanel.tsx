import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, TrendingUp, Clock, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { ref, onValue, off, query, orderByChild, limitToLast } from "firebase/database";
import { database } from "@/lib/firebase";
import { HazardScoreComparison, DivergenceEvent } from "@/hooks/useCalculatedHazardScore";
import { getRiskLevel } from "@/lib/hazardScore";

interface ValidationPanelProps {
  comparison: HazardScoreComparison | null;
  divergenceThreshold: number;
  compact?: boolean;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ 
  comparison, 
  divergenceThreshold,
  compact = false 
}) => {
  const [recentEvents, setRecentEvents] = useState<Array<DivergenceEvent & { id: string }>>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Subscribe to recent divergence events
  useEffect(() => {
    const eventsRef = query(
      ref(database, 'arohan/validation/divergence_events'),
      orderByChild('timestamp'),
      limitToLast(10)
    );

    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const events = Object.entries(data).map(([id, event]) => ({
          id,
          ...(event as DivergenceEvent)
        })).sort((a, b) => b.timestamp - a.timestamp);
        setRecentEvents(events);
      } else {
        setRecentEvents([]);
      }
      setEventsLoading(false);
    });

    return () => {
      off(eventsRef);
    };
  }, []);

  if (!comparison) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Waiting for sensor data...</p>
        </div>
      </Card>
    );
  }

  const { 
    deviceScore, 
    calculatedScore, 
    divergence, 
    divergencePercentage,
    deviceRiskLevel,
    calculatedRiskLevel,
    effectiveMQ135,
    isRoverOnline
  } = comparison;

  const isDivergenceHigh = divergence > divergenceThreshold;
  const riskLevelMismatch = deviceRiskLevel !== calculatedRiskLevel;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Score Validation</h3>
          {isDivergenceHigh ? (
            <AlertTriangle className="w-4 h-4 text-warning" />
          ) : (
            <CheckCircle className="w-4 h-4 text-safe" />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground">Device Score</div>
            <div className="font-semibold">{deviceScore.toFixed(1)}</div>
            <Badge variant={deviceRiskLevel === 'SAFE' ? 'default' : deviceRiskLevel === 'WARNING' ? 'secondary' : 'destructive'} className="text-xs">
              {deviceRiskLevel}
            </Badge>
          </div>
          <div>
            <div className="text-muted-foreground">Calculated Score</div>
            <div className="font-semibold">{calculatedScore.toFixed(1)}</div>
            <Badge variant={calculatedRiskLevel === 'SAFE' ? 'default' : calculatedRiskLevel === 'WARNING' ? 'secondary' : 'destructive'} className="text-xs">
              {calculatedRiskLevel}
            </Badge>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Divergence</span>
            <span className={`text-xs font-semibold ${isDivergenceHigh ? 'text-warning' : 'text-safe'}`}>
              {divergence.toFixed(1)} pts ({divergencePercentage.toFixed(1)}%)
            </span>
          </div>
          {isDivergenceHigh && (
            <div className="text-xs text-warning mt-1">
              ⚠️ Exceeds threshold ({divergenceThreshold} pts)
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Hazard Score Validation</h3>
        <div className="flex items-center gap-2">
          {isDivergenceHigh ? (
            <AlertTriangle className="w-5 h-5 text-warning" />
          ) : (
            <CheckCircle className="w-5 h-5 text-safe" />
          )}
          <Badge variant={isDivergenceHigh ? "destructive" : "default"}>
            {isDivergenceHigh ? "High Divergence" : "Validated"}
          </Badge>
        </div>
      </div>

      {/* Score Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Device Score</h4>
            <Badge variant={deviceRiskLevel === 'SAFE' ? 'default' : deviceRiskLevel === 'WARNING' ? 'secondary' : 'destructive'}>
              {deviceRiskLevel}
            </Badge>
          </div>
          <div className="text-2xl font-bold">{deviceScore.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">From IoT device calculation</div>
        </div>

        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Calculated Score</h4>
            <Badge variant={calculatedRiskLevel === 'SAFE' ? 'default' : calculatedRiskLevel === 'WARNING' ? 'secondary' : 'destructive'}>
              {calculatedRiskLevel}
            </Badge>
          </div>
          <div className="text-2xl font-bold">{calculatedScore.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">
            Using mathematical model
            {isRoverOnline && <span className="text-primary"> + rover data</span>}
          </div>
        </div>
      </div>

      {/* Divergence Analysis */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Divergence Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="text-lg font-bold">{divergence.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Absolute Difference</div>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="text-lg font-bold">{divergencePercentage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Percentage Difference</div>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="text-lg font-bold">{divergenceThreshold}</div>
            <div className="text-sm text-muted-foreground">Alert Threshold</div>
          </div>
        </div>

        {riskLevelMismatch && (
          <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">Risk Level Mismatch</span>
            </div>
            <div className="text-sm mt-1">
              Device reports <strong>{deviceRiskLevel}</strong> but calculated score indicates <strong>{calculatedRiskLevel}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Model Details */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Mathematical Model Details</h4>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Effective MQ-135 (normalized):</span>
            <span className="font-mono">{effectiveMQ135.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Formula:</span>
            <span className="font-mono">0.6×MQ135 + 0.3×MQ2 + 0.1×Temp</span>
          </div>
          <div className="flex justify-between">
            <span>Rover data:</span>
            <span className={isRoverOnline ? "text-safe" : "text-muted-foreground"}>
              {isRoverOnline ? "✓ Online" : "✗ Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Validation Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Recent Validation Events</h4>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {eventsLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="w-6 h-6 mx-auto mb-2" />
            Loading events...
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
            No divergence events recorded
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentEvents.map((event) => (
              <div key={event.id} className="p-3 bg-secondary/30 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">
                    Divergence: {event.divergence.toFixed(1)} pts
                  </span>
                  <span className="text-muted-foreground">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Device: {event.deviceScore.toFixed(1)} | 
                  Calculated: {event.calculatedScore.toFixed(1)} | 
                  Diff: {event.divergencePercentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};