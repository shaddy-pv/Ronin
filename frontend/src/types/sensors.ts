/**
 * Sensor data types for AROHAN Command Center
 * Supports both Fixed IoT node and Rover node readings
 */

export type SensorSource = 'fixed' | 'rover';
export type SensorType = 'MQ2' | 'MQ135' | 'temperature' | 'flame' | 'motion';

/**
 * Time-series reading for a specific sensor
 */
export interface SensorReading {
  timestamp: number;
  value: number;
  source: SensorSource;
  sensorType: SensorType;
}

/**
 * MQ-2 sensor reading (continuous analog)
 */
export interface MQ2Reading {
  raw: number;
  normalized: number;
  timestamp: number;
  source: SensorSource;
}

/**
 * MQ-135 sensor reading
 * - Fixed IoT: Binary threshold (0 or 1) from digital output
 * - Rover: Continuous analog reading (PPM)
 */
export interface MQ135Reading {
  digital: 0 | 1; // Threshold crossed flag (fixed IoT only)
  raw: 0 | 1; // Raw digital reading (fixed IoT only)
  analog?: number; // Continuous analog reading (rover only)
  timestamp: number;
  source: SensorSource;
}

/**
 * Comparison data for sensor detail views
 */
export interface SensorComparisonData {
  fixed: SensorReading[];
  rover: SensorReading[];
}

/**
 * Normalized sensor values for hazard calculation
 */
export interface NormalizedSensorValues {
  mq2: number; // 0-100
  mq135: number; // 0-100 (or 0/100 for binary)
  temperature: number; // 0-100
}

/**
 * Hazard contribution breakdown
 */
export interface HazardContribution {
  mq2: {
    normalized: number;
    weight: number;
    contribution: number;
  };
  mq135: {
    normalized: number;
    weight: number;
    contribution: number;
    isBinary: boolean; // Flag to indicate binary vs continuous
  };
  temperature: {
    normalized: number;
    weight: number;
    contribution: number;
  };
  total: number;
}
