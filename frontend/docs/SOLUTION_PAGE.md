# AI Hazard Solution Page

## Overview
The Solution page provides AI-powered hazard analysis and safety recommendations based on real-time sensor data from your RONIN IoT nodes.

## Features

### Real-Time Sensor Display
- **MQ-2 (Flammable Gas)**: Raw and normalized readings
- **MQ-135 (Air Quality/Toxic Gas)**: Raw and normalized readings
- **Temperature & Humidity**: Environmental conditions
- **Flame Sensor**: Fire detection status
- **Motion Sensor**: Human presence detection
- **Hazard Score**: Overall risk assessment (0-100)

### AI-Powered Analysis
When you click "Generate Solution using AI", the system:
1. Fetches current sensor readings from Firebase
2. Sends data to Google Gemini AI
3. Receives structured safety recommendations
4. Displays actionable insights

### Solution Components
The AI provides:
- **Hazard Type**: Classification of the detected hazard
- **Recommended Response**: Immediate actions to take
- **Rover Action**: What the autonomous rover should do
- **IoT Node Action**: How fixed sensors should respond
- **Human Instructions**: What the operator must do
- **Solution Plan**: Step-by-step action plan

## Setup

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment
Add your Gemini API key to `frontend/.env`:

```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Access the Page
Navigate to `/solution` in your RONIN dashboard or click "Solution" in the sidebar.

## Usage

1. **View Current Readings**: The page automatically displays live sensor data from Firebase
2. **Generate Solution**: Click the "Generate Solution using AI" button
3. **Review Recommendations**: Read through each section of the AI-generated solution
4. **Take Action**: Follow the human operator instructions and coordinate with rover/IoT systems

## Technical Details

### API Integration
- Uses Google Gemini Pro model
- Direct frontend API calls (no backend required)
- Structured JSON response parsing
- Error handling for API failures

### Data Flow
```
Firebase (IoT Readings) → SolutionPage → Gemini API → Parsed Solution → UI Display
```

### Firebase Path
Reads from: `/ronin/iot/<currentZone>/sensors`

### Security
- API key stored in environment variables
- Never committed to version control
- Client-side API calls with CORS support

## Error Handling

The page handles:
- Missing API key configuration
- Network failures
- Invalid API responses
- Missing sensor data
- JSON parsing errors

## UI Components

Built with:
- shadcn/ui Card components
- Lucide React icons
- Dark theme compatible
- Responsive grid layout
- Loading states
- Error states

## Navigation

Located in sidebar:
- Position: Below "Rover Console"
- Above: "Alerts"
- Icon: Lightbulb
- Route: `/solution`

## Future Enhancements

Potential improvements:
- Solution history/logging
- Export recommendations as PDF
- Auto-trigger on high hazard scores
- Multi-language support
- Voice alerts for critical situations
