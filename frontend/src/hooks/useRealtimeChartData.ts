/**
 * Real-time Chart Data Hook
 * Provides live-updating chart data for sensor trends
 * Used by both Dashboard and Sensor Detail Drawers
 */

import { useState, useEffect, useRef } from 'react';
import { useIoTReadings } from './useIoTReadings';
import { useRoverSensors } from './useRoverSensors';
import { buildTimeSeries, formatChartTime } from '@/lib/chartUtils';

export interface ChartDataPoint {
  timestamp: number;
  time: string; // Formatted time for X-axis
  // Fixed IoT readings
  fixedMQ2: number;
  fixedMQ135: number; // Binary 0 or 1
  fixedTemp: number;
  fixedHumidity: number;
  // Rover readings (null if not connected)
  roverMQ2: number | null;
  roverMQ135: number | null; // Continuous PPM
  roverTemp: number | null;
}

interface UseRealtimeChartDataOptions {
  windowMinutes?: number; // Time window (default: 60)
  maxPoints?: number; // Max data points (default: 20)
}

export const useRealtimeChartData = (options: UseRealtimeChartDataOptions = {}) => {
  const { windowMinutes = 60, maxPoints = 20 } = options;
  
  const { data: iotReadings } = useIoTReadings();
  const { data: roverSensors } = useRoverSensors();
  
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const lastAddedTimeRef = useRef<number>(0);
  const lastValuesRef = useRef<string>('');
  const MIN_INTERVAL_MS = 3000; // Minimum 3 seconds between data points

  // Update chart data whenever IoT or Rover readings change
  useEffect(() => {
    if (!iotReadings) {
      console.log('[useRealtimeChartData] No IoT readings available');
      return;
    }

    const now = Date.now();
    const timeSinceLastAdd = now - lastAddedTimeRef.current;
    
    // Create a signature of current values to detect actual changes
    const currentValues = JSON.stringify({
      mq2: iotReadings.mq2,
      mq135: iotReadings.mq135_digital,
      temp: iotReadings.temperature,
      roverMq2: roverSensors?.mq2,
      roverMq135: roverSensors?.mq135
    });
    
    // Skip if:
    // 1. We added a point too recently AND
    // 2. Values haven't changed
    // BUT always allow the first point
    if (lastAddedTimeRef.current !== 0 && 
        timeSinceLastAdd < MIN_INTERVAL_MS && 
        currentValues === lastValuesRef.current) {
      console.log('[useRealtimeChartData] Skipping - too soon and no value change:', timeSinceLastAdd, 'ms');
      return;
    }
    
    lastAddedTimeRef.current = now;
    lastValuesRef.current = currentValues;

    const newDataPoint: ChartDataPoint = {
      timestamp: now,
      time: formatChartTime(now),
      // Fixed IoT readings
      fixedMQ2: iotReadings.mq2,
      fixedMQ135: iotReadings.mq135_digital, // Binary 0 or 1
      fixedTemp: iotReadings.temperature,
      fixedHumidity: iotReadings.humidity,
      // Rover readings (if available)
      roverMQ2: roverSensors?.mq2 ?? null,
      roverMQ135: roverSensors?.mq135 ?? null, // Continuous PPM
      roverTemp: roverSensors?.temperature ?? null,
    };

    console.log('[useRealtimeChartData] ✅ Adding new data point:', {
      timestamp: now,
      time: newDataPoint.time,
      fixedMQ2: newDataPoint.fixedMQ2,
      fixedMQ135: newDataPoint.fixedMQ135,
      roverMQ2: newDataPoint.roverMQ2,
      roverMQ135: newDataPoint.roverMQ135,
      timeSinceLastAdd: timeSinceLastAdd,
      totalPoints: chartData.length + 1
    });

    setChartData(prev => {
      // Add new point
      const updated = [...prev, newDataPoint];
      
      // Apply time window filtering and limit points
      const filtered = buildTimeSeries(updated, windowMinutes, maxPoints);
      
      console.log('[useRealtimeChartData] 📊 Chart data updated:', {
        previousCount: prev.length,
        newCount: filtered.length,
        latestPoint: filtered[filtered.length - 1]
      });
      
      return filtered;
    });
  }, [iotReadings, roverSensors, windowMinutes, maxPoints]);

  // Periodic update: Add a point every 5 seconds even if values don't change
  // This ensures the time axis keeps moving
  useEffect(() => {
    if (!iotReadings) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastAdd = now - lastAddedTimeRef.current;
      
      // Only add if it's been at least 5 seconds since last point
      if (timeSinceLastAdd >= 5000) {
        console.log('[useRealtimeChartData] ⏰ Periodic update - adding point');
        
        lastAddedTimeRef.current = now;
        
        const newDataPoint: ChartDataPoint = {
          timestamp: now,
          time: formatChartTime(now),
          fixedMQ2: iotReadings.mq2,
          fixedMQ135: iotReadings.mq135_digital,
          fixedTemp: iotReadings.temperature,
          fixedHumidity: iotReadings.humidity,
          roverMQ2: roverSensors?.mq2 ?? null,
          roverMQ135: roverSensors?.mq135 ?? null,
          roverTemp: roverSensors?.temperature ?? null,
        };

        setChartData(prev => {
          const updated = [...prev, newDataPoint];
          const filtered = buildTimeSeries(updated, windowMinutes, maxPoints);
          console.log('[useRealtimeChartData] ⏰ Periodic update complete:', filtered.length, 'points');
          return filtered;
        });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [iotReadings, roverSensors, windowMinutes, maxPoints]);

  return {
    chartData,
    isRoverConnected: roverSensors !== null,
    dataPointCount: chartData.length
  };
};
