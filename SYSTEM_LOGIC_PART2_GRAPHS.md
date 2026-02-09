# 🔍 AROHAN SYSTEM LOGIC - COMPLETE ANALYSIS
## Part 2: Graph/Chart Logic

---

## 2. GRAPH / CHART LOGIC

### 📊 **Chart 1: Gas Sensor Trends (Dashboard)**

**Location**: `frontend/src/pages/Dashboard.tsx` (Line 407-448)

#### **Data Array Used**:
```typescript
const [gasHistory, setGasHistory] = useState<Array<{
  time: string;
  mq2: number;
  mq135: number;
}>>([]);
```

#### **How Data is Built**:
**File**: `frontend/src/pages/Dashboard.tsx` (Line 70-92)

**Step 1**: Load initial history from Firebase
```typescript
useEffect(() => {
  if (history && history.length > 0) {
    const last10 = history.slice(0, 10).reverse();
    
    const gasData = last10.map(log => ({
      time: new Date(log.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      mq2: log.mq2,
      mq135: log.mq135  // Binary 0 or 1 from history
    }));
    
    setGasHistory(gasData);
  }
}, [history]);
```

**Step 2**: Add real-time updates
```typescript
useEffect(() => {
  if (iotReadings) {
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setGasHistory(prev => {
      const updated = [...prev, {
        time: currentTime,
        mq2: iotReadings.mq2,
        mq135: iotReadings.mq135_digital  // Binary 0 or 1
      }];
      return updated.slice(-10);  // Keep last 10 points
    });
  }
}, [iotReadings?.mq2, iotReadings?.mq135_digital]);
```

#### **Timestamp Generation**:
- **Source**: `iotReadings.status.lastHeartbeat` (from Firebase)
- **Format**: `toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })`
- **Example**: "07:05 PM"
- **Update Frequency**: Every time Firebase sends new data

#### **Chart Lines**:
**File**: `frontend/src/pages/Dashboard.tsx` (Line 427-428)

1. **MQ-2 (Gas)** - Blue line
   ```typescript
   <Line 
     type="monotone" 
     dataKey="mq2" 
     stroke="hsl(var(--primary))"  // Blue
     strokeWidth={2} 
     dot={false} 
     name="MQ-2 (Gas)" 
   />
   ```

2. **MQ-135 (Threshold)** - Green step line
   ```typescript
   <Line 
     type="stepAfter"  // Step line for binary data
     dataKey="mq135" 
     stroke="hsl(var(--safe))"  // Green
     strokeWidth={2} 
     dot={true} 
     name="MQ-135 (Threshold)" 
   />
   ```

#### **Reference Lines (Thresholds)**:
```typescript
<ReferenceLine y={500} stroke="warning" label="MQ-2 Warning" />
<ReferenceLine y={700} stroke="danger" label="MQ-2 Danger" />
```

**Threshold Values**:
- **Warning**: 500 PPM (raw value, not normalized)
- **Danger**: 700 PPM (raw value, not normalized)

---

### 📊 **Chart 2: Temperature & Humidity Trends (Dashboard)**

**Location**: `frontend/src/pages/Dashboard.tsx` (Line 450-478)

#### **Data Array Used**:
```typescript
const [tempHistory, setTempHistory] = useState<Array<{
  time: string;
  temp: number;
  humidity: number;
}>>([]);
```

#### **How Data is Built**:
Same pattern as Gas Sensor Trends:

**Step 1**: Load from Firebase history
```typescript
const tempData = last10.map(log => ({
  time: new Date(log.timestamp).toLocaleTimeString(...),
  temp: log.temperature,
  humidity: 0  // History doesn't store humidity
}));
```

**Step 2**: Add real-time updates
```typescript
setTempHistory(prev => {
  const updated = [...prev, {
    time: currentTime,
    temp: iotReadings.temperature,
    humidity: iotReadings.humidity
  }];
  return updated.slice(-10);  // Keep last 10
});
```

#### **Chart Lines**:
1. **Temperature** - Red line
   ```typescript
   <Line 
     type="monotone" 
     dataKey="temp" 
     stroke="hsl(var(--danger))"  // Red
     strokeWidth={2} 
     dot={false} 
   />
   ```

2. **Humidity** - Blue line
   ```typescript
   <Line 
     type="monotone" 
     dataKey="humidity" 
     stroke="hsl(var(--primary))"  // Blue
     strokeWidth={2} 
     dot={false} 
   />
   ```

#### **Reference Lines**:
```typescript
<ReferenceLine y={30} stroke="warning" label="Warning" />
<ReferenceLine y={35} stroke="danger" label="Danger" />
```

**Threshold Values**:
- **Warning**: 30°C
- **Danger**: 35°C

---

### 📊 **Chart 3: MQ-2 Trends (Detail Drawer)**

**Location**: `frontend/src/components/SensorDetailDrawer.tsx` (Line 95-130)

#### **Data Array Used**:
```typescript
// NEW: Uses real-time hook
const { chartData } = useRealtimeChartData({
  windowMinutes: 60,
  maxPoints: 20
});

// chartData structure:
{
  timestamp: number,
  time: string,  // "07:05 PM"
  fixedMQ2: number,
  roverMQ2: number | null
}
```

#### **How Data is Built**:
**File**: `frontend/src/hooks/useRealtimeChartData.ts` (Line 40-70)

```typescript
useEffect(() => {
  if (!iotReadings) return;

  const newDataPoint = {
    timestamp: iotReadings.status?.lastHeartbeat || Date.now(),
    time: formatChartTime(timestamp),  // "07:05 PM"
    fixedMQ2: iotReadings.mq2,
    roverMQ2: roverSensors?.mq2 ?? null
  };

  setChartData(prev => {
    const updated = [...prev, newDataPoint];
    // Apply time window (60 min) and limit (20 points)
    return buildTimeSeries(updated, 60, 20);
  });
}, [iotReadings?.mq2, roverSensors?.mq2]);
```

#### **Time Window Filtering**:
**File**: `frontend/src/lib/chartUtils.ts` (Line 25-45)
```typescript
buildTimeSeries(data, windowMinutes=60, maxPoints=20) {
  const now = Date.now();
  const cutoffTime = now - (windowMinutes * 60 * 1000);
  
  // Filter: Keep only last 60 minutes
  const filtered = data.filter(point => 
    point.timestamp >= cutoffTime
  );
  
  // Sort by timestamp (oldest first)
  const sorted = filtered.sort((a, b) => 
    a.timestamp - b.timestamp
  );
  
  // Limit to 20 most recent points
  return sorted.slice(-20);
}
```

#### **Chart Lines**:
1. **Fixed IoT** - Green line
   ```typescript
   <Line 
     dataKey="fixedMQ2" 
     stroke="hsl(var(--safe))"  // Green
     name="Fixed IoT Node" 
   />
   ```

2. **Rover** - Blue line (dashed if offline)
   ```typescript
   <Line 
     dataKey="roverMQ2" 
     stroke="hsl(var(--primary))"  // Blue
     name={isRoverConnected ? "Rover" : "Rover (N/A)"}
     strokeDasharray={isRoverConnected ? "0" : "5 5"}
   />
   ```

#### **X-Axis Formatting**:
```typescript
<XAxis 
  dataKey="time"  // Uses pre-formatted "07:05 PM"
  interval={tickInterval}  // Auto-calculated spacing
  angle={-45}  // Angled to prevent overlap
  textAnchor="end"
  height={60}
/>
```

**Tick Interval Calculation**:
**File**: `frontend/src/lib/chartUtils.ts` (Line 60-67)
```typescript
getOptimalTickInterval(dataLength) {
  if (dataLength <= 5) return 1;   // Show all
  if (dataLength <= 10) return 2;  // Every 2nd
  if (dataLength <= 20) return 4;  // Every 4th
  return Math.ceil(dataLength / 5); // ~5 ticks
}
```

---

### 📊 **Chart 4: MQ-135 Comparison (Detail Drawer)**

**Location**: `frontend/src/components/SensorDetailDrawer.tsx` (Line 195-245)

#### **Data Array Used**:
Same as MQ-2 chart - `useRealtimeChartData()` hook

```typescript
{
  timestamp: number,
  time: string,
  fixedMQ135: number,  // Binary 0 or 1
  roverMQ135: number | null  // Continuous PPM
}
```

#### **Chart Lines with DUAL Y-AXIS**:

1. **Fixed IoT (Binary)** - Green step line, LEFT Y-axis
   ```typescript
   <YAxis 
     domain={[0, 1]}  // Binary scale
     ticks={[0, 1]}
     label="Status (0=OK, 1=Alert)"
   />
   
   <Line 
     type="stepAfter"  // Step line for binary
     dataKey="fixedMQ135" 
     stroke="hsl(var(--safe))"  // Green
     name="Fixed IoT (Threshold)" 
   />
   ```

2. **Rover (Continuous)** - Blue smooth line, RIGHT Y-axis
   ```typescript
   <YAxis 
     yAxisId="right"
     orientation="right"
     domain={[0, 1000]}  // PPM scale
     label="PPM"
   />
   
   <Line 
     type="monotone"  // Smooth line for continuous
     dataKey="roverMQ135" 
     stroke="hsl(var(--primary))"  // Blue
     yAxisId="right"  // Use right Y-axis
     name="Rover (Continuous)" 
   />
   ```

#### **Tooltip Formatting**:
```typescript
formatter={(value, name) => {
  if (name.includes('Fixed')) {
    return [value === 1 ? 'Alert' : 'OK', name];
  }
  if (value !== null) {
    const normalized = normalizeMQ135(value, 'rover', false);
    return [`${value} PPM (${normalized.toFixed(0)}/100)`, name];
  }
  return ['N/A', name];
}}
```

**Example Tooltip**:
- Fixed: "Alert" or "OK"
- Rover: "450 PPM (21/100)"

---

## ⏱️ **TIME HANDLING ACROSS ALL CHARTS**

### **Timestamp Source**:
**File**: `frontend/src/hooks/useIoTReadings.ts` (Line 78-79)
```typescript
status: {
  lastHeartbeat: Number(val.status?.lastHeartbeat) || Date.now()
}
```

### **Time Formatting Function**:
**File**: `frontend/src/lib/chartUtils.ts` (Line 14-21)
```typescript
formatChartTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true  // AM/PM format
  });
}
// Example: 1701234567890 → "07:05 PM"
```

### **Time Window**:
- **Dashboard Charts**: Last 10 data points (no time filtering)
- **Drawer Charts**: Last 60 minutes, max 20 points

### **Update Frequency**:
- Updates whenever Firebase sends new data
- No fixed interval - event-driven
- Typically every few seconds from IoT device

---

**Next**: Part 3 - Math Modeling & Hazard Score
