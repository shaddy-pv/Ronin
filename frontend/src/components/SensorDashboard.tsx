/**
 * IoT Sensor Dashboard Component
 * 
 * Displays real-time sensor data from Firebase:
 * - Gas Sensor (MQ-2/MQ-135)
 * - Temperature & Humidity (DHT11/DHT22)
 * - Flame Sensor
 * - Motion Sensor (PIR)
 * - Hazard Score
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Thermometer, 
  Droplets, 
  Wind,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { ref as dbRef, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

interface SensorData {
  gas: number;
  temperature: number;
  humidity: number;
  flame: boolean;
  motion: boolean;
  timestamp: number;
}

interface HazardScore {
  score: number;
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

interface SensorDashboardProps {
  className?: string;
}

export const SensorDashboard: React.FC<SensorDashboardProps> = ({ className = '' }) => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [hazardScore, setHazardScore] = useState<HazardScore | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [history, setHistory] = useState<SensorData[]>([]);

  // Firebase paths
  const SENSOR_PATH = 'arohan/sensors/current';
  const HAZARD_PATH = 'arohan/hazard/score';

  // Calculate hazard score based on sensor readings
  const calculateHazardScore = useCallback((data: SensorData): HazardScore => {
    let score = 0;
    const factors: string[] = [];

    // Gas level (0-1000 ppm range)
    if (data.gas > 800) {
      score += 40;
      factors.push('Critical gas levels');
    } else if (data.gas > 600) {
      score += 30;
      factors.push('High gas levels');
    } else if (data.gas > 400) {
      score += 20;
      factors.push('Elevated gas levels');
    } else if (data.gas > 200) {
      score += 10;
      factors.push('Moderate gas levels');
    }

    // Temperature (°C)
    if (data.temperature > 50) {
      score += 30;
      factors.push('Extreme temperature');
    } else if (data.temperature > 40) {
      score += 20;
      factors.push('High temperature');
    } else if (data.temperature < 0) {
      score += 15;
      factors.push('Freezing temperature');
    }

    // Humidity (%)
    if (data.humidity > 90) {
      score += 10;
      factors.push('Very high humidity');
    } else if (data.humidity < 20) {
      score += 10;
      factors.push('Very low humidity');
    }

    // Flame detection
    if (data.flame) {
      score += 50;
      factors.push('🔥 FIRE DETECTED');
    }

    // Motion detection
    if (data.motion) {
      score += 5;
      factors.push('Motion detected');
    }

    // Determine level
    let level: HazardScore['level'] = 'safe';
    if (score >= 80) level = 'critical';
    else if (score >= 60) level = 'high';
    else if (score >= 40) level = 'medium';
    else if (score >= 20) level = 'low';

    return { score: Math.min(score, 100), level, factors };
  }, []);

  // Get trend indicator
  const getTrend = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 1) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (diff > 0) return <TrendingUp className="w-3 h-3 text-red-500" />;
    return <TrendingDown className="w-3 h-3 text-green-500" />;
  };

  // Listen to sensor data from Firebase
  useEffect(() => {
    const sensorRef = dbRef(database, SENSOR_PATH);
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData(data);
        setIsConnected(true);
        
        // Calculate hazard score
        const hazard = calculateHazardScore(data);
        setHazardScore(hazard);
        
        // Update history (keep last 20 readings)
        setHistory(prev => {
          const newHistory = [...prev, data];
          return newHistory.slice(-20);
        });
      } else {
        setIsConnected(false);
      }
    }, (error) => {
      console.error('Firebase sensor data error:', error);
      setIsConnected(false);
    });

    return () => off(sensorRef, 'value', unsubscribe);
  }, [calculateHazardScore]);

  // Get hazard badge color
  const getHazardColor = (level: HazardScore['level']) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  // Get hazard icon
  const getHazardIcon = (level: HazardScore['level']) => {
    if (level === 'critical' || level === 'high') {
      return <ShieldAlert className="w-5 h-5" />;
    }
    if (level === 'medium' || level === 'low') {
      return <Shield className="w-5 h-5" />;
    }
    return <ShieldCheck className="w-5 h-5" />;
  };

  if (!isConnected || !sensorData) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Waiting for sensor data...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure IoT sensors are connected to Firebase
          </p>
        </div>
      </Card>
    );
  }

  const previousData = history[history.length - 2];

  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h2 className="text-lg font-bold">Sensor Dashboard</h2>
        </div>
        <Badge variant="outline" className="gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </Badge>
      </div>

      {/* Hazard Score */}
      {hazardScore && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getHazardIcon(hazardScore.level)}
              <h3 className="font-semibold">Hazard Score</h3>
            </div>
            <Badge className={getHazardColor(hazardScore.level)}>
              {hazardScore.level.toUpperCase()}
            </Badge>
          </div>
          
          <Progress value={hazardScore.score} className="h-3 mb-2" />
          
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground">Score: {hazardScore.score}/100</span>
            <span className="text-muted-foreground">
              {hazardScore.score < 20 ? '✅ Safe' : 
               hazardScore.score < 40 ? '⚠️ Caution' : 
               hazardScore.score < 60 ? '🚨 Warning' : 
               hazardScore.score < 80 ? '🔴 Danger' : '💀 Critical'}
            </span>
          </div>

          {hazardScore.factors.length > 0 && (
            <div className="bg-secondary p-3 rounded-lg">
              <p className="text-xs font-semibold mb-1">Risk Factors:</p>
              <ul className="text-xs space-y-1">
                {hazardScore.factors.map((factor, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gas Sensor */}
        <Card className="p-4 bg-secondary">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-sm">Gas Level</span>
            </div>
            {previousData && getTrend(sensorData.gas, previousData.gas)}
          </div>
          <div className="text-2xl font-bold">{sensorData.gas} ppm</div>
          <Progress 
            value={(sensorData.gas / 1000) * 100} 
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {sensorData.gas < 200 ? 'Normal' : 
             sensorData.gas < 400 ? 'Moderate' : 
             sensorData.gas < 600 ? 'Elevated' : 
             sensorData.gas < 800 ? 'High' : 'Critical'}
          </p>
        </Card>

        {/* Temperature Sensor */}
        <Card className="p-4 bg-secondary">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-sm">Temperature</span>
            </div>
            {previousData && getTrend(sensorData.temperature, previousData.temperature)}
          </div>
          <div className="text-2xl font-bold">{sensorData.temperature}°C</div>
          <Progress 
            value={(sensorData.temperature / 60) * 100} 
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {sensorData.temperature < 10 ? 'Cold' : 
             sensorData.temperature < 25 ? 'Cool' : 
             sensorData.temperature < 35 ? 'Warm' : 
             sensorData.temperature < 45 ? 'Hot' : 'Extreme'}
          </p>
        </Card>

        {/* Humidity Sensor */}
        <Card className="p-4 bg-secondary">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-sm">Humidity</span>
            </div>
            {previousData && getTrend(sensorData.humidity, previousData.humidity)}
          </div>
          <div className="text-2xl font-bold">{sensorData.humidity}%</div>
          <Progress 
            value={sensorData.humidity} 
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {sensorData.humidity < 30 ? 'Dry' : 
             sensorData.humidity < 60 ? 'Comfortable' : 
             sensorData.humidity < 80 ? 'Humid' : 'Very Humid'}
          </p>
        </Card>

        {/* Flame Sensor */}
        <Card className={`p-4 ${sensorData.flame ? 'bg-red-500 text-white animate-pulse' : 'bg-secondary'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${sensorData.flame ? 'text-white' : 'text-orange-500'}`} />
              <span className="font-semibold text-sm">Flame Sensor</span>
            </div>
          </div>
          <div className="text-2xl font-bold">
            {sensorData.flame ? '🔥 FIRE!' : '✅ Clear'}
          </div>
          <p className="text-xs mt-1 opacity-80">
            {sensorData.flame ? 'FIRE DETECTED - EVACUATE!' : 'No fire detected'}
          </p>
        </Card>

        {/* Motion Sensor */}
        <Card className={`p-4 ${sensorData.motion ? 'bg-yellow-500 text-black' : 'bg-secondary'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${sensorData.motion ? 'text-black' : 'text-green-500'}`} />
              <span className="font-semibold text-sm">Motion Sensor</span>
            </div>
          </div>
          <div className="text-2xl font-bold">
            {sensorData.motion ? '👁️ Motion' : '😴 Idle'}
          </div>
          <p className="text-xs mt-1 opacity-80">
            {sensorData.motion ? 'Movement detected' : 'No movement'}
          </p>
        </Card>

        {/* Last Update */}
        <Card className="p-4 bg-secondary">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Last Update</span>
          </div>
          <div className="text-sm">
            {new Date(sensorData.timestamp).toLocaleTimeString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.floor((Date.now() - sensorData.timestamp) / 1000)}s ago
          </p>
        </Card>
      </div>

      {/* History Chart Preview */}
      {history.length > 1 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold text-sm mb-3">Recent Trends</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Gas Avg</p>
              <p className="font-semibold">
                {Math.round(history.reduce((sum, d) => sum + d.gas, 0) / history.length)} ppm
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Temp Avg</p>
              <p className="font-semibold">
                {Math.round(history.reduce((sum, d) => sum + d.temperature, 0) / history.length)}°C
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Humidity Avg</p>
              <p className="font-semibold">
                {Math.round(history.reduce((sum, d) => sum + d.humidity, 0) / history.length)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
