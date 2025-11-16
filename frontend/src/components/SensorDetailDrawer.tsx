import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SensorDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensorType: "gas" | "temperature" | "fire" | "motion" | null;
}

export const SensorDetailDrawer = ({ open, onOpenChange, sensorType }: SensorDetailDrawerProps) => {
  // Dummy historical data
  const gasHistory = [
    { time: "10:00", mq2: 120, mq135: 200 },
    { time: "10:05", mq2: 125, mq135: 210 },
    { time: "10:10", mq2: 130, mq135: 215 },
    { time: "10:15", mq2: 128, mq135: 205 },
    { time: "10:20", mq2: 122, mq135: 198 },
  ];

  const tempHistory = [
    { time: "10:00", temp: 24.5 },
    { time: "10:05", temp: 24.8 },
    { time: "10:10", temp: 25.1 },
    { time: "10:15", temp: 25.3 },
    { time: "10:20", temp: 25.0 },
  ];

  const renderGasDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary p-4 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">MQ-2 (Gas Sensor)</div>
          <div className="text-2xl font-bold">125</div>
          <div className="text-xs text-safe mt-1">Normalized: 25/100</div>
        </div>
        <div className="bg-secondary p-4 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">MQ-135 (Air Quality)</div>
          <div className="text-2xl font-bold">205</div>
          <div className="text-xs text-safe mt-1">Normalized: 28/100</div>
        </div>
      </div>

      <div className="bg-secondary p-4 rounded-lg">
        <div className="text-sm font-semibold mb-2">Contribution to HazardScore</div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">MQ-135 (60% weight)</span>
            <span className="font-semibold">16.8 points</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">MQ-2 (30% weight)</span>
            <span className="font-semibold">7.5 points</span>
          </div>
          <div className="border-t border-border pt-2 mt-2 flex justify-between">
            <span className="font-semibold">Total Contribution</span>
            <span className="font-bold text-safe">24.3 / 100</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-3">Gas Level Trends (Last Hour)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={gasHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Line type="monotone" dataKey="mq2" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="mq135" stroke="hsl(var(--safe))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-background rounded border border-border">
        📡 Data source: Fixed IoT Node (Main Sensor Unit)
      </div>
    </div>
  );

  const renderTemperatureDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary p-4 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Current Temperature</div>
          <div className="text-2xl font-bold">25.0°C</div>
          <div className="text-xs text-safe mt-1">Normalized: 42/100</div>
        </div>
        <div className="bg-secondary p-4 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Current Humidity</div>
          <div className="text-2xl font-bold">47%</div>
          <div className="text-xs text-muted-foreground mt-1">Normal range</div>
        </div>
      </div>

      <div className="bg-secondary p-4 rounded-lg">
        <div className="text-sm font-semibold mb-2">Last 30 Minutes</div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Min Temperature</span>
            <span className="font-semibold">24.5°C</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Max Temperature</span>
            <span className="font-semibold">25.3°C</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Average</span>
            <span className="font-semibold">24.9°C</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-3">Temperature Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={tempHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[23, 27]} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Line type="monotone" dataKey="temp" stroke="hsl(var(--danger))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-background rounded border border-border">
        🌡️ Data source: DHT22 Sensor on IoT Node
      </div>
    </div>
  );

  const renderFireDetails = () => (
    <div className="space-y-6">
      <div className="bg-secondary p-4 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Flame Sensor Status</div>
        <div className="text-2xl font-bold text-safe">No Fire Detected</div>
        <div className="text-xs text-muted-foreground mt-2">Last check: {new Date().toLocaleTimeString()}</div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-3">Recent Fire Alerts (Last 24h)</div>
        <div className="space-y-2">
          {[
            { time: "2025-11-15 14:23:10", status: "False Alarm", reason: "Sunlight reflection" },
            { time: "2025-11-14 09:15:42", status: "False Alarm", reason: "Sensor calibration" },
          ].map((alert, idx) => (
            <div key={idx} className="bg-background p-3 rounded border border-border">
              <div className="flex justify-between items-start mb-1">
                <div className="text-xs font-semibold">{alert.time}</div>
                <div className="text-xs px-2 py-0.5 bg-safe/20 text-safe rounded">{alert.status}</div>
              </div>
              <div className="text-xs text-muted-foreground">{alert.reason}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-background rounded border border-border">
        🔥 Data source: IR Flame Sensor Module
      </div>
    </div>
  );

  const renderMotionDetails = () => (
    <div className="space-y-6">
      <div className="bg-secondary p-4 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Current Status</div>
        <div className="text-2xl font-bold text-safe">No Motion</div>
        <div className="text-xs text-muted-foreground mt-2">Zone secure</div>
      </div>

      <div className="bg-secondary p-4 rounded-lg">
        <div className="text-sm font-semibold mb-2">Last Detection</div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span className="font-semibold">17:23:45</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-semibold">~2 minutes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Zone</span>
            <span className="font-semibold">Zone A</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-background rounded border border-border">
        👤 Data source: PIR Motion Sensor
      </div>
    </div>
  );

  const getTitle = () => {
    switch (sensorType) {
      case "gas":
        return "Gas & Air Quality – Detailed View";
      case "temperature":
        return "Temperature & Humidity – Detailed View";
      case "fire":
        return "Fire Detection – Detailed View";
      case "motion":
        return "Human Presence – Detailed View";
      default:
        return "Sensor Details";
    }
  };

  const renderContent = () => {
    switch (sensorType) {
      case "gas":
        return renderGasDetails();
      case "temperature":
        return renderTemperatureDetails();
      case "fire":
        return renderFireDetails();
      case "motion":
        return renderMotionDetails();
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{getTitle()}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
};
