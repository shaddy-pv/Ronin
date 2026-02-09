# MQ-135 Dual Configuration Guide

## Overview
The AROHAN Command Center uses a **dual MQ-135 configuration** to provide both threshold-based alerts and continuous air quality monitoring:

- **Fixed IoT Node**: Binary threshold (0/1) from digital output
- **Rover Node**: Continuous analog reading (PPM) for verification

## Why This Design?

### Fixed IoT Node (Threshold-Based)
- **Wiring**: MQ-135 connected to digital output pin
- **Reading**: Binary (0 or 1)
- **Purpose**: Simple, reliable threshold alert
- **Advantage**: No need to rewire existing hardware
- **Normalized**: 0 → 0/100, 1 → 100/100

### Rover Node (Continuous)
- **Wiring**: MQ-135 connected to analog input pin
- **Reading**: Continuous (0-1000 PPM)
- **Purpose**: Detailed air quality measurement for verification
- **Advantage**: Provides granular data for analysis
- **Normalized**: Linear scale 300-1000 PPM → 0-100

## Hazard Score Calculation

### Effective MQ-135 Formula
```typescript
effectiveMQ135 = max(fixedNormalized, roverNormalized)
```

This uses the **worst-case** reading to ensure safety:
- If fixed threshold is exceeded (100), use 100
- If rover shows high continuous reading, use that normalized value
- Take the maximum of both for conservative hazard assessment

### Example Scenarios

#### Scenario 1: Both Normal
- Fixed: 0 (threshold not exceeded) → normalized 0
- Rover: 350 PPM → normalized 7.1
- **Effective**: max(0, 7.1) = **7.1**
- **Hazard Contribution**: 7.1 × 0.6 = **4.3 points**

#### Scenario 2: Fixed Alert, Rover Moderate
- Fixed: 1 (threshold exceeded) → normalized 100
- Rover: 450 PPM → normalized 21.4
- **Effective**: max(100, 21.4) = **100**
- **Hazard Contribution**: 100 × 0.6 = **60 points**

#### Scenario 3: Fixed Normal, Rover High
- Fixed: 0 (threshold not exceeded) → normalized 0
- Rover: 850 PPM → normalized 78.6
- **Effective**: max(0, 78.6) = **78.6**
- **Hazard Contribution**: 78.6 × 0.6 = **47.2 points**

#### Scenario 4: Rover Not Connected
- Fixed: 1 (threshold exceeded) → normalized 100
- Rover: null (not available)
- **Effective**: 100 (fallback to fixed only)
- **Hazard Contribution**: 100 × 0.6 = **60 points**

## UI Display

### MQ-135 Detail View

#### Current Readings Section
```
┌─────────────────────────────────────────────────────────┐
│ Fixed IoT Node (Threshold-Based)  │  Rover Node (Continuous) │
│ ✓ OK                               │  450 PPM                 │
│ Digital: 0                         │  Normalized: 21.4/100    │
│ Normalized: 0/100                  │  Moderate                │
└─────────────────────────────────────────────────────────┘
```

#### Hazard Contribution Section
```
MQ-135 Weight: 60% (Primary)
Fixed (Threshold): 0/100
Rover (Continuous): 21.4/100
Effective (max): 21.4/100
─────────────────────────────
Contribution: 12.8 points

ℹ️ Hazard score uses max(fixed, rover) for worst-case assessment
```

#### Comparison Chart
- **Green line (step)**: Fixed IoT threshold (0 or 100)
- **Blue line (smooth)**: Rover continuous (0-100 normalized)
- **Y-axis**: Normalized value (0-100)
- **Legend**: Clearly labels each source

## Firebase Data Structure

### Fixed IoT Node
```json
{
  "AROHAN": {
    "iot": {
      "mq135_digital": 0,  // Binary: 0 or 1
      "mq135_raw": 0,      // Raw digital reading
      "mq135": 0,          // Legacy field (may contain digital value)
      ...
    }
  }
}
```

### Rover Node
```json
{
  "AROHAN": {
    "rover": {
      "sensors": {
        "mq135": 450,      // Continuous analog: 0-1000 PPM
        "mq2": 250,
        "temperature": 24.5,
        "humidity": 55,
        "timestamp": 1701234567890
      }
    }
  }
}
```

## Implementation Files

### Core Logic
- **`frontend/src/lib/sensorData.ts`**
  - `normalizeMQ135()` - Handles both binary and continuous
  - `getEffectiveMQ135()` - Calculates max(fixed, rover)
  - `calculateHazardContribution()` - Uses effective value

### Data Fetching
- **`frontend/src/hooks/useRoverSensors.ts`**
  - Subscribes to `/AROHAN/rover/sensors`
  - Returns rover sensor data including continuous MQ-135

### UI Components
- **`frontend/src/components/SensorDetailDrawer.tsx`**
  - `renderMQ135Details()` - Shows dual configuration
  - Comparison chart with both lines
  - Clear labeling of threshold vs continuous

### Type Definitions
- **`frontend/src/types/sensors.ts`**
  - `MQ135Reading` - Supports both digital and analog
  - `SensorSource` - 'fixed' | 'rover'

## Testing Checklist

### Manual Testing
- [ ] Fixed IoT shows binary status (OK or ALERT)
- [ ] Rover shows continuous PPM reading when connected
- [ ] Rover shows "N/A" when not connected
- [ ] Effective value is max(fixed, rover)
- [ ] Chart shows green step line for fixed
- [ ] Chart shows blue smooth line for rover
- [ ] Hazard contribution uses effective value
- [ ] Legend clearly labels each source

### Data Validation
- [ ] Fixed normalized: 0 → 0, 1 → 100
- [ ] Rover normalized: (value - 300) / 700 × 100
- [ ] Effective = max(fixedNorm, roverNorm)
- [ ] Contribution = effective × 0.6

## Integration Steps

### Step 1: Connect Rover to Firebase
Ensure rover is sending data to `/AROHAN/rover/sensors`:
```json
{
  "mq135": 450,  // Continuous analog reading
  "mq2": 250,
  "temperature": 24.5,
  "humidity": 55,
  "timestamp": 1701234567890
}
```

### Step 2: Verify Data Flow
1. Open browser console
2. Check for rover sensor data in Firebase
3. Verify `useRoverSensors()` hook receives data
4. Confirm MQ-135 detail view shows rover reading

### Step 3: Test Scenarios
1. **Both Normal**: Fixed=0, Rover=350 → Effective=7.1
2. **Fixed Alert**: Fixed=1, Rover=450 → Effective=100
3. **Rover High**: Fixed=0, Rover=850 → Effective=78.6
4. **Rover Offline**: Fixed=1, Rover=null → Effective=100

## Benefits of This Approach

### 1. No Hardware Changes
- Fixed IoT wiring remains unchanged
- No need to rewire digital to analog

### 2. Best of Both Worlds
- Fixed: Simple, reliable threshold alert
- Rover: Detailed, continuous verification

### 3. Conservative Safety
- Uses worst-case reading (max)
- Never underestimates hazard level

### 4. Clear Verification Story
- UI clearly shows both readings
- Easy to see if rover confirms fixed alert
- Transparent data sources

### 5. Future-Proof
- Can add more rover units
- Can upgrade fixed to analog later if needed
- Extensible architecture

## Troubleshooting

### Rover Shows N/A
- Check Firebase path: `/AROHAN/rover/sensors`
- Verify rover is online and sending data
- Check `useRoverSensors()` hook in console

### Effective Value Seems Wrong
- Verify fixed normalized: 0 or 100 only
- Verify rover normalized: 0-100 range
- Check max() calculation in `getEffectiveMQ135()`

### Chart Not Showing Rover Line
- Ensure rover data in chart history
- Check `chartData` includes `roverMQ135`
- Verify rover timestamp matches history

## Future Enhancements

### Short Term
1. Add rover history to chart
2. Show divergence alerts (fixed vs rover mismatch)
3. Add rover connection status indicator

### Long Term
1. Support multiple rover units
2. ML-based anomaly detection
3. Predictive air quality modeling
4. Historical trend analysis

---

**Last Updated**: November 30, 2025
**Version**: 2.0.0 (Dual Configuration)
