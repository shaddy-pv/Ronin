import { IoTReadings, RoverControl, RoverStatus, Alert, HistoryLog } from './firebaseService';

// Generate realistic mock IoT readings
export const generateMockIoTReadings = (): IoTReadings => {
    const baseHazard = Math.random() * 100;
    const riskLevel: 'SAFE' | 'WARNING' | 'DANGER' = 
        baseHazard < 30 ? 'SAFE' : baseHazard < 60 ? 'WARNING' : 'DANGER';

    return {
        mq2: Math.floor(200 + Math.random() * 600), // 200-800 range
        mq135: Math.floor(300 + Math.random() * 700), // 300-1000 range
        mq135_raw: Math.random() > 0.5 ? 1 : 0,
        mq135_digital: Math.random() > 0.5 ? 1 : 0,
        temperature: Math.floor(20 + Math.random() * 15), // 20-35°C
        humidity: Math.floor(40 + Math.random() * 40), // 40-80%
        flame: Math.random() > 0.95, // 5% chance of flame detection
        motion: Math.random() > 0.7, // 30% chance of motion
        hazardScore: Math.floor(baseHazard),
        riskLevel,
        status: {
            online: true,
            lastHeartbeat: Date.now()
        },
        emergency: {
            active: false,
            timestamp: 0
        }
    };
};

// Generate mock rover control state
export const generateMockRoverControl = (): RoverControl => {
    const directions: RoverControl['direction'][] = ['forward', 'back', 'left', 'right', 'stop'];
    return {
        direction: directions[Math.floor(Math.random() * directions.length)],
        speed: Math.floor(Math.random() * 100),
        mode: Math.random() > 0.5 ? 'auto' : 'manual',
        emergency: false
    };
};

// Generate mock rover status
export const generateMockRoverStatus = (): RoverStatus => {
    return {
        battery: Math.floor(20 + Math.random() * 80), // 20-100%
        location: Math.random() > 0.5 ? 'Zone A' : 'Zone B',
        online: true
    };
};

// Generate mock alerts
export const generateMockAlerts = (count: number = 10): Alert[] => {
    const types = ['Gas Leak', 'Fire Detected', 'High Temperature', 'Motion Detected', 'System Error'];
    const severities: Alert['severity'][] = ['low', 'medium', 'high', 'critical'];

    return Array.from({ length: count }, (_, i) => ({
        timestamp: Date.now() - (i * 3600000), // 1 hour apart
        type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        summary: `Alert ${i + 1}: Detected anomaly in sensor readings`,
        resolved: Math.random() > 0.3 // 70% resolved
    }));
};

// Generate mock history logs
export const generateMockHistory = (count: number = 50): HistoryLog[] => {
    return Array.from({ length: count }, (_, i) => {
        const hazardScore = Math.floor(Math.random() * 100);
        return {
            timestamp: Date.now() - (i * 300000), // 5 minutes apart
            mq2: Math.floor(200 + Math.random() * 600),
            mq135: Math.floor(300 + Math.random() * 700),
            temperature: Math.floor(20 + Math.random() * 15),
            flame: Math.random() > 0.95,
            motion: Math.random() > 0.7,
            hazardScore,
            riskLevel: hazardScore < 30 ? 'SAFE' : hazardScore < 60 ? 'WARNING' : 'DANGER'
        };
    });
};

// Simulate real-time updates
export class MockDataSimulator {
    private intervals: NodeJS.Timeout[] = [];

    startIoTSimulation(callback: (data: IoTReadings) => void, intervalMs: number = 3000) {
        const interval = setInterval(() => {
            callback(generateMockIoTReadings());
        }, intervalMs);
        this.intervals.push(interval);

        // Send initial data
        callback(generateMockIoTReadings());
    }

    startRoverSimulation(
        controlCallback: (data: RoverControl) => void,
        statusCallback: (data: RoverStatus) => void,
        intervalMs: number = 5000
    ) {
        const interval = setInterval(() => {
            controlCallback(generateMockRoverControl());
            statusCallback(generateMockRoverStatus());
        }, intervalMs);
        this.intervals.push(interval);

        // Send initial data
        controlCallback(generateMockRoverControl());
        statusCallback(generateMockRoverStatus());
    }

    stopAll() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
}
