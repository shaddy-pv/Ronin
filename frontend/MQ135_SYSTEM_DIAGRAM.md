# MQ-135 Dual Configuration System Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AROHAN Command Center Dashboard                    │
└─────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    │         Firebase RTDB         │
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
         ┌──────────▼──────────┐         ┌─────────▼──────────┐
         │   Fixed IoT Node    │         │    Rover Node      │
         │                     │         │                    │
         │  MQ-135 → Digital   │         │  MQ-135 → Analog   │
         │  Output: 0 or 1     │         │  Output: 0-1000    │
         └─────────────────────┘         └────────────────────┘
```

## Data Flow

### Fixed IoT Node (Threshold-Based)
```
MQ-135 Sensor
     │
     ├─ Digital Pin (D0)
     │
     ▼
Digital Reading: 0 or 1
     │
     ├─ Threshold Exceeded? → 1
     ├─ Normal Air Quality? → 0
     │
     ▼
Firebase: /AROHAN/iot/mq135_digital
     │
     ▼
Dashboard: "OK" or "ALERT"
     │
     ▼
Normalized: 0 → 0/100, 1 → 100/100
```

### Rover Node (Continuous)
```
MQ-135 Sensor
     │
     ├─ Analog Pin (A0)
     │
     ▼
Analog Reading: 0-1023
     │
     ├─ Convert to PPM
     │
     ▼
PPM Value: 0-1000
     │
     ▼
Firebase: /AROHAN/rover/sensors/mq135
     │
     ▼
Dashboard: "450 PPM"
     │
     ▼
Normalized: (value - 300) / 700 × 100
```

## Hazard Score Calculation

```
┌─────────────────────────────────────────────────────────────┐
│                    Hazard Score Engine                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌────────┐         ┌──────────┐        ┌──────────┐
   │  MQ-2  │         │  MQ-135  │        │   Temp   │
   │  30%   │         │   60%    │        │   10%    │
   └────┬───┘         └────┬─────┘        └────┬─────┘
        │                  │                    │
        │                  │                    │
        │         ┌────────▼────────┐           │
        │         │  Effective MQ135 │           │
        │         │                  │           │
        │         │  max(fixed,      │           │
        │         │      rover)      │           │
        │         └────────┬─────────┘           │
        │                  │                     │
        └──────────────────┼─────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  Hazard Score  │
                  │    0-100       │
                  └────────────────┘
```

## Example Calculation Flow

### Scenario: Fixed Alert, Rover Moderate

```
Step 1: Read Sensors
┌──────────────────┐         ┌──────────────────┐
│ Fixed IoT        │         │ Rover            │
│ MQ-135: 1        │         │ MQ-135: 450 PPM  │
│ (Threshold hit)  │         │ (Moderate)       │
└──────────────────┘         └──────────────────┘
         │                            │
         ▼                            ▼
Step 2: Normalize
┌──────────────────┐         ┌──────────────────┐
│ Fixed Normalized │         │ Rover Normalized │
│ 1 → 100/100      │         │ 450 → 21.4/100   │
└──────────────────┘         └──────────────────┘
         │                            │
         └────────────┬───────────────┘
                      ▼
Step 3: Calculate Effective
         ┌────────────────────┐
         │ Effective MQ-135   │
         │ max(100, 21.4)     │
         │ = 100              │
         └────────────────────┘
                      │
                      ▼
Step 4: Apply Weight
         ┌────────────────────┐
         │ MQ-135 Contribution│
         │ 100 × 0.6 = 60     │
         └────────────────────┘
                      │
                      ▼
Step 5: Add Other Sensors
         ┌────────────────────┐
         │ + MQ-2: 7.5        │
         │ + Temp: 4.2        │
         │ = 71.7 Total       │
         └────────────────────┘
                      │
                      ▼
         ┌────────────────────┐
         │ Risk Level: DANGER │
         └────────────────────┘
```

## UI Display Flow

```
Dashboard
    │
    ├─ MQ-2 Card
    │   └─ Click "View Details" → MQ-2 Detail View
    │
    └─ MQ-135 Card
        └─ Click "View Details" → MQ-135 Detail View
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │  MQ-135 Detail Drawer     │
                        └───────────────────────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │                               │
                        ▼                               ▼
            ┌───────────────────┐         ┌───────────────────┐
            │ Fixed IoT Reading │         │ Rover Reading     │
            │                   │         │                   │
            │ ✓ OK / ⚠️ ALERT   │         │ 450 PPM           │
            │ Digital: 0 or 1   │         │ Normalized: 21.4  │
            │ Normalized: 0/100 │         │ Status: Moderate  │
            └───────────────────┘         └───────────────────┘
                        │                               │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │  Hazard Contribution      │
                        │                           │
                        │  Fixed: 0/100             │
                        │  Rover: 21.4/100          │
                        │  Effective: 21.4/100      │
                        │  Contribution: 12.8 pts   │
                        └───────────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │  Comparison Chart         │
                        │                           │
                        │  Green Line: Fixed (0/100)│
                        │  Blue Line: Rover (0-100) │
                        │                           │
                        │  [Chart visualization]    │
                        └───────────────────────────┘
```

## Chart Visualization

```
Normalized Value (0-100)
    100 ┤                                    ●─────●
        │                                   /
     80 ┤                              ●───●
        │                             /
     60 ┤                        ●───●
        │                       /
     40 ┤                  ●───●
        │                 /
     20 ┤            ●───●
        │           /
      0 ┤──────────●────────────────────────────────
        └─────────────────────────────────────────▶
         10:00  10:10  10:20  10:30  10:40  10:50
                        Time

Legend:
─── Green (Step): Fixed IoT (Threshold-Based)
─── Blue (Smooth): Rover (Continuous)
```

## Decision Tree

```
                    ┌─────────────────┐
                    │ Read MQ-135     │
                    │ from both nodes │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Is Rover Online?│
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼ YES                     ▼ NO
    ┌───────────────────┐     ┌──────────────────┐
    │ Calculate Both    │     │ Use Fixed Only   │
    │ - Fixed: 0 or 100 │     │ - Fixed: 0 or 100│
    │ - Rover: 0-100    │     │ - Rover: N/A     │
    └─────────┬─────────┘     └────────┬─────────┘
              │                        │
              ▼                        ▼
    ┌───────────────────┐     ┌──────────────────┐
    │ Effective =       │     │ Effective =      │
    │ max(fixed, rover) │     │ fixed            │
    └─────────┬─────────┘     └────────┬─────────┘
              │                        │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Use in Hazard Score    │
              │ Contribution = 60%     │
              └────────────────────────┘
```

## Comparison Scenarios

### Scenario 1: Both Normal
```
Fixed: 0 (OK)          Rover: 350 PPM (Low)
   │                        │
   ├─ Normalized: 0         ├─ Normalized: 7.1
   │                        │
   └────────┬───────────────┘
            │
            ▼
    Effective: max(0, 7.1) = 7.1
            │
            ▼
    Contribution: 7.1 × 0.6 = 4.3 points
```

### Scenario 2: Fixed Alert, Rover Moderate
```
Fixed: 1 (ALERT)       Rover: 450 PPM (Moderate)
   │                        │
   ├─ Normalized: 100       ├─ Normalized: 21.4
   │                        │
   └────────┬───────────────┘
            │
            ▼
    Effective: max(100, 21.4) = 100
            │
            ▼
    Contribution: 100 × 0.6 = 60 points
```

### Scenario 3: Fixed Normal, Rover High
```
Fixed: 0 (OK)          Rover: 850 PPM (High)
   │                        │
   ├─ Normalized: 0         ├─ Normalized: 78.6
   │                        │
   └────────┬───────────────┘
            │
            ▼
    Effective: max(0, 78.6) = 78.6
            │
            ▼
    Contribution: 78.6 × 0.6 = 47.2 points
```

### Scenario 4: Rover Offline
```
Fixed: 1 (ALERT)       Rover: null (Offline)
   │                        │
   ├─ Normalized: 100       ├─ N/A
   │                        │
   └────────┬───────────────┘
            │
            ▼
    Effective: 100 (fallback to fixed)
            │
            ▼
    Contribution: 100 × 0.6 = 60 points
```

## Benefits Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    Dual Configuration Benefits               │
└─────────────────────────────────────────────────────────────┘

1. No Hardware Changes
   Fixed IoT: Digital Pin ✅ (No rewiring needed)
   Rover: Analog Pin ✅ (Already configured)

2. Redundancy
   ┌──────────┐     ┌──────────┐
   │  Fixed   │ ✅  │  Rover   │
   │  Online  │     │  Online  │
   └──────────┘     └──────────┘
        │                │
        └────────┬───────┘
                 ▼
         Both sources available

3. Verification
   Fixed says: ALERT (100)
   Rover says: 450 PPM (21.4)
   Conclusion: Fixed threshold may be too sensitive
               Rover provides context

4. Conservative Safety
   Fixed: 100    Rover: 21.4
        └────┬────┘
             ▼
        max(100, 21.4) = 100
        (Uses worst-case for safety)

5. Clear Presentation
   ┌─────────────────────────────┐
   │ Dashboard shows both:       │
   │ - Fixed: Threshold-Based    │
   │ - Rover: Continuous         │
   │ - Chart: Visual Comparison  │
   └─────────────────────────────┘
```

---

**Use this diagram to:**
- Explain system to judges
- Debug data flow issues
- Understand calculation logic
- Present verification story

**Last Updated**: November 30, 2025
