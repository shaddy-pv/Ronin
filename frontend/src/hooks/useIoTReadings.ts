import { useState, useEffect } from 'react';
import { subscribeToIoTReadings, IoTReadings } from '@/lib/firebaseService';

export const useIoTReadings = () => {
  const [data, setData] = useState<IoTReadings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const unsubscribe = subscribeToIoTReadings((readings) => {
        setData(readings);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
};
