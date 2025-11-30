import { useState, useEffect } from 'react';
import { subscribeToRoverSensors, RoverSensors } from '@/lib/firebaseService';

/**
 * Hook to subscribe to rover sensor readings
 * Rover has continuous analog readings for all sensors including MQ-135
 */
export const useRoverSensors = () => {
  const [data, setData] = useState<RoverSensors | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToRoverSensors((sensorData) => {
      setData(sensorData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { data, loading };
};
