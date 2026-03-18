import { useState, useEffect, useMemo } from 'react';
import { useIoTReadings } from './useIoTReadings';
import { useRoverSensors } from './useRoverSensors';
import { computeHazardScore, getRiskLevel, DEFAULT_SENSOR_RANGES } from '@/lib/hazardScore';
import { getEffectiveMQ135 } from '@/lib/sensorData';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { logger } from '@/lib/logger';

export interface HazardScoreComparison {
  deviceScore: number;
  calculatedScore: number;
  divergence: number;
  divergencePercentage: number;
  deviceRiskLevel: 'SAFE' | 'WARNING' | 'DANGER';
  calculatedRiskLevel: 'SAFE' | 'WARNING' | 'DANGER';
  effectiveMQ135: number;
  isRoverOnline: boolean;
  timestamp: number;
}

export interface DivergenceEvent {
  timestamp: number;
  deviceScore: number;
  calculatedScore: number;
  divergence: number;
  divergencePercentage: number;
  sensorSnapshot: {
    mq135_digital: number;
    mq135_rover: number | null;
    mq2: number;
    temperature: number;
    effectiveMQ135: number;
  };
  threshold: number;
}

const DIVERGENCE_THRESHOLD = 15; // Alert when divergence > 15 points

export const useCalculatedHazardScore = () => {
  const { data: iotReadings, loading: iotLoading } = useIoTReadings();
  const { data: roverSensors, loading: roverLoading } = useRoverSensors();
  const [lastDivergenceAlert, setLastDivergenceAlert] = useState<number>(0);

  // Calculate the hazard score using our mathematical model
  const calculatedScore = useMemo(() => {
    if (!iotReadings) return 0;

    // Get effective MQ-135 value (max of fixed binary and rover continuous)
    const roverMQ135 = roverSensors?.mq135 ?? null;
    const effectiveMQ135 = getEffectiveMQ135(
      iotReadings.mq135_digital,
      roverMQ135
    );

    // Calculate hazard score using our mathematical model
    return computeHazardScore(
      effectiveMQ135,
      iotReadings.mq2,
      iotReadings.temperature,
      DEFAULT_SENSOR_RANGES,
      true // MQ-135 effective value is already normalized (0-100)
    );
  }, [iotReadings, roverSensors]);

  // Create comparison object
  const comparison: HazardScoreComparison | null = useMemo(() => {
    if (!iotReadings) return null;

    const deviceScore = iotReadings.hazardScore;
    const divergence = Math.abs(deviceScore - calculatedScore);
    const divergencePercentage = deviceScore > 0 ? (divergence / deviceScore) * 100 : 0;

    const roverMQ135 = roverSensors?.mq135 ?? null;
    const effectiveMQ135 = getEffectiveMQ135(
      iotReadings.mq135_digital,
      roverMQ135
    );

    return {
      deviceScore,
      calculatedScore,
      divergence,
      divergencePercentage,
      deviceRiskLevel: getRiskLevel(deviceScore),
      calculatedRiskLevel: getRiskLevel(calculatedScore),
      effectiveMQ135,
      isRoverOnline: roverSensors !== null,
      timestamp: Date.now()
    };
  }, [iotReadings, roverSensors, calculatedScore]);

  // Log divergence events to Firebase
  useEffect(() => {
    if (!comparison || !iotReadings) return;

    const { divergence, divergencePercentage } = comparison;
    const now = Date.now();

    // Check if divergence exceeds threshold and we haven't alerted recently (within 30 seconds)
    if (divergence > DIVERGENCE_THRESHOLD && (now - lastDivergenceAlert) > 30000) {
      const divergenceEvent: DivergenceEvent = {
        timestamp: now,
        deviceScore: comparison.deviceScore,
        calculatedScore: comparison.calculatedScore,
        divergence,
        divergencePercentage,
        sensorSnapshot: {
          mq135_digital: iotReadings.mq135_digital,
          mq135_rover: roverSensors?.mq135 ?? null,
          mq2: iotReadings.mq2,
          temperature: iotReadings.temperature,
          effectiveMQ135: comparison.effectiveMQ135
        },
        threshold: DIVERGENCE_THRESHOLD
      };

      // Log to Firebase for audit
      const divergenceRef = ref(database, 'ronin/validation/divergence_events');
      const newEventRef = push(divergenceRef);
      set(newEventRef, divergenceEvent).catch((error) => {
        logger.error('Failed to log divergence event', error);
      });

      setLastDivergenceAlert(now);

      logger.warn('Hazard Score Divergence Detected', {
        divergence: divergence.toFixed(1),
        percentage: divergencePercentage.toFixed(1) + '%',
        device: comparison.deviceScore.toFixed(1),
        calculated: comparison.calculatedScore.toFixed(1),
        threshold: DIVERGENCE_THRESHOLD
      });
    }
  }, [comparison, iotReadings, roverSensors, lastDivergenceAlert]);

  return {
    comparison,
    calculatedScore,
    loading: iotLoading || roverLoading,
    divergenceThreshold: DIVERGENCE_THRESHOLD
  };
};