import React, { createContext, useContext, ReactNode } from 'react';
import { 
  IoTReadings, 
  RoverControl, 
  RoverStatus, 
  Alert,
  HistoryLog,
  SystemSettings,
  updateRoverControl,
  setRoverDirection,
  setRoverMode,
  triggerEmergencyStop,
  updateSettings,
  updateThresholds,
  updateRoverBehavior,
  addAlert,
  resolveAlert
} from '@/lib/firebaseService';
import { useIoTReadings } from '@/hooks/useIoTReadings';
import { useHazardScore } from '@/hooks/useHazardScore';
import { useCalculatedHazardScore, HazardScoreComparison } from '@/hooks/useCalculatedHazardScore';
import { useRover } from '@/hooks/useRover';
import { useAlerts } from '@/hooks/useAlerts';
import { useHistory } from '@/hooks/useHistory';

interface FirebaseContextType {
  // IoT Data
  iotReadings: IoTReadings | null;
  iotLoading: boolean;
  iotError: Error | null;

  // Hazard Score (Device-reported)
  hazardScore: number;
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER';
  hazardLoading: boolean;
  hazardError: Error | null;

  // Calculated Hazard Score (Mathematical Model)
  calculatedHazardScore: number;
  calculatedRiskLevel: 'SAFE' | 'WARNING' | 'DANGER';
  hazardComparison: HazardScoreComparison | null;
  divergenceThreshold: number;

  // Rover
  roverControl: RoverControl | null;
  roverStatus: RoverStatus | null;
  roverLoading: boolean;
  setRoverDirection: (direction: RoverControl['direction'], speed?: number) => Promise<void>;
  setRoverMode: (mode: 'auto' | 'manual') => Promise<void>;
  updateRoverControl: (control: Partial<RoverControl>) => Promise<void>;
  triggerEmergency: () => Promise<void>;

  // Alerts
  alerts: Array<Alert & { id: string }>;
  unresolvedAlerts: Array<Alert & { id: string }>;
  alertsLoading: boolean;
  addAlert: (alert: Omit<Alert, 'timestamp'>) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;

  // History
  history: Array<HistoryLog & { id: string }>;
  historyLoading: boolean;

  // Settings
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  updateThresholds: (thresholds: Partial<SystemSettings['thresholds']>) => Promise<void>;
  updateRoverBehavior: (behavior: Partial<SystemSettings['roverBehavior']>) => Promise<void>;

  // System Health
  dbConnected: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use all hooks
  const { data: iotReadings, loading: iotLoading, error: iotError } = useIoTReadings();
  const { hazardScore, riskLevel, loading: hazardLoading, error: hazardError } = useHazardScore();
  const { comparison: hazardComparison, calculatedScore, divergenceThreshold } = useCalculatedHazardScore();
  const { 
    control: roverControl, 
    status: roverStatus, 
    loading: roverLoading,
    setDirection,
    setMode,
    updateControl,
    emergencyStop
  } = useRover();
  const { alerts, unresolvedAlerts, loading: alertsLoading, addAlert: addAlertFn, resolveAlert: resolveAlertFn } = useAlerts();
  const { history, loading: historyLoading } = useHistory();

  // Database connection status - consider connected if we have any data and no errors
  const dbConnected = !iotError && (iotReadings !== null || !iotLoading);

  const value: FirebaseContextType = {
    // IoT
    iotReadings,
    iotLoading,
    iotError,

    // Hazard Score (Device-reported)
    hazardScore,
    riskLevel,
    hazardLoading,
    hazardError,

    // Calculated Hazard Score (Mathematical Model)
    calculatedHazardScore: calculatedScore,
    calculatedRiskLevel: hazardComparison?.calculatedRiskLevel || 'SAFE',
    hazardComparison,
    divergenceThreshold,

    // Rover
    roverControl,
    roverStatus,
    roverLoading,
    setRoverDirection: setDirection,
    setRoverMode: setMode,
    updateRoverControl: updateControl,
    triggerEmergency: emergencyStop,

    // Alerts
    alerts,
    unresolvedAlerts,
    alertsLoading,
    addAlert: addAlertFn,
    resolveAlert: resolveAlertFn,

    // History
    history,
    historyLoading,

    // Settings
    updateSettings,
    updateThresholds,
    updateRoverBehavior,

    // System Health
    dbConnected
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
