# 🔍 AROHAN SYSTEM LOGIC - COMPLETE ANALYSIS
## Part 1: Sensor Data Flow

---

## 1. SENSOR DATA FLOW (ALL SENSORS)

### 📡 **Data Source: Firebase Realtime Database**

**Firebase Path**: `/AROHAN/iot`

All sensor data comes from Firebase Realtime Database, pushed by ESP32/Arduino IoT device.

---

### **MQ-2 Gas Sensor (Continuous Analog)**

#### **Raw Data Source**:
- **Firebase Path**: `/AROHAN/iot/mq2`
- **Data Type**: `number` (PPM - Parts Per Million)
- **Range**: 0-1023 (raw ADC) or calibrated PPM value

#### **Reading & Processing**:
**File**: `frontend/src/hooks/useIoTReadings.ts` (Line 60-61)
```typescript
mq2: Number(val.mq2) || 0,
```

**Normalization**:
**File**: `frontend/src/lib/hazardScore.ts` (Line 14-24, 96-98)
```typescript
// Sensor range defined
DEFAULT_SENSOR_RANGES = {
  mq2: { min: 200, max: 800 }  // PPM range
}

// Normalization formula
normalize(value, min, max) {
  normalized = (100 * (value - min)) / (max - min)
  return Math.max(0, Math.min(100, normalized))
}

// For MQ-2:
normMQ2 = normalize(mq2, 200, 800)
// Example: mq2=500 → (100*(500-200))/(800-200) = 50
```

**Status Labels**:
**File**: `frontend/src/lib/sensorData.ts` (Line 177-182)
```typescript
getMQ2Status(normalized: number): string {
  if (normalized < 30) return 'Normal';      // 0-29
  if (normalized < 50) return 'Elevated';    // 30-49
  if (normalized < 70) return 'High';        // 50-69
  return 'Critical';                         // 70-100
}
```

---

### **MQ-135 Air Quality Sensor (DUAL CONFIGURATION)**

#### **Fixed IoT Node - Binary Threshold**:
- **Firebase Path**: `/AROHAN/iot/mq135_digital`
- **Data Type**: `0 | 1` (binary threshold)
- **Meaning**: 
  - `0` = Air quality OK (below threshold)
  - `1` = Air quality ALERT (threshold exceeded)

#### **Rover Node - Continuous Analog**:
- **Firebase Path**: `/AROHAN/rover/sensors/mq135`
- **Data Type**: `number` (PPM - Parts Per Million)
- **Range**: 300-1000 PPM

#### **Reading & Processing**:

**Fixed IoT** - `frontend/src/hooks/useIoTReadings.ts` (Line 62-64):
```typescript
mq135: Number(val.mq135) || 0,  // Legacy field
mq135_raw: (val.mq135_raw == 1) ? 1 : 0,
mq135_digital: (val.mq135_digital == 1) ? 1 : 0,  // PRIMARY
```

**Rover** - `frontend/src/hooks/useRoverSensors.ts` + `frontend/src/lib/firebaseService.ts` (Line 28-33):
```typescript
// Subscribes to /AROHAN/rover/sensors
RoverSensors {
  mq135: number  // Continuous PPM value
}
```

#### **Normalization - DUAL LOGIC**:
**File**: `frontend/src/lib/sensorData.ts` (Line 68-82)

```typescript
normalizeMQ135(value, source, isBinary) {
  if (source === 'fixed' && isBinary) {
    // Fixed IoT: Binary → 0 or 100
    return value === 1 ? 100 : 0;
  } else {
    // Rover: Continuous → normalized 0-100
    min = 300, max = 1000  // PPM range
    normalized = (100 * (value - 300)) / (1000 - 300)
    return Math.max(0, Math.min(100, normalized))
  }
}

// Examples:
// Fixed: 0 → 0,  Fixed: 1 → 100
// Rover: 300 → 0,  Rover: 650 → 50,  Rover: 1000 → 100
```

#### **Effective MQ-135 (Worst-Case)**:
**File**: `frontend/src/lib/sensorData.ts` (Line 88-102)

```typescript
getEffectiveMQ135(fixedReading, roverReading) {
  fixedNormalized = normalizeMQ135(fixedReading, 'fixed', true)
  
  if (roverReading === null) {
    return fixedNormalized  // Rover offline, use fixed only
  }
  
  roverNormalized = normalizeMQ135(roverReading, 'rover', false)
  
  // Return MAXIMUM (worst-case)
  return Math.max(fixedNormalized, roverNormalized)
}

// Example:
// Fixed=1 (100), Rover=450 PPM (21.4) → Effective=100
// Fixed=0 (0), Rover=850 PPM (78.6) → Effective=78.6
```

**Status Labels**:
**File**: `frontend/src/lib/sensorData.ts` (Line 188-190)
```typescript
getMQ135Status(digital: 0 | 1): string {
  return digital === 1 ? 'Threshold Exceeded' : 'Normal';
}
```

---

### **Temperature Sensor**

#### **Raw Data Source**:
- **Firebase Path**: `/AROHAN/iot/temperature`
- **Data Type**: `number` (°C - Celsius)
- **Sensor**: DHT22

#### **Reading & Processing**:
**File**: `frontend/src/hooks/useIoTReadings.ts` (Line 67)
```typescript
temperature: Number(val.temperature) || 0,
```

#### **Normalization**:
**File**: `frontend/src/lib/hazardScore.ts` (Line 14-24)
```typescript
DEFAULT_SENSOR_RANGES = {
  temp: { min: 20, max: 50 }  // °C range
}

normTemp = normalize(temperature, 20, 50)
// Example: temp=35°C → (100*(35-20))/(50-20) = 50
```

#### **Thresholds**:
**File**: `frontend/src/pages/Dashboard.tsx` (Line 115-119)
```typescript
getTempStatus(): 'SAFE' | 'WARNING' | 'DANGER' {
  if (temperature < 30) return 'SAFE';      // < 30°C
  if (temperature < 35) return 'WARNING';   // 30-34°C
  return 'DANGER';                          // ≥ 35°C
}
```

**Chart Reference Lines**:
**File**: `frontend/src/pages/Dashboard.tsx` (Line 455-456)
```typescript
<ReferenceLine y={30} stroke="warning" label="Warning" />
<ReferenceLine y={35} stroke="danger" label="Danger" />
```

---

### **Humidity Sensor**

#### **Raw Data Source**:
- **Firebase Path**: `/AROHAN/iot/humidity`
- **Data Type**: `number` (% - Percentage)
- **Sensor**: DHT22

#### **Reading & Processing**:
**File**: `frontend/src/hooks/useIoTReadings.ts` (Line 68)
```typescript
humidity: Number(val.humidity) || 0,
```

#### **Status Labels**:
**File**: `frontend/src/components/SensorDetailDrawer.tsx` (Line 253)
```typescript
humidity < 30 ? 'Dry' : humidity < 60 ? 'Normal' : 'Humid'
```

**No normalization** - Humidity is NOT used in hazard score calculation.

---

### **Flame Sensor (Fire Detection)**

#### **Raw Data Source**:
- **Firebase Path**: `/AROHAN/iot/flame`
- **Data Type**: `boolean` (true/false)
- **Sensor**: IR Flame Sensor Module

#### **Reading & Processing**:
**File**: `frontend/src/hooks/useIoTReadings.ts` (Line 71)
```typescript
flame: Boolean(val.flame),
```

#### **Status Logic**:
**File**: `frontend/src/pages/Dashboard.tsx` (Line 121-123)
```typescript
getFireStatus(): 'SAFE' | 'DANGER' {
  return flame ? 'DANGER' : 'SAFE';
}
```

**Alert Trigger**:
**File**: `frontend/src/services/clientMonitoring.ts` (Line 103-115)
```typescript
// Fire detection - CRITICAL
if (data.flame && !before.flame) {
  createAlert({
    type: 'Fire Detected',
    severity: 'critical',  // HIGHEST SEVERITY
    summary: '🔥 Flame sensor triggered - immediate evacuation required!'
  });
}
```

**No normalization** - Flame is NOT used in hazard score calculation (binary alert only).

---

### **Motion Sensor (Human Presence)**

#### **Raw Data Source**:
- **Firebase Path**: `/AROHAN/iot/motion`
- **Data Type**: `boolean` (true/false)
- **Sensor**: PIR Motion Sensor

#### **Reading & Processing**:
**File**: `frontend/src/hooks/useIoTReadings.ts` (Line 72)
```typescript
motion: Boolean(val.motion),
```

#### **Status Logic**:
**File**: `frontend/src/pages/Dashboard.tsx` (Line 125-127)
```typescript
getMotionStatus(): 'SAFE' | 'WARNING' {
  return motion ? 'WARNING' : 'SAFE';
}
```

**Alert Trigger**:
**File**: `frontend/src/services/clientMonitoring.ts` (Line 185-194)
```typescript
// Motion detected - LOW SEVERITY
if (data.motion && !before.motion) {
  createAlert({
    type: 'Motion Detected',
    severity: 'low',
    summary: '👤 Motion detected in monitored area'
  });
}
```

**No normalization** - Motion is NOT used in hazard score calculation.

---

## 📊 **SUMMARY: Sensor Data Pipeline**

```
ESP32/Arduino IoT Device
    ↓
Firebase Realtime Database (/AROHAN/iot)
    ↓
useIoTReadings() hook (subscribes, normalizes)
    ↓
Components (Dashboard, Drawers)
    ↓
Display + Hazard Score Calculation
```

### **Sensors Used in Hazard Score**:
1. ✅ **MQ-135** (60% weight) - Air quality
2. ✅ **MQ-2** (30% weight) - Gas detection
3. ✅ **Temperature** (10% weight) - Environmental

### **Sensors NOT in Hazard Score**:
- ❌ **Humidity** - Display only
- ❌ **Flame** - Binary alert only
- ❌ **Motion** - Binary alert only

---

**Next**: Part 2 - Graph/Chart Logic
