# AROHAN Deployment Checklist

## ✅ Completed Changes

### Code & Configuration
- [x] All source code files updated (RONIN → AROHAN)
- [x] Firebase database paths updated (`/ronin` → `/arohan`)
- [x] Firebase storage paths updated
- [x] Database rules updated
- [x] Storage rules updated
- [x] Backend Python files updated
- [x] All documentation updated
- [x] UI/UX text updated
- [x] Build successful (frontend)

## ⏳ Required Actions Before Deployment

### 1. IoT Device Firmware Update
Update your ESP32/ESP8266 firmware to use new Firebase paths:

**Old Path:**
```cpp
Firebase.setString("/ronin/iot/mq2", value);
```

**New Path:**
```cpp
Firebase.setString("/arohan/iot/mq2", value);
```

**All IoT Paths to Update:**
- `/ronin/iot/mq2` → `/arohan/iot/mq2`
- `/ronin/iot/mq135` → `/arohan/iot/mq135`
- `/ronin/iot/mq135_digital` → `/arohan/iot/mq135_digital`
- `/ronin/iot/temperature` → `/arohan/iot/temperature`
- `/ronin/iot/humidity` → `/arohan/iot/humidity`
- `/ronin/iot/flame` → `/arohan/iot/flame`
- `/ronin/iot/motion` → `/arohan/iot/motion`
- `/ronin/iot/hazardScore` → `/arohan/iot/hazardScore`
- `/ronin/iot/riskLevel` → `/arohan/iot/riskLevel`
- `/ronin/iot/status` → `/arohan/iot/status`
- `/ronin/iot/emergency` → `/arohan/iot/emergency`

### 2. Rover Firmware Update
Update your rover firmware to use new Firebase paths:

**Control Path (Read):**
- `/ronin/rover/control` → `/arohan/rover/control`

**Status Path (Write):**
- `/ronin/rover/status` → `/arohan/rover/status`

**Sensors Path (Write):**
- `/ronin/rover/sensors` → `/arohan/rover/sensors`

**Mission Path (Read/Write):**
- `/ronin/rover/mission` → `/arohan/rover/mission`

### 3. Firebase Database Migration (Optional)
If you want to preserve existing data:

**Option A: Manual Copy in Firebase Console**
1. Go to Firebase Console → Realtime Database
2. Export `/ronin` node
3. Import to `/arohan` node
4. Delete `/ronin` node (after verification)

**Option B: Script Migration**
```javascript
// Run in Firebase Console or Node.js script
const admin = require('firebase-admin');
const db = admin.database();

db.ref('/ronin').once('value', (snapshot) => {
  const data = snapshot.val();
  db.ref('/arohan').set(data)
    .then(() => console.log('Migration complete'))
    .catch(err => console.error('Migration failed:', err));
});
```

### 4. Deploy Firebase Rules
```bash
# Deploy database rules
firebase deploy --only database

# Deploy storage rules
firebase deploy --only storage
```

### 5. Deploy Frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### 6. Update CV Backend
If using the computer vision backend:
```bash
cd backend
# Restart the service to pick up new paths
python start_cv_backend.py
```

## 🧪 Testing Checklist

After deployment, verify each component:

### Frontend Testing
- [ ] Open dashboard at deployed URL
- [ ] Verify "AROHAN Command Center" appears in header
- [ ] Check sidebar shows "AROHAN" branding
- [ ] Login page shows "AROHAN" title
- [ ] Signup page shows "AROHAN" branding
- [ ] Settings page shows device ID: "AROHAN-UNIT-001"

### Data Flow Testing
- [ ] IoT device sends data to `/arohan/iot`
- [ ] Dashboard receives and displays IoT data
- [ ] Rover control commands write to `/arohan/rover/control`
- [ ] Rover status updates appear at `/arohan/rover/status`
- [ ] Alerts are created at `/arohan/alerts`
- [ ] History logs are saved at `/arohan/history`

### Feature Testing
- [ ] Real-time sensor data updates
- [ ] Hazard score calculation works
- [ ] Risk level colors display correctly
- [ ] Rover dispatch triggers properly
- [ ] Mission status tracking works
- [ ] Alert notifications appear
- [ ] History page loads data
- [ ] Export functions use "arohan-" prefix

### CV Backend Testing (if applicable)
- [ ] Face recognition service starts
- [ ] Snapshots upload to `/arohan/snapshots/`
- [ ] Alerts are created at `/arohan/alerts`
- [ ] Firebase connection successful

## 🔍 Verification Commands

### Check Firebase Paths
```bash
# View current database structure
firebase database:get / --project ronin-80b29

# Should see /arohan node instead of /ronin
```

### Check Build Output
```bash
cd frontend
npm run build
# Should complete without errors
```

### Check for Remaining "ronin" References
```bash
# Search for any missed references (case-insensitive)
grep -ri "ronin" frontend/src --exclude-dir=node_modules
```

## 📝 Rollback Plan

If issues occur, you can rollback:

1. **Code Rollback**: Use git to revert changes
   ```bash
   git log --oneline  # Find commit before rename
   git revert <commit-hash>
   ```

2. **Database Rollback**: Keep `/ronin` data until fully verified
   - Don't delete `/ronin` node immediately
   - Run both paths in parallel during transition

3. **Firmware Rollback**: Flash previous firmware to devices

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All UI shows "AROHAN" branding
- ✅ IoT data flows to `/arohan/iot`
- ✅ Rover control works via `/arohan/rover/*`
- ✅ No console errors in browser
- ✅ All features work as before
- ✅ No references to "RONIN" in user-facing text

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase paths in Realtime Database
3. Confirm IoT device firmware is updated
4. Review Firebase rules deployment
5. Check network connectivity

---

**Project**: AROHAN (formerly RONIN)
**Rename Date**: February 7, 2026
**Status**: Ready for deployment
**Build Status**: ✅ Successful
