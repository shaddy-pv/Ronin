import { useState, useEffect } from 'react';
import { 
  subscribeToRoverControl, 
  subscribeToRoverStatus,
  updateRoverControl,
  setRoverDirection,
  setRoverMode,
  triggerEmergencyStop,
  RoverControl,
  RoverStatus
} from '@/lib/firebaseService';

export const useRover = () => {
  const [control, setControl] = useState<RoverControl | null>(null);
  const [status, setStatus] = useState<RoverStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubControl = subscribeToRoverControl((data) => {
      setControl(data);
      setLoading(false);
    });

    const unsubStatus = subscribeToRoverStatus((data) => {
      setStatus(data);
    });

    return () => {
      unsubControl();
      unsubStatus();
    };
  }, []);

  return {
    control,
    status,
    loading,
    updateControl: updateRoverControl,
    setDirection: setRoverDirection,
    setMode: setRoverMode,
    emergencyStop: triggerEmergencyStop
  };
};
