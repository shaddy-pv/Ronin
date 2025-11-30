# 🔍 RONIN SYSTEM LOGIC - COMPLETE ANALYSIS
## Master Overview Document

---

## 📋 **OVERVIEW**

This is a comprehensive analysis of the RONIN IoT monitoring system, documenting every aspect of the sensor data flow, mathematical modeling, chart system, thresholds, and rover dispatch logic.

**Purpose**: Complete knowledge transfer and system documentation for developers, maintainers, and stakeholders.

**Scope**: Frontend logic, backend integration, Firebase structure, mathematical formulas, UI components, and automation systems.

---

## 📚 **DOCUMENTATION PARTS**

### **[Part 1: Sensor Data Flow & Processing](./SYSTEM_LOGIC_PART1_SENSORS.md)**
- Firebase Realtime Database structure
- Real-time data subscriptions (useIoTReadings, useRoverSensors)
- Sensor normalization logic
- Dual MQ-135 source handling (Fixed IoT + Rover)
- Effective MQ-135 calculation (worst-case approach)

### **[Part 2: Chart System & Real-time Updates](./SYSTEM_LOGIC_PART2_GRAPHS.md)**
- Dashboard charts (Gas Trends, Temperature & Humidity)
- Detail drawer charts (MQ-2, MQ-135, Temperature)
- Time formatting and X-axis labels
- Data window management (10 points vs 60 minutes)
- Chart update mechanisms

### **[Part 3: Math Modeling & Hazard Score](./SYSTEM_LOGIC_PART3_MATH.md)**
- Primary hazard score formula: `0.6×MQ135 + 0.3×MQ2 + 0.1×Temp`
- Sensor normalization ranges and calculations
- Risk level mapping (SAFE/WARNING/DANGER)
- Device vs Calculated score validation
- Divergence detection and logging

### **[Part 4: Thresholds & Status Labels](./SYSTEM_LOGIC_PART4_THRESHOLDS.md)**
- MQ-2 thresholds (Normal, Elevated, High, Critical)
- MQ-135 thresholds (Binary + Rover PPM ranges)
- Temperature thresholds (SAFE, WARNING, DANGER)
- Humidity, Flame, Motion status levels
- Alert severity levels (low, medium, high, critical)

### **[Part 5: Rover Dispatch Logic](./SYSTEM_LOGIC_PART5_ROVER_DISPATCH.md)**
- Client monitoring service
- Dispatch triggers (Hazard≥60, MQ2≥70, Temp≥35°C, Fire)
- Cooldown system (5-minute intervals)
- Priority levels (CRITICAL, HIGH, MEDIUM, LOW)
- Implementation status (✅ Implemented, ⚠️ Partial, ❌ TODO)

### **[Part 6: Final Summary & System Pipeline](./SYSTEM_LOGIC_PART6_SUMMARY.md)**
- Complete system pipeline diagram
- Sensor data flow summary table
- Mathematical model summary
- Chart system summary
- Alert & dispatch system summary
- Identified gaps & TODOs
- Testing & validation checklist

---

## 🎯 **QUICK REFERENCE**

### **Key Formulas**:
```
Hazard Score = (0.6 × Effective_MQ135) + (0.3 × Normalized_MQ2) + (0.1 × Normalized_Temperature)

Effective_MQ135 = max(Fixed_Normalized, Rover_Normalized)
  - Fixed: Binary (0→0, 1→100)
  - Rover: PPM (300-1000 → 0-100)

Risk Levels:
  - SAFE: 0-29
  - WARNING: 30-59
  - DANGER: 60-100
```

### **Critical Thresholds**:
- **MQ-2**: Warning (500 PPM), Danger (700 PPM), Critical (normalized ≥70)
- **Temperature**: Warning (30°C), Danger (35°C)
- **Hazard Score**: Warning (30), Danger (60)
- **Rover Dispatch**: Hazard≥60 OR MQ2≥70 OR Temp≥35°C OR Fire

### **Key File Locations**:
```
frontend/src/lib/hazardScore.ts          # Core hazard score logic
frontend/src/lib/sensorData.ts           # Sensor processing
frontend/src/hooks/useIoTReadings.ts     # IoT data subscription
frontend/src/hooks/useCalculatedHazardScore.ts  # Live calculation
frontend/src/services/clientMonitoring.ts  # Alert & dispatch
frontend/src/pages/Dashboard.tsx         # Main UI
frontend/src/components/SensorDetailDrawer.tsx  # Detail charts
```

---

## 🔄 **SYSTEM ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────┐
│                     ESP32/Arduino IoT Device                     │
│              (MQ-135, MQ-2, Temp, Humidity, Flame, Motion)       │
└────────────────────────────┬────────────────────────────────────┘
                             │ Pushes data
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Firebase Realtime Database                      │
│                      /ronin/iot/{sensors}                        │
│                    /ronin/rover/{sensors}                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ Real-time subscription
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      React Frontend Hooks                        │
│         useIoTReadings() + useRoverSensors()                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ Process & normalize
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Hazard Score Calculation                      │
│         useCalculatedHazardScore() + hazardScore.ts             │
└────────────────────────────┬────────────────────────────────────┘
                             │ Display & monitor
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                         UI Components                            │
│    Dashboard + Charts + Detail Drawers + Validation Panel       │
└─────────────────────────────────────────────────────────────────┘
                             │ Triggers
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Client Monitoring Service                       │
│              Alerts + Rover Dispatch Logic                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ Commands (TODO)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Rover (Autonomous)                          │
│              [PARTIALLY IMPLEMENTED - Manual Control OK]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ **IMPLEMENTATION STATUS**

### **Fully Implemented**:
- ✅ Real-time sensor data streaming
- ✅ Dual MQ-135 source handling
- ✅ Hazard score calculation
- ✅ Risk level determination
- ✅ Device vs Calculated validation
- ✅ Real-time charts with time formatting
- ✅ Sensor detail drawers
- ✅ Alert system with severity levels
- ✅ Client monitoring service
- ✅ Manual rover control
- ✅ Battery and status monitoring

### **Partially Implemented**:
- ⚠️ Rover dispatch (logs only, no actual command)
- ⚠️ Mission planning (basic location)
- ⚠️ Rover status tracking (no mission progress)

### **Not Implemented**:
- ❌ Actual rover command transmission
- ❌ Mission completion tracking
- ❌ Automatic return-to-base
- ❌ Advanced mission planning
- ❌ Live video streaming
- ❌ Historical data archiving
- ❌ Advanced chart features
- ❌ Machine learning integration
- ❌ Mobile app
- ❌ Multi-location support

---

## 🎓 **HOW TO USE THIS DOCUMENTATION**

### **For New Developers**:
1. Read this overview first
2. Go through Parts 1-3 to understand core logic
3. Review Part 4 for all threshold values
4. Check Part 5 for dispatch logic and TODOs
5. Use Part 6 as a quick reference

### **For System Maintenance**:
- Changing thresholds? → Part 4 + update code
- Modifying formula? → Part 3 + `hazardScore.ts`
- Adding sensors? → Part 1 + data flow
- Chart updates? → Part 2 + chart components

### **For Feature Development**:
- Check Part 6 TODOs for priorities
- Review relevant parts for context
- Update documentation when implementing
- Test against Part 6 checklist

### **For Troubleshooting**:
- Data not updating? → Part 1 (subscriptions)
- Wrong calculations? → Part 3 (formulas)
- Charts broken? → Part 2 (chart system)
- Alerts not firing? → Part 5 (monitoring)

---

## 📊 **KEY METRICS**

- **Total Sensors**: 7 (MQ-135, MQ-2, Temp, Humidity, Flame, Motion, Battery)
- **Data Sources**: 2 (Fixed IoT + Rover)
- **Hazard Score Inputs**: 3 (MQ-135 60%, MQ-2 30%, Temp 10%)
- **Risk Levels**: 3 (SAFE, WARNING, DANGER)
- **Alert Severities**: 4 (low, medium, high, critical)
- **Dispatch Triggers**: 4 (Hazard, Gas, Temp, Fire)
- **Chart Types**: 5 (Dashboard × 2, Detail Drawers × 3)
- **Real-time Hooks**: 4 (IoT, Rover, Hazard Score, Chart Data)

---

## 🔗 **RELATED DOCUMENTS**

- `REALTIME_CHARTS_FIX_SUMMARY.md` - Chart system fixes
- `SOLUTION_FEATURE_SUMMARY.md` - Feature overview
- `MQ135_DUAL_CONFIGURATION.md` - MQ-135 dual source setup
- `frontend/README.md` - Frontend setup guide
- `backend/README.md` - Backend setup guide

---

## 📝 **VERSION HISTORY**

- **v1.0** (November 30, 2025) - Initial complete documentation
  - All 6 parts completed
  - Full system analysis
  - Implementation status documented
  - TODOs identified

---

## 👥 **CONTRIBUTORS**

This documentation was created through comprehensive code analysis and system review.

**Maintained by**: RONIN Development Team

---

**Last Updated**: November 30, 2025  
**Total Pages**: 6 parts + master overview  
**Status**: Complete ✅

---

## 🚀 **NEXT STEPS**

1. **High Priority**: Complete rover command transmission (Part 5)
2. **High Priority**: Implement mission tracking (Part 5)
3. **Medium Priority**: Add historical data archiving (Part 6)
4. **Medium Priority**: Centralize threshold configuration (Part 6)
5. **Low Priority**: Advanced chart features (Part 6)

---

**END OF MASTER OVERVIEW**

*For detailed information, please refer to the individual part documents listed above.*
