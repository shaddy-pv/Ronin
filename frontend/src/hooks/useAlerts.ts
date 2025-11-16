import { useState, useEffect, useMemo } from 'react';
import { subscribeToAlerts, addAlert, resolveAlert, Alert } from '@/lib/firebaseService';

export const useAlerts = () => {
  const [alertsData, setAlertsData] = useState<Record<string, Alert> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts((data) => {
      setAlertsData(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const alerts = useMemo(() => {
    if (!alertsData) return [];
    return Object.entries(alertsData).map(([id, alert]) => ({
      id,
      ...alert
    })).sort((a, b) => b.timestamp - a.timestamp);
  }, [alertsData]);

  const unresolvedAlerts = useMemo(() => {
    return alerts.filter(alert => !alert.resolved);
  }, [alerts]);

  return {
    alerts,
    unresolvedAlerts,
    loading,
    addAlert,
    resolveAlert
  };
};
