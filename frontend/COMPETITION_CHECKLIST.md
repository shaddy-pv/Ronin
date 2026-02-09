# AROHAN Command Center - Competition Checklist

## Pre-Competition Setup

### Hardware Verification
- [ ] Fixed IoT node powered on and connected
- [ ] Fixed IoT MQ-135 wired to digital output (D0)
- [ ] Rover powered on and connected
- [ ] Rover MQ-135 wired to analog input (A0)
- [ ] Both nodes connected to WiFi
- [ ] Firebase credentials configured on both nodes

### Firebase Setup
- [ ] Firebase project created and configured
- [ ] Database rules allow read/write
- [ ] Fixed IoT sending to `/AROHAN/iot`
- [ ] Rover sending to `/AROHAN/rover/sensors`
- [ ] Historical data logging enabled

### Dashboard Verification
- [ ] Dashboard loads without errors
- [ ] No console warnings or errors
- [ ] Firebase connection status shows "ONLINE"
- [ ] All sensor cards display data
- [ ] Charts render correctly

## Functional Testing

### MQ-2 Sensor
- [ ] MQ-2 card shows current reading
- [ ] Click "View Details" opens MQ-2 detail view
- [ ] Detail view shows normalized value
- [ ] Chart displays historical data
- [ ] Hazard contribution calculated correctly

### MQ-135 Sensor (Dual Configuration)
- [ ] MQ-135 card shows binary status (OK/ALERT)
- [ ] Click "View Details" opens MQ-135 detail view
- [ ] Fixed IoT shows "OK" or "ALERT" (not a number)
- [ ] Rover shows PPM value when connected
- [ ] Rover shows "N/A" when offline
- [ ] Effective value = max(fixed, rover)
- [ ] Chart shows green step line (fixed)
- [ ] Chart shows blue smooth line (rover)
- [ ] Legend clearly labels each source

### Hazard Score
- [ ] Hazard score displays on dashboard
- [ ] Risk level badge shows correct color
- [ ] Click info icon opens hazard score modal
- [ ] Modal explains calculation formula
- [ ] Score updates in real-time

### Rover Control
- [ ] Rover status card shows battery level
- [ ] Rover location displays correctly
- [ ] Manual control buttons work
- [ ] Auto mode can be enabled/disabled
- [ ] Emergency stop functions

## Test Scenarios

### Scenario 1: Both Normal
**Setup:**
- Fixed MQ-135: 0 (OK)
- Rover MQ-135: 350 PPM

**Expected:**
- [ ] Fixed shows "✓ OK"
- [ ] Rover shows "350 PPM"
- [ ] Effective: ~7.1
- [ ] Hazard contribution: ~4.3 points
- [ ] Chart shows both lines low

### Scenario 2: Fixed Alert, Rover Moderate
**Setup:**
- Fixed MQ-135: 1 (ALERT)
- Rover MQ-135: 450 PPM

**Expected:**
- [ ] Fixed shows "⚠️ ALERT"
- [ ] Rover shows "450 PPM"
- [ ] Effective: 100
- [ ] Hazard contribution: 60 points
- [ ] Chart shows fixed at 100, rover at ~21

### Scenario 3: Fixed Normal, Rover High
**Setup:**
- Fixed MQ-135: 0 (OK)
- Rover MQ-135: 850 PPM

**Expected:**
- [ ] Fixed shows "✓ OK"
- [ ] Rover shows "850 PPM"
- [ ] Effective: ~78.6
- [ ] Hazard contribution: ~47.2 points
- [ ] Chart shows fixed at 0, rover at ~79

### Scenario 4: Rover Offline
**Setup:**
- Fixed MQ-135: 1 (ALERT)
- Rover: Disconnected

**Expected:**
- [ ] Fixed shows "⚠️ ALERT"
- [ ] Rover shows "N/A"
- [ ] Effective: 100
- [ ] Hazard contribution: 60 points
- [ ] Chart shows only fixed line

## Demo Preparation

### Key Talking Points
- [ ] Explain dual MQ-135 configuration
- [ ] Demonstrate fixed threshold vs rover continuous
- [ ] Show comparison chart
- [ ] Explain effective value calculation (max)
- [ ] Highlight conservative safety approach
- [ ] Demonstrate rover verification capability

### Demo Flow
1. [ ] Show dashboard overview
2. [ ] Point out hazard score and risk level
3. [ ] Click MQ-135 "View Details"
4. [ ] Explain fixed IoT (threshold-based)
5. [ ] Explain rover (continuous)
6. [ ] Show comparison chart
7. [ ] Explain effective value = max(fixed, rover)
8. [ ] Demonstrate real-time updates
9. [ ] Show rover control features
10. [ ] Explain verification story

### Backup Plans
- [ ] Screenshots of working system
- [ ] Video recording of demo
- [ ] Offline mode if WiFi fails
- [ ] Manual data entry if sensors fail
- [ ] Presentation slides explaining system

## Troubleshooting

### Dashboard Not Loading
- [ ] Check internet connection
- [ ] Verify Firebase credentials
- [ ] Check browser console for errors
- [ ] Try different browser
- [ ] Clear cache and reload

### No Sensor Data
- [ ] Check Firebase database directly
- [ ] Verify IoT node is online
- [ ] Check WiFi connection
- [ ] Restart IoT node
- [ ] Check Firebase rules

### Rover Shows N/A
- [ ] Check rover power
- [ ] Verify rover WiFi connection
- [ ] Check Firebase path: `/AROHAN/rover/sensors`
- [ ] Verify rover firmware is sending data
- [ ] Check rover timestamp

### Chart Not Displaying
- [ ] Check historical data exists
- [ ] Verify timestamps are valid
- [ ] Check browser console for errors
- [ ] Reload page
- [ ] Check chart data in React DevTools

### Hazard Score Incorrect
- [ ] Verify sensor readings are correct
- [ ] Check normalization calculations
- [ ] Verify effective MQ-135 = max(fixed, rover)
- [ ] Check weights: MQ-135=60%, MQ-2=30%, Temp=10%
- [ ] Look for console calculation logs

## Competition Day

### Morning Setup (2 hours before)
- [ ] Power on all hardware
- [ ] Verify WiFi connection
- [ ] Check Firebase connection
- [ ] Run through all test scenarios
- [ ] Take screenshots of working system
- [ ] Charge all batteries
- [ ] Prepare backup presentation

### 30 Minutes Before
- [ ] Final hardware check
- [ ] Verify dashboard loads
- [ ] Check all sensor readings
- [ ] Test rover control
- [ ] Review talking points
- [ ] Calm nerves, you got this! 💪

### During Presentation
- [ ] Speak clearly and confidently
- [ ] Explain dual configuration benefits
- [ ] Show comparison chart
- [ ] Demonstrate real-time updates
- [ ] Answer questions honestly
- [ ] If something breaks, explain backup plan

### After Presentation
- [ ] Note any issues for improvement
- [ ] Thank judges for their time
- [ ] Celebrate your hard work! 🎉

## Emergency Contacts

### Technical Support
- Firebase Console: https://console.firebase.google.com
- React DevTools: Browser extension
- Browser Console: F12 or Cmd+Option+I

### Documentation
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete overview
- `MQ135_DUAL_CONFIGURATION.md` - Detailed MQ-135 guide
- `MQ135_SYSTEM_DIAGRAM.md` - Visual diagrams
- `IMPLEMENTATION_SUMMARY.md` - Quick reference

## Success Criteria

### Minimum Viable Demo
- [ ] Dashboard loads and shows data
- [ ] MQ-135 detail view opens
- [ ] Fixed IoT shows threshold status
- [ ] Rover shows continuous reading (or N/A)
- [ ] Chart displays comparison
- [ ] Hazard score calculates correctly

### Ideal Demo
- [ ] All sensors working
- [ ] Real-time updates visible
- [ ] Rover online and sending data
- [ ] Comparison chart shows both lines
- [ ] Smooth presentation flow
- [ ] All questions answered confidently

### Stretch Goals
- [ ] Demonstrate rover auto-dispatch
- [ ] Show historical trend analysis
- [ ] Explain future enhancements
- [ ] Impress judges with technical depth

## Post-Competition

### If You Win 🏆
- [ ] Celebrate!
- [ ] Thank your team
- [ ] Document lessons learned
- [ ] Plan next steps

### If You Don't Win
- [ ] Still celebrate your hard work!
- [ ] Get feedback from judges
- [ ] Document improvements for next time
- [ ] Be proud of what you built

## Final Reminders

✅ **You've built something amazing**
- Dual MQ-135 configuration is innovative
- Comparison chart is clear and professional
- Hazard score calculation is sound
- UI is clean and intuitive

✅ **You're prepared**
- All code is production-ready
- Documentation is comprehensive
- Test scenarios are covered
- Backup plans are in place

✅ **You can do this**
- Practice your presentation
- Believe in your work
- Stay calm under pressure
- Have fun!

---

**Good luck at the competition!** 🚀

**Remember**: The judges want to see your passion and understanding, not just a perfect demo. Explain your thinking, show your problem-solving, and be proud of what you've accomplished.

**You've got this!** 💪

---

**Last Updated**: November 30, 2025
**Status**: Ready for Competition ✅
