import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useFirebase } from '@/contexts/FirebaseContext';
import { getMQ2Reading, getMQ135Reading, calculateHazardContribution, getMQ2Status, getMQ135Status, getRiskColorClass, normalizeMQ135 } from '@/lib/sensorData';
import { getSensorContribution } from '@/lib/hazardScore';
import { getTimeWindowLabel, getOptimalTickInterval, formatTooltipTime, formatChartTime } from '@/lib/chartUtils';
import { AlertCircle, Info } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { useRoverSensors } from '@/hooks/useRoverSensors';
import { useRealtimeChartData } from '@/hooks/useRealtimeChartData';

type SensorTypeOption = "MQ2" | "MQ135" | "temperature" | "fire" | "motion" | null;

interface SensorDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensorType: SensorTypeOption;
}

export const SensorDetailDrawer = ({ open, onOpenChange, sensorType }: SensorDetailDrawerProps) => {
  const { iotReadings, iotLoading } = useFirebase();
  const { data: roverSensors } = useRoverSensors();
  
  // ✅ REAL-TIME CHART DATA - Updates automatically when Firebase data changes
  const { chartData, isRoverConnected } = useRealtimeChartData({
    windowMinutes: 60, // Last hour
    maxPoints: 20 // Limit to 20 points for clean display
  });

  // Debug logging
  console.log('[SensorDetailDrawer] Render:', {
    open,
    sensorType,
    iotReadings: iotReadings ? 'present' : 'null',
    roverSensors: roverSensors ? 'present' : 'null',
    chartDataLength: chartData.length,
    isRoverConnected
  });

  // Calculate temperature stats from real-time chart data
  const tempStats = useMemo(() => {
    if (chartData.length === 0) return null;
    const temps = chartData.map(d => d.fixedTemp);
    return {
      min: Math.min(...temps),
      max: Math.max(...temps),
      avg: temps.reduce((a, b) => a + b, 0) / temps.length
    };
  }, [chartData]);
  
  // Calculate optimal tick interval for X-axis
  const tickInterval = useMemo(() => getOptimalTickInterval(chartData.length), [chartData.length]);

  const renderMQ2Details = () => {
    if (!iotReadings) return <LoadingSpinner message="Loading MQ-2 data..." />;
    const mq2Reading = getMQ2Reading(iotReadings, 'fixed');
    const contribution = calculateHazardContribution(iotReadings);
    const status = getMQ2Status(mq2Reading.normalized);
    const colorClass = getRiskColorClass(mq2Reading.normalized);

    // Create fallback data if chartData is empty
    const displayData = chartData.length > 0 ? chartData : [{
      timestamp: Date.now(),
      time: formatChartTime(Date.now()),
      fixedMQ2: iotReadings.mq2,
      fixedMQ135: iotReadings.mq135_digital,
      fixedTemp: iotReadings.temperature,
      fixedHumidity: iotReadings.humidity,
      roverMQ2: roverSensors?.mq2 ?? null,
      roverMQ135: roverSensors?.mq135 ?? null,
      roverTemp: roverSensors?.temperature ?? null,
    }];

    console.log('[MQ2 Detail] Chart Data:', {
      dataLength: displayData.length,
      latestPoint: displayData[displayData.length - 1],
      fixedMQ2: iotReadings.mq2,
      roverMQ2: roverSensors?.mq2
    });

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Current MQ-2 Reading (Gas Sensor)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary p-4 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Fixed IoT Node</div>
              <div className="text-2xl font-bold">{mq2Reading.raw}</div>
              <div className={`text-xs mt-1 ${colorClass}`}>Normalized: {mq2Reading.normalized.toFixed(1)}/100</div>
              <div className="text-xs text-muted-foreground mt-1">{status}</div>
            </div>
            <div className={`bg-secondary p-4 rounded-lg ${roverSensors?.mq2 ? '' : 'opacity-50'}`}>
              <div className="text-xs text-muted-foreground mb-1">Rover Node</div>
              {roverSensors?.mq2 ? (
                <>
                  <div className="text-2xl font-bold">{roverSensors.mq2}</div>
                  <div className="text-xs mt-1 text-muted-foreground">PPM</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                  <div className="text-xs text-muted-foreground mt-1">Not connected</div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="bg-secondary p-4 rounded-lg">
          <div className="text-sm font-semibold mb-2">Contribution to Hazard Score</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">MQ-2 Weight</span>
              <span className="font-semibold">30%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Normalized Value</span>
              <span className="font-semibold">{contribution.mq2.normalized.toFixed(1)}/100</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between">
              <span className="font-semibold">Contribution</span>
              <span className={`font-bold ${getRiskColorClass(contribution.mq2.contribution)}`}>{contribution.mq2.contribution.toFixed(1)} points</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">MQ-2 Trends ({getTimeWindowLabel(60)})</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  interval={tickInterval}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  label={{ value: 'PPM', angle: -90, position: 'insideLeft', fontSize: 10 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: any, name: string) => [
                    value !== null ? `${value} PPM` : 'N/A',
                    name
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="fixedMQ2" 
                  stroke="hsl(var(--safe))" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Fixed IoT Node" 
                />
                <Line 
                  type="monotone" 
                  dataKey="roverMQ2" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  dot={false} 
                  name={isRoverConnected ? "Rover" : "Rover (N/A)"} 
                  strokeDasharray={isRoverConnected ? "0" : "5 5"}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-background rounded border border-border">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Data Sources:</div>
            <div>• Fixed IoT Node: Main sensor unit (active)</div>
            <div>• Rover: Mobile verification unit (not yet connected)</div>
            <div className="mt-2 text-xs opacity-70">
              {chartData.length === 0 && "⏱️ Showing current reading - historical data will accumulate over time"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMQ135Details = () => {
    if (!iotReadings) return <LoadingSpinner message="Loading MQ-135 data..." />;
    
    const mq135Reading = getMQ135Reading(iotReadings, 'fixed');
    const roverMQ135Value = roverSensors?.mq135 ?? null;
    const contribution = calculateHazardContribution(iotReadings, roverMQ135Value);
    const status = getMQ135Status(mq135Reading.digital);
    
    // Fixed IoT: Binary (0 or 1) → normalized to 0 or 100
    const fixedNormalized = normalizeMQ135(mq135Reading.digital, 'fixed', true);
    const fixedColorClass = mq135Reading.digital === 1 ? 'text-danger' : 'text-safe';
    
    // Rover: Continuous analog → normalized to 0-100
    const roverNormalized = roverMQ135Value !== null ? normalizeMQ135(roverMQ135Value, 'rover', false) : null;
    const roverColorClass = roverNormalized !== null ? getRiskColorClass(roverNormalized) : 'text-muted-foreground';

    // Create fallback data if chartData is empty
    const displayData = chartData.length > 0 ? chartData : [{
      timestamp: Date.now(),
      time: formatChartTime(Date.now()),
      fixedMQ2: iotReadings.mq2,
      fixedMQ135: iotReadings.mq135_digital,
      fixedTemp: iotReadings.temperature,
      fixedHumidity: iotReadings.humidity,
      roverMQ2: roverSensors?.mq2 ?? null,
      roverMQ135: roverSensors?.mq135 ?? null,
      roverTemp: roverSensors?.temperature ?? null,
    }];

    console.log('[MQ135 Detail] Chart Data:', {
      dataLength: displayData.length,
      latestPoint: displayData[displayData.length - 1],
      fixedMQ135: iotReadings.mq135_digital,
      roverMQ135: roverSensors?.mq135
    });

    return (
      <div className="space-y-6">
        <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-semibold mb-1">MQ-135 Dual Configuration</div>
            <div className="text-muted-foreground">
              <strong>Fixed IoT:</strong> Binary threshold (0/1) from digital output - indicates if threshold exceeded.<br/>
              <strong>Rover:</strong> Continuous analog reading (PPM) - provides detailed air quality measurement for verification.
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold mb-3">Current MQ-135 Readings (Air Quality)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary p-4 rounded-lg border-l-4 border-safe">
              <div className="text-xs text-muted-foreground mb-1">Fixed IoT Node (Threshold-Based)</div>
              <div className={`text-2xl font-bold ${fixedColorClass}`}>
                {mq135Reading.digital === 1 ? '⚠️ ALERT' : '✓ OK'}
              </div>
              <div className="text-xs mt-1">Digital: {mq135Reading.digital}</div>
              <div className="text-xs mt-1 text-muted-foreground">Normalized: {fixedNormalized}/100</div>
              <div className="text-xs text-muted-foreground mt-1">{status}</div>
            </div>
            
            <div className={`bg-secondary p-4 rounded-lg border-l-4 ${roverMQ135Value !== null ? 'border-primary' : 'border-muted opacity-50'}`}>
              <div className="text-xs text-muted-foreground mb-1">Rover Node (Continuous)</div>
              {roverMQ135Value !== null ? (
                <>
                  <div className="text-2xl font-bold">{roverMQ135Value} PPM</div>
                  <div className={`text-xs mt-1 ${roverColorClass}`}>
                    Normalized: {roverNormalized?.toFixed(1)}/100
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {roverNormalized! < 30 ? 'Good' : roverNormalized! < 60 ? 'Moderate' : 'Poor'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                  <div className="text-xs text-muted-foreground mt-1">Not connected</div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-secondary p-4 rounded-lg">
          <div className="text-sm font-semibold mb-2">Contribution to Hazard Score</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">MQ-135 Weight</span>
              <span className="font-semibold">60% (Primary)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fixed (Threshold)</span>
              <span className="font-semibold">{fixedNormalized}/100</span>
            </div>
            {roverMQ135Value !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rover (Continuous)</span>
                <span className="font-semibold">{roverNormalized?.toFixed(1)}/100</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Effective (max)</span>
              <span className="font-semibold">{contribution.mq135.normalized.toFixed(1)}/100</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between">
              <span className="font-semibold">Contribution</span>
              <span className={`font-bold ${getRiskColorClass(contribution.mq135.contribution)}`}>
                {contribution.mq135.contribution.toFixed(1)} points
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            ℹ️ Hazard score uses max(fixed, rover) for worst-case assessment
          </div>
        </div>
        
        <div>
          <div className="text-sm font-semibold mb-3">MQ-135 Comparison ({getTimeWindowLabel(60)})</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  interval={tickInterval}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  domain={[0, 1]} 
                  ticks={[0, 1]}
                  label={{ value: 'Status (0=OK, 1=Alert)', angle: -90, position: 'insideLeft', fontSize: 10 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: any, name: string) => {
                    if (name.includes('Fixed')) {
                      return [value === 1 ? 'Alert' : 'OK', name];
                    }
                    if (value !== null) {
                      const normalized = normalizeMQ135(value, 'rover', false);
                      return [`${value} PPM (${normalized.toFixed(0)}/100)`, name];
                    }
                    return ['N/A', name];
                  }}
                />
                <Legend />
                <Line 
                  type="stepAfter" 
                  dataKey="fixedMQ135" 
                  stroke="hsl(var(--safe))" 
                  strokeWidth={2} 
                  dot={true} 
                  name="Fixed IoT (Threshold)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="roverMQ135" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  dot={false} 
                  name={isRoverConnected ? "Rover (Continuous)" : "Rover (N/A)"} 
                  strokeDasharray={isRoverConnected ? "0" : "5 5"}
                  yAxisId="right"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--primary))" 
                  fontSize={10}
                  domain={[0, 1000]}
                  label={{ value: 'PPM', angle: 90, position: 'insideRight', fontSize: 10 }}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>
        
        <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-background rounded border border-border">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Data Sources:</div>
            <div>• <span className="text-safe">Green line</span>: Fixed IoT (threshold-based, 0 or 100)</div>
            <div>• <span className="text-primary">Blue line</span>: Rover (continuous analog, 0-100 normalized)</div>
            <div className="mt-2">
              The rover provides detailed verification of air quality with continuous readings, 
              while the fixed node provides a simple threshold alert.
            </div>
            <div className="mt-2 text-xs opacity-70">
              {chartData.length === 0 && "⏱️ Showing current reading - historical data will accumulate over time"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTemperatureDetails = () => {
    if (!iotReadings) return <LoadingSpinner message="Loading temperature data..." />;
    const tempContribution = getSensorContribution(iotReadings.temperature, 'temp');
    const colorClass = getRiskColorClass(tempContribution.normalized);
    // Use tempStats from top-level useMemo hook

    // Create fallback data if chartData is empty
    const displayData = chartData.length > 0 ? chartData : [{
      timestamp: Date.now(),
      time: formatChartTime(Date.now()),
      fixedMQ2: iotReadings.mq2,
      fixedMQ135: iotReadings.mq135_digital,
      fixedTemp: iotReadings.temperature,
      fixedHumidity: iotReadings.humidity,
      roverMQ2: roverSensors?.mq2 ?? null,
      roverMQ135: roverSensors?.mq135 ?? null,
      roverTemp: roverSensors?.temperature ?? null,
    }];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Current Temperature</div>
            <div className="text-2xl font-bold">{iotReadings.temperature.toFixed(1)}°C</div>
            <div className={`text-xs mt-1 ${colorClass}`}>Normalized: {tempContribution.normalized.toFixed(1)}/100</div>
          </div>
          <div className="bg-secondary p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Current Humidity</div>
            <div className="text-2xl font-bold">{iotReadings.humidity}%</div>
            <div className="text-xs text-muted-foreground mt-1">{iotReadings.humidity < 30 ? 'Dry' : iotReadings.humidity < 60 ? 'Normal' : 'Humid'}</div>
          </div>
        </div>
        {tempStats && (
          <div className="bg-secondary p-4 rounded-lg">
            <div className="text-sm font-semibold mb-2">Last 10 Readings</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Min Temperature</span><span className="font-semibold">{tempStats.min.toFixed(1)}°C</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Max Temperature</span><span className="font-semibold">{tempStats.max.toFixed(1)}°C</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Average</span><span className="font-semibold">{tempStats.avg.toFixed(1)}°C</span></div>
            </div>
          </div>
        )}
        <div>
          <div className="text-sm font-semibold mb-3">Temperature Trend ({getTimeWindowLabel(60)})</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  interval={tickInterval}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  label={{ value: '°C', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: any, name: string) => [
                    value !== null ? `${value.toFixed(1)}°C` : 'N/A',
                    name
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="fixedTemp" 
                  stroke="hsl(var(--danger))" 
                  strokeWidth={2} 
                  dot={false}
                  name="Temperature" 
                />
                <Line 
                  type="monotone" 
                  dataKey="fixedHumidity" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  dot={false}
                  name="Humidity (%)" 
                  yAxisId="right"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--primary))" 
                  fontSize={10}
                  label={{ value: '%', angle: 90, position: 'insideRight', fontSize: 10 }}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="text-xs text-muted-foreground p-3 bg-background rounded border border-border">
          🌡️ Data source: DHT22 Sensor on Fixed IoT Node
          {chartData.length === 0 && <div className="mt-2 opacity-70">⏱️ Showing current reading - historical data will accumulate over time</div>}
        </div>
      </div>
    );
  };

  const renderFireDetails = () => {
    if (!iotReadings) return <LoadingSpinner message="Loading fire sensor data..." />;
    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-lg ${iotReadings.flame ? 'bg-danger text-white' : 'bg-secondary'}`}>
          <div className="text-xs mb-1 opacity-80">Flame Sensor Status</div>
          <div className="text-2xl font-bold">{iotReadings.flame ? '🔥 FIRE DETECTED!' : '✓ No Fire Detected'}</div>
          <div className="text-xs mt-2 opacity-80">Last check: {new Date(iotReadings.status.lastHeartbeat).toLocaleTimeString()}</div>
        </div>
        <div className="text-xs text-muted-foreground p-3 bg-background rounded border border-border">🔥 Data source: IR Flame Sensor Module on Fixed IoT Node</div>
      </div>
    );
  };

  const renderMotionDetails = () => {
    if (!iotReadings) return <LoadingSpinner message="Loading motion sensor data..." />;
    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-lg ${iotReadings.motion ? 'bg-warning text-black' : 'bg-secondary'}`}>
          <div className="text-xs mb-1 opacity-80">Motion Sensor Status</div>
          <div className="text-2xl font-bold">{iotReadings.motion ? '👁️ Motion Detected' : '😴 No Motion'}</div>
          <div className="text-xs mt-2 opacity-80">{iotReadings.motion ? 'Movement in monitored area' : 'Zone secure'}</div>
        </div>
        <div className="text-xs text-muted-foreground p-3 bg-background rounded border border-border">👤 Data source: PIR Motion Sensor on Fixed IoT Node</div>
      </div>
    );
  };

  const getTitle = () => {
    switch (sensorType) {
      case "MQ2": return "MQ-2 Gas Sensor – Detailed View";
      case "MQ135": return "MQ-135 Air Quality – Detailed View";
      case "temperature": return "Temperature & Humidity – Detailed View";
      case "fire": return "Fire Detection – Detailed View";
      case "motion": return "Human Presence – Detailed View";
      default: return "Sensor Details";
    }
  };

  const renderContent = () => {
    if (iotLoading) return <LoadingSpinner message="Loading sensor data..." />;
    if (!iotReadings) return <div className="text-center py-8 text-muted-foreground"><AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No sensor data available</p></div>;
    switch (sensorType) {
      case "MQ2": return renderMQ2Details();
      case "MQ135": return renderMQ135Details();
      case "temperature": return renderTemperatureDetails();
      case "fire": return renderFireDetails();
      case "motion": return renderMotionDetails();
      default: return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>{getTitle()}</SheetTitle></SheetHeader>
        <div className="mt-6">{renderContent()}</div>
      </SheetContent>
    </Sheet>
  );
};
