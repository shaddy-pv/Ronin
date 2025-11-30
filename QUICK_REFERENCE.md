# 🚀 RONIN System - Quick Reference Card

## 📊 Hazard Score Formula

```
Score = (0.6 × MQ135) + (0.3 × MQ2) + (0.1 × Temp)
```

**Risk Levels**:
- SAFE: 0-29
- WARNING: 30-59
- DANGER: 60-100

---

## 🎯 Critical Thresholds

| Sensor | Warning | Danger | Dispatch |
|--------|---------|--------|----------|
| **MQ-2** | 500 PPM | 700 PPM | Norm ≥70 |
| **MQ-135** | - | Binary=1 | - |
| **Temperature** | 30°C | 35°C | ≥35°C |
| **Hazard Score** | 30 | 60 | ≥60 |
| **Flame** | - | true | Immediate |

---

## 🤖 Rover Dispatch Triggers

1. **Hazard Score ≥ 60** → High priority
2. **MQ-2 Normalized ≥ 70** → High priority
3. **Temperature ≥ 35°C** → Medium priority
4. **Fire Detected** → CRITICAL (immediate)

**Cooldown**: 5 minutes between dispatches

---

## 📁 Key File Locations

### **Core Logic**:
```
frontend/src/lib/hazardScore.ts          # Hazard calculation
frontend/src/lib/sensorData.ts           # Sensor processing
frontend/src/hooks/useIoTReadings.ts     # IoT data subscription
frontend/src/hooks/useRealtimeChartData.ts # Chart data
frontend/src/services/clientMonitoring.ts  # Alert & dispatch
```

### **UI Components**:
```
frontend/src/pages/Dashboard.tsx              # Main dashboard
frontend/src/components/SensorDetailDrawer.tsx # Sensor charts
frontend/src/components/RoverMissionStatus.tsx # Rover tracking
```

---

## 🔥 Firebase Paths

```
/ronin/iot                    # Fixed IoT sensor data
/ronin/rover/sensors          # Rover sensor data
/ronin/rover/control          # Rover commands
/ronin/rover/status           # Rover status
/ronin/alerts                 # System alerts
/ronin/history                # Historical logs
/ronin/settings               # System settings
```

---

## 🎨 Sensor Data Structure

### **Fixed IoT** (`/ronin/iot`):
```json
{
  "mq2": 450,              // PPM (continuous)
  "mq135_digital": 0,      // Binary 0 or 1
  "temperature": 28.5,     // °C
  "humidity": 65,          // %
  "flame": false,          // Boolean
  "motion": false,         // Boolean
  "hazardScore": 35.2,     // 0-100
  "riskLevel": "WARNING"   // SAFE/WARNING/DANGER
}
```

### **Rover** (`/ronin/rover/sensors`):
```json
{
  "mq2": 420,              // PPM (continuous)
  "mq135": 650,            // PPM (continuous, NOT binary)
  "temperature": 27.8,     // °C
  "humidity": 62           // %
}
```

---

## 🔧 Common Commands

### **Build**:
```bash
cd frontend
npm run build
```

### **Dev Server**:
```bash
cd frontend
npm run dev
```

### **Type Check**:
```bash
cd frontend
npm run type-check
```

---

## 🐛 Quick Troubleshooting

### **Charts not showing?**
- Check `chartData.length` in console
- Verify Firebase connection
- Check `useRealtimeChartData` logs

### **Rover not dispatching?**
- Verify `clientMonitoring.start()` called
- Check hazard score > 60
- Look for "Rover Dispatched" alert

### **Data not updating?**
- Check Firebase subscriptions active
- Verify `lastHeartbeat` timestamp
- Check browser console for errors

---

## 📊 Mission Status States

| State | Icon | Color | Meaning |
|-------|------|-------|---------|
| IDLE | 📍 | Gray | Standby |
| DISPATCHED | ⏳ | Blue | Just sent |
| EN_ROUTE | ⏳ | Blue | Traveling |
| ARRIVED | ✅ | Green | At site |
| INVESTIGATING | 📊 | Yellow | Scanning |
| RETURNING | 🧭 | Blue | Going back |
| COMPLETED | ✅ | Green | Done |

---

## 💡 Quick Tips

1. **MQ-135 Dual Source**: System uses `max(Fixed, Rover)` for worst-case
2. **Chart Fallback**: Shows current reading if no history yet
3. **Auto-Dispatch**: Enabled by default when hazard > 60
4. **History Cleanup**: Keeps last 1000 entries automatically
5. **Alert Cooldown**: Prevents spam with time-based throttling

---

## 📚 Documentation Links

- **Complete Analysis**: `COMPLETE_SYSTEM_LOGIC_ANALYSIS.md`
- **Sensor Flow**: `SYSTEM_LOGIC_PART1_SENSORS.md`
- **Charts**: `SYSTEM_LOGIC_PART2_GRAPHS.md`
- **Math Model**: `SYSTEM_LOGIC_PART3_MATH.md`
- **Thresholds**: `SYSTEM_LOGIC_PART4_THRESHOLDS.md`
- **Rover Dispatch**: `SYSTEM_LOGIC_PART5_ROVER_DISPATCH.md`
- **Summary**: `SYSTEM_LOGIC_PART6_SUMMARY.md`
- **Chart Fix**: `DRAWER_CHART_FIX.md`
- **Rover Status**: `ROVER_MISSION_STATUS_FEATURE.md`

---

## 🎯 Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Sensor cards show current values
- [ ] Charts update in real-time
- [ ] Drawer charts display on "View Details"
- [ ] Both Fixed and Rover lines visible
- [ ] Rover mission status shows correctly
- [ ] Dispatch triggers at hazard > 60
- [ ] Progress bar animates smoothly
- [ ] Arrival status displays

---

**Last Updated**: November 30, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
