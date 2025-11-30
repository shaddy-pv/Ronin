/**
 * Centralized sensor data utilities and mock data
 * This file provides a single source of truth for sensor data handling
 */

import { SensorReading, SensorSource, MQ2Reading, MQ135Reading, HazardContribution } from '@/types/sensors';
import { IoTReadings } from '@/lib/firebaseService';
import { getSensorContribution, DEFAULT_SENSOR_RANGES } from '@/lib/hazardScore';

/**
 * Convert IoT readings to time-series format
 */
export function convertToTimeSeries(
  readings: IoTReadings,
  source: SensorSource = 'fixed'
): {
  mq2: SensorReading;
  mq135: SensorReading;
  temperature: SensorReading;
} {
  const timestamp = readings.status?.lastHeartbeat || Date.now();

  return {
    mq2: {
      timestamp,
      value: readings.mq2,
      source,
      sensorType: 'MQ2'
    },
    mq135: {
      timestamp,
      value: readings.mq135_digital, // Use digital output for MQ-135
      source,
      sensorType: 'MQ135'
    },
    temperature: {
      timestamp,
      value: readings.temperature,
      source,
      sensorType: 'temperature'
    }
  };
}

/**
 * Get MQ-2 reading with normalization
 */
export function getMQ2Reading(iotReadings: IoTReadings, source: SensorSource = 'fixed'): MQ2Reading {
  const contribution = getSensorContribution(iotReadings.mq2, 'mq2');
  
  return {
    raw: iotReadings.mq2,
    normalized: contribution.normalized,
    timestamp: iotReadings.status?.lastHeartbeat || Date.now(),
    source
  };
}

/**
 * Get MQ-135 reading
 * - Fixed IoT: Binary threshold (0/1) from digital output
 * - Rover: Continuous analog reading (0-1000 PPM)
 */
export function getMQ135Reading(iotReadings: IoTReadings, source: SensorSource = 'fixed'): MQ135Reading {
  return {
    digital: iotReadings.mq135_digital,
    raw: iotReadings.mq135_raw,
    timestamp: iotReadings.status?.lastHeartbeat || Date.now(),
    source
  };
}

/**
 * Normalize MQ-135 reading based on source type
 * - Fixed IoT: Binary → 0 or 100
 * - Rover: Continuous → normalized 0-100 based on range
 */
export function normalizeMQ135(value: number, source: SensorSource, isBinary: boolean = true): number {
  if (source === 'fixed' && isBinary) {
    // Fixed IoT: Binary threshold (0 or 1) → 0 or 100
    return value === 1 ? 100 : 0;
  } else {
    // Rover: Continuous analog reading (300-1000 PPM range)
    const min = DEFAULT_SENSOR_RANGES.mq135.min;
    const max = DEFAULT_SENSOR_RANGES.mq135.max;
    const normalized = (100 * (value - min)) / (max - min);
    return Math.max(0, Math.min(100, normalized));
  }
}

/**
 * Calculate effective MQ-135 value for hazard score
 * Uses max(roverNormalized, fixedNormalized) to get worst-case reading
 */
export function getEffectiveMQ135(
  fixedReading: number,  // Binary 0 or 1
  roverReading: number | null  // Continuous PPM or null if not available
): number {
  const fixedNormalized = normalizeMQ135(fixedReading, 'fixed', true);
  
  if (roverReading === null) {
    // Rover not available, use fixed only
    return fixedNormalized;
  }
  
  const roverNormalized = normalizeMQ135(roverReading, 'rover', false);
  
  // Return worst-case (maximum) normalized value
  return Math.max(fixedNormalized, roverNormalized);
}

/**
 * Calculate hazard contribution breakdown
 * Uses effective MQ-135 value (max of fixed binary and rover continuous)
 */
export function calculateHazardContribution(
  iotReadings: IoTReadings,
  roverMQ135?: number | null
): HazardContribution {
  const mq2Contrib = getSensorContribution(iotReadings.mq2, 'mq2');
  const tempContrib = getSensorContribution(iotReadings.temperature, 'temp');
  
  // Calculate effective MQ-135 (max of fixed binary and rover continuous)
  const effectiveMQ135Normalized = getEffectiveMQ135(
    iotReadings.mq135_digital,
    roverMQ135 ?? null
  );
  const mq135Contribution = effectiveMQ135Normalized * 0.6; // 60% weight

  return {
    mq2: {
      normalized: mq2Contrib.normalized,
      weight: mq2Contrib.weight,
      contribution: mq2Contrib.contribution
    },
    mq135: {
      normalized: effectiveMQ135Normalized,
      weight: 0.6,
      contribution: mq135Contribution,
      isBinary: roverMQ135 === null || roverMQ135 === undefined // Binary if no rover data
    },
    temperature: {
      normalized: tempContrib.normalized,
      weight: tempContrib.weight,
      contribution: tempContrib.contribution
    },
    total: mq2Contrib.contribution + mq135Contribution + tempContrib.contribution
  };
}

/**
 * Note: This is a placeholder function.
 * In components, use the useRoverSensors() hook directly instead.
 * This function exists for backward compatibility only.
 */
export function getRoverReadings(): null {
  // Components should use useRoverSensors() hook directly
  return null;
}

/**
 * Build time-series history for charts
 * Combines current reading with historical data
 */
export function buildTimeSeries(
  currentReading: SensorReading,
  history: SensorReading[]
): SensorReading[] {
  const combined = [...history, currentReading];
  // Keep last 60 readings (1 hour at 1 reading/minute)
  return combined.slice(-60);
}

/**
 * Format timestamp for chart display
 */
export function formatChartTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get status label for MQ-2 reading
 */
export function getMQ2Status(normalized: number): string {
  if (normalized < 30) return 'Normal';
  if (normalized < 50) return 'Elevated';
  if (normalized < 70) return 'High';
  return 'Critical';
}

/**
 * Get status label for MQ-135 (binary)
 */
export function getMQ135Status(digital: 0 | 1): string {
  return digital === 1 ? 'Threshold Exceeded' : 'Normal';
}

/**
 * Get risk color class for normalized value
 */
export function getRiskColorClass(normalized: number): string {
  if (normalized < 30) return 'text-safe';
  if (normalized < 60) return 'text-warning';
  return 'text-danger';
}
