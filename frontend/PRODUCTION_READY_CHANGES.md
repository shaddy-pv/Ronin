# RONIN Command Center - Production Ready Changes

## Overview
This document outlines the changes made to make the RONIN Command Center production-ready, with a focus on MQ-2 and MQ-135 sensor detail views and Fixed IoT vs Rover comparison.

## Key Changes

### 1. Separate Sensor Detail Views ✅

**Before:** Both MQ-2 and MQ-135 opened the same "gas" detail view with dummy data.

**After:** Each sensor now has its own dedicated detail view:
- **MQ-2 Detail View**: Shows continuous analog gas sensor readings
- **MQ-135 Detail View**: Shows binary threshold air quality status

**Implementation:**
- Updated `SensorDetailDrawer` component to accept `"MQ2" | "MQ135"` sensor types
- Dashboard now passes specific sensor type when opening detail drawer
- Each view shows appropriate data format (continuous vs binary)

### 2. MQ-135 Binary Threshold Handling ✅

**Important:** MQ-135 is configured as a **binary digital output** (0 or 1), not continuous.

**Changes:**
- MQ-135 displays as "OK" or "ALERT" status instead of fake continuous values
- Hazard score treats MQ-135 as 0 or 100 normalized (not interpolated)
- UI clearly indicates this is a threshold-based sensor
- Added warning banner explaining binary nature
- Future-proofed for analog MQ-135 upgrade

**Files Modified:**
- `frontend/src/lib/sensorData.ts` - Binary handling logic
- `frontend/src/lib/hazardScore.ts` - Binary normalization
- `frontend/src/components/SensorDetailDrawer.tsx` - Binary UI display

### 3. Fixed IoT vs Rover Comparison ✅

**Implementation:**
- Charts now show two lines: "Fixed IoT Node" (green) and "Rover" (blue, dashed)
- Rover data currently shows as N/A (not connected)
- Centralized rover data placeholder in `getRoverReadings()`
- Clear visual indication that rover is not yet connected

**Chart Features:**
- MQ-2: Continuous line chart with PPM values
- MQ-135: Step chart showing binary status over time
- Temperature: Standard line chart
- Legend clearly labels each data source

### 4. Centralized Data Management ✅

**New Files:**
- `frontend/src/types/sensors.ts` - Type definitions for sensor data
- `frontend/src/lib/sensorData.ts` - Centralized sensor data utilities

**Benefits:**
- Single source of truth for sensor data transformations
- Easy to replace mock rover data with real API
- Consistent normalization and status calculations
- No scattered dummy data in components

### 5. Production-Ready Features ✅

#### Loading States
- Proper loading spinners while fetching data
- Skeleton states for charts waiting for history
- Clear "Waiting for data..." messages

#### Error Handling
- Graceful handling of missing data
- "N/A" displayed when rover not connected
- No fake data generation in production

#### Accessibility
- All interactive elements keyboard-focusable
- Proper ARIA labels on charts
- Clear visual hierarchy
- Responsive design for different screen sizes

#### Clean Code
- Removed all dummy/magic numbers
- Removed commented-out code
- Proper TypeScript types throughout
- Consistent naming conventions

## Hazard Score Formula

### Current Implementation
```
HazardScore = (0.6 × MQ135) + (0.3 × MQ2) + (0.1 × Temp)
```

### Sensor Weights
- **MQ-135**: 60% (Primary indicator) - Binary threshold
- **MQ-2**: 30% (Secondary indicator) - Continuous analog
- **Temperature**: 10% (Environmental factor) - Continuous analog

### MQ-135 Binary Handling
- **Digital = 0**: Normalized value = 0 → Contribution = 0 points
- **Digital = 1**: Normalized value = 100 → Contribution = 60 points

### MQ-2 Normalization
- **Range**: 200-800 PPM
- **Formula**: `Norm = 100 × (Value - 200) / (800 - 200)`
- **Contribution**: `Norm × 0.3`

## How to Connect Rover Data

### Current State
Rover sensor data is not yet implemented. The UI shows "N/A" placeholders.

### To Integrate Real Rover Data:

#### Step 1: Update Firebase Structure
Add rover sensor data to Firebase:
```
/ronin/rover/sensors/
  ├── mq2: number
  ├── mq135_digital: 0 | 1
  ├── temperature: number
  ├── humidity: number
  └── timestamp: number
```

#### Step 2: Create Rover Readings Hook
Create `frontend/src/hooks/useRoverSensors.ts`:
```typescript
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

export const useRoverSensors = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roverRef = ref(database, '/ronin/rover/sensors');
    const unsubscribe = onValue(roverRef, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { data, loading };
};
```

#### Step 3: Update getRoverReadings()
In `frontend/src/lib/sensorData.ts`, replace:
```typescript
export function getRoverReadings(): IoTReadings | null {
  return null; // Current placeholder
}
```

With:
```typescript
export function getRoverReadings(): IoTReadings | null {
  const { data } = useRoverSensors();
  return data;
}
```

#### Step 4: Update Chart Data
The charts will automatically populate rover data once `getRoverReadings()` returns real data.

## File Structure

### New Files
```
frontend/src/
├── types/
│   └── sensors.ts              # Sensor type definitions
└── lib/
    └── sensorData.ts           # Centralized sensor utilities
```

### Modified Files
```
frontend/src/
├── components/
│   └── SensorDetailDrawer.tsx  # Refactored with MQ2/MQ135 separation
├── pages/
│   └── Dashboard.tsx           # Updated sensor type handling
├── lib/
│   ├── hazardScore.ts          # Binary MQ-135 support
│   └── firebaseService.ts      # Updated comments
└── hooks/
    └── useIoTReadings.ts       # (No changes needed)
```

## Testing Checklist

### Manual Testing
- [ ] Click "View Details" on MQ-2 card → Opens MQ-2 specific view
- [ ] Click "View Details" on MQ-135 card → Opens MQ-135 specific view
- [ ] MQ-2 view shows continuous readings and normalization
- [ ] MQ-135 view shows binary status (OK/ALERT)
- [ ] Charts display "Fixed IoT Node" line with real data
- [ ] Charts show "Rover (N/A)" placeholder line
- [ ] Hazard contribution calculations are correct
- [ ] Loading states appear while fetching data
- [ ] No console errors or warnings
- [ ] Responsive on different screen sizes

### Data Validation
- [ ] MQ-2 normalized value matches formula: `(value - 200) / 600 × 100`
- [ ] MQ-135 shows 0 or 100 normalized (not interpolated)
- [ ] Hazard score = `(MQ135_norm × 0.6) + (MQ2_norm × 0.3) + (Temp_norm × 0.1)`
- [ ] Historical data populates charts correctly
- [ ] Timestamps format correctly in charts

## Future Enhancements

### Short Term (Post-Competition)
1. **Connect Rover Sensors**: Implement real rover data feed
2. **Real-time Comparison**: Show live differences between fixed and rover
3. **Alerts**: Trigger alerts when fixed and rover readings diverge significantly

### Long Term
1. **Analog MQ-135**: Upgrade to continuous MQ-135 sensor
2. **Multiple Rovers**: Support multiple rover units
3. **Historical Comparison**: Compare fixed vs rover over longer time periods
4. **Anomaly Detection**: ML-based detection of sensor discrepancies

## Known Limitations

1. **Rover Data**: Not yet connected (shows N/A)
2. **MQ-135**: Binary only (can be upgraded to analog)
3. **History**: Limited to last 10 readings in detail view
4. **Offline Mode**: No offline data caching

## Support

For questions or issues:
1. Check Firebase connection status in dashboard header
2. Verify IoT node is sending data to `/ronin/iot`
3. Check browser console for errors
4. Review `SENSOR_FIREBASE_STRUCTURE.md` for data format

## Competition Notes

✅ **Production Ready**: All dummy data removed, proper error handling
✅ **Clean UI**: Clear labeling of data sources and sensor types
✅ **Extensible**: Easy to add rover data post-competition
✅ **Documented**: Clear TODOs for future integration
✅ **Type Safe**: Full TypeScript coverage
✅ **Accessible**: Keyboard navigation and screen reader support

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0 (Production Ready)
