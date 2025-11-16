/**
 * Pure utility functions for hazard score calculation
 * Based on RONIN mathematical model
 */

export interface SensorRanges {
  mq135: { min: number; max: number };
  mq2: { min: number; max: number };
  temp: { min: number; max: number };
}

export const DEFAULT_SENSOR_RANGES: SensorRanges = {
  mq135: { min: 300, max: 1000 },
  mq2: { min: 200, max: 800 },
  temp: { min: 20, max: 50 }
};

/**
 * Normalize a sensor value to 0-100 scale
 * Formula: Norm = 100 * (Rx - Rmin) / (Rmax - Rmin)
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  const normalized = (100 * (value - min)) / (max - min);
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Compute hazard score using weighted formula
 * HazardScore = (0.6 × MQ135) + (0.3 × MQ2) + (0.1 × Temp)
 */
export function computeHazardScore(
  mq135: number,
  mq2: number,
  temperature: number,
  ranges: SensorRanges = DEFAULT_SENSOR_RANGES
): number {
  const normMQ135 = normalize(mq135, ranges.mq135.min, ranges.mq135.max);
  const normMQ2 = normalize(mq2, ranges.mq2.min, ranges.mq2.max);
  const normTemp = normalize(temperature, ranges.temp.min, ranges.temp.max);

  const hazardScore = 0.6 * normMQ135 + 0.3 * normMQ2 + 0.1 * normTemp;
  
  return Math.max(0, Math.min(100, hazardScore));
}

/**
 * Get risk level classification based on hazard score
 * 0-30: SAFE
 * 30-60: WARNING
 * 60-100: DANGER
 */
export function getRiskLevel(hazardScore: number): 'SAFE' | 'WARNING' | 'DANGER' {
  if (hazardScore < 30) return 'SAFE';
  if (hazardScore < 60) return 'WARNING';
  return 'DANGER';
}

/**
 * Get risk color for UI display
 */
export function getRiskColor(riskLevel: 'SAFE' | 'WARNING' | 'DANGER'): string {
  switch (riskLevel) {
    case 'SAFE':
      return 'text-green-500';
    case 'WARNING':
      return 'text-yellow-500';
    case 'DANGER':
      return 'text-red-500';
  }
}

/**
 * Calculate individual sensor contribution to hazard score
 */
export function getSensorContribution(
  sensorValue: number,
  sensorType: 'mq135' | 'mq2' | 'temp',
  ranges: SensorRanges = DEFAULT_SENSOR_RANGES
): { normalized: number; contribution: number; weight: number } {
  const weights = {
    mq135: 0.6,
    mq2: 0.3,
    temp: 0.1
  };

  const rangeMap = {
    mq135: ranges.mq135,
    mq2: ranges.mq2,
    temp: ranges.temp
  };

  const normalized = normalize(sensorValue, rangeMap[sensorType].min, rangeMap[sensorType].max);
  const weight = weights[sensorType];
  const contribution = normalized * weight;

  return { normalized, contribution, weight };
}
