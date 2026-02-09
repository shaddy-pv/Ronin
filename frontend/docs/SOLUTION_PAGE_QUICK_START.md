# 🚀 Solution Page - Quick Start Guide

## What You Get

A new **"Solution"** page in your AROHAN dashboard that uses Google Gemini AI to analyze your live sensor data and provide actionable safety recommendations.

## 3-Step Setup

### 1️⃣ Get Your Gemini API Key (2 minutes)

```
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with "AIza...")
```

### 2️⃣ Add Key to Environment File (30 seconds)

Open `frontend/.env` and add:

```env
VITE_GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

### 3️⃣ Restart Your Dev Server (if running)

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

## How to Use

### Access the Page
- Click **"Solution"** in the sidebar (between Rover Console and Alerts)
- Or navigate to: `http://localhost:5173/solution`

### Generate AI Solutions

1. **View Live Data**: Page automatically shows current MQ-2, MQ-135, temperature, etc.
2. **Click Button**: "Generate Solution using AI"
3. **Wait**: Takes 2-5 seconds for AI analysis
4. **Read Results**: Get 6 sections of actionable recommendations

## What the AI Tells You

### 🔍 Hazard Type
What kind of danger is detected (gas leak, fire, toxic air, or safe)

### 💡 Recommended Response
Immediate actions to take right now

### 🤖 Rover Action
What your autonomous rover should do

### 📡 IoT Node Action
How your fixed sensors should respond

### 👤 Human Instructions
What YOU need to do as the operator

### ✅ Solution Plan
Step-by-step action checklist

## Example Scenario

**Sensor Readings:**
- MQ-2: 650 (high flammable gas)
- MQ-135: 450 (moderate air quality issue)
- Temperature: 32°C
- Flame: Not detected

**AI Solution:**
```
Hazard Type: Flammable Gas Leak (Mixed with Air Quality Issue)

Recommended Response:
- Evacuate the area immediately
- Activate ventilation systems
- Dispatch rover for source investigation

Rover Action:
- Navigate to high-concentration zone
- Use onboard sensors to locate leak source
- Maintain safe distance from ignition sources

IoT Node Action:
- Increase sensor polling frequency
- Activate local alarms
- Log all readings for analysis

Human Instructions:
1. Evacuate all personnel from affected zone
2. Contact facilities management
3. Monitor rover feed from safe location
4. Do not re-enter until readings normalize

Solution Plan:
1. Immediate evacuation (0-2 min)
2. Rover deployment (2-5 min)
3. Source identification (5-15 min)
4. Ventilation activation (ongoing)
5. Area clearance verification (15-30 min)
```

## Troubleshooting

### "Gemini API key not configured"
- Check that you added `VITE_GEMINI_API_KEY` to `frontend/.env`
- Make sure there are no spaces around the `=` sign
- Restart your dev server after adding the key

### "No Data Available"
- Ensure your IoT node is online and sending data to Firebase
- Check Firebase connection status in the dashboard
- Verify you're looking at the correct zone

### "API request failed"
- Check your internet connection
- Verify your API key is valid (not expired or revoked)
- Check browser console for detailed error messages

### Button is Disabled
- Wait for sensor data to load (usually 1-2 seconds)
- Check that Firebase is connected
- Refresh the page if data doesn't appear

## Tips

💡 **Best Practice**: Generate solutions when hazard score > 30  
💡 **Frequency**: Don't spam the button - AI calls cost money  
💡 **Action**: Always follow human instructions first, then coordinate rover  
💡 **Documentation**: Screenshot solutions for incident reports  

## API Costs

Google Gemini Pro is **free** for:
- 60 requests per minute
- 1,500 requests per day

This is more than enough for typical AROHAN usage.

## Privacy & Security

✅ API key stored locally in `.env` (not in code)  
✅ `.env` is in `.gitignore` (never committed)  
✅ Sensor data sent to Google only when you click the button  
✅ No personal information included in API requests  

## What's Next?

After setup, you can:
- Test with live sensor data
- Generate solutions during hazard events
- Use recommendations to train your team
- Export solutions for safety documentation
- Integrate with your incident response procedures

---

**Need Help?** Check the full documentation in `SOLUTION_PAGE.md`
