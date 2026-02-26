# Tech Stack & Authentication Analysis

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.3.1** (NOT Next.js)
- **Vite 5.4.19** - Build tool & dev server
- **TypeScript 5.8.3**
- **React Router DOM 6.30.1** - Client-side routing

### UI Framework
- **Tailwind CSS 3.4.17**
- **Shadcn/ui** - Radix UI components
- **Recharts 2.15.4** - Charts & graphs
- **Lucide React** - Icons

### Backend & Database
- **Firebase 12.6.0**
  - Firebase Authentication (Email/Password)
  - Firebase Realtime Database
  - Firebase Storage
  - Firebase Analytics
- **Python Flask Backend** (for Computer Vision)
  - Located in `/backend/cv_backend.py`
  - Face detection & recognition
  - Snapshot processing

### State Management
- **React Context API**
  - `AuthContext` - Authentication state
  - `FirebaseContext` - Database & IoT data
- **TanStack Query 5.83.0** - Server state management
- **React Hook Form 7.61.1** - Form state

### Hardware Integration
- **ESP32-CAM** - Camera streaming
- **IoT Sensors** - MQ2, MQ135, DHT, Flame, Motion
- **Rover Control** - Real-time control via Firebase

---

## 🔐 Authentication System

### Where Login is Stored

**Firebase Authentication** handles everything:

1. **Browser Storage (IndexedDB)**
   - Firebase Auth automatically stores tokens in IndexedDB
   - Path: `IndexedDB > firebaseLocalStorageDb > firebaseLocalStorage`
   - Contains: `authUser`, refresh tokens, access tokens

2. **Session Persistence**
   - Firebase uses `LOCAL` persistence by default
   - Tokens persist across browser sessions
   - Auto-refresh on expiry

3. **In-Memory State**
   - `AuthContext` maintains `currentUser` state
   - Updated via `onAuthStateChanged` listener
   - Available throughout app via `useAuth()` hook

### Authentication Flow

```typescript
// 1. User logs in
await signInWithEmailAndPassword(auth, email, password);

// 2. Firebase stores tokens in IndexedDB automatically

// 3. onAuthStateChanged fires
onAuthStateChanged(auth, (user) => {
  setCurrentUser(user); // Updates React state
});

// 4. Protected routes check authentication
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// 5. Database rules verify auth token
{
  "rules": {
    "arohan": {
      ".read": "auth != null",  // Checks Firebase token
      ".write": "auth != null"
    }
  }
}
```

### Token Management

- **Access Token**: Short-lived (1 hour)
- **Refresh Token**: Long-lived (stored in IndexedDB)
- **Auto-refresh**: Firebase SDK handles automatically
- **No manual JWT handling needed**

---

## 🌐 Network Tab Analysis

### On Page Reload - Expected API Calls

#### 1. Firebase Authentication Check
```
Request: https://identitytoolkit.googleapis.com/v1/accounts:lookup
Method: POST
Status: 200 OK (if logged in)
Purpose: Verify current auth token
```

#### 2. Firebase Realtime Database Connection
```
WebSocket: wss://[your-project].firebaseio.com/.ws?v=5&ns=[your-project]
Status: 101 Switching Protocols → Connected
Purpose: Real-time data sync
```

#### 3. Database Read Operations
```
Request: https://[your-project]-default-rtdb.firebaseio.com/arohan/iot.json?auth=[token]
Method: GET
Status: 200 OK (if authenticated)
Status: 401 Unauthorized (if not authenticated)
Status: 403 Forbidden (if rules deny access)
Purpose: Fetch IoT sensor data
```

### Current Issue - What You're Seeing

**❌ Permission Denied Error:**
```
Error: permission_denied at /arohan/iot
Status: 403 Forbidden
```

**Why This Happens:**

1. **Race Condition** (FIXED in code):
   - Database hooks initialized before auth completed
   - Request sent without auth token
   - Firebase rejects with 403

2. **Rules Not Deployed** (NEEDS ACTION):
   - Local `database.rules.json` exists
   - But not deployed to Firebase servers
   - Firebase uses default deny-all rules

3. **Token Not Attached**:
   - If auth state not ready
   - Database requests go without token
   - Results in permission denied

---

## 🔍 How to Check Network Tab

### Step 1: Open DevTools
- Press `F12` or `Ctrl+Shift+I`
- Go to **Network** tab
- Check **Preserve log**

### Step 2: Reload Page
- Press `Ctrl+R` or `F5`
- Watch for requests

### Step 3: Look for These Patterns

**✅ Good (Working):**
```
identitytoolkit.googleapis.com/v1/accounts:lookup
Status: 200 OK
Response: { "users": [...] }

[your-project]-default-rtdb.firebaseio.com/arohan/iot.json
Status: 200 OK
Response: { "mq2": 150, "temperature": 25, ... }
```

**❌ Bad (Permission Error):**
```
[your-project]-default-rtdb.firebaseio.com/arohan/iot.json
Status: 403 Forbidden
Response: { "error": "Permission denied" }
```

**❌ Bad (Not Authenticated):**
```
[your-project]-default-rtdb.firebaseio.com/arohan/iot.json
Status: 401 Unauthorized
Response: { "error": "Unauthorized" }
```

### Step 4: Check WebSocket
- Filter by **WS** (WebSocket)
- Look for `firebaseio.com/.ws`
- Status should be **101 Switching Protocols**
- Then **Connected** (green)

---

## 🐛 Debugging Commands

### Check Auth State in Console
```javascript
// Open browser console (F12)
firebase.auth().currentUser
// Should show user object if logged in
// null if not logged in
```

### Check IndexedDB
```
1. F12 → Application tab
2. Storage → IndexedDB
3. firebaseLocalStorageDb → firebaseLocalStorage
4. Look for authUser key
```

### Check Network Requests
```
1. F12 → Network tab
2. Filter: "firebaseio"
3. Look at Status codes
4. Check Request Headers for "Authorization"
```

---

## ✅ Solution Summary

### What I Fixed (Code Changes):
1. ✅ Race condition in `FirebaseContext.tsx`
2. ✅ Database reference in `useIoTReadings.ts`
3. ✅ Auth check before Firebase hooks initialize

### What You Need to Do:
1. **Deploy Firebase Rules:**
   ```bash
   firebase deploy --only database
   ```

2. **Rebuild Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Clear Cache & Reload**

4. **Check Network Tab:**
   - Should see 200 OK for database requests
   - No more 403 Forbidden errors

---

## 📊 Expected Status Codes After Fix

| Request | Status | Meaning |
|---------|--------|---------|
| Auth lookup | 200 | ✅ Logged in |
| Database read | 200 | ✅ Authorized & data exists |
| WebSocket | 101 | ✅ Connected |
| Storage read | 200 | ✅ File accessible |

If you see 403 after deploying rules, check:
- Rules deployed correctly
- User is authenticated
- Database path is correct (`/arohan/iot`)
