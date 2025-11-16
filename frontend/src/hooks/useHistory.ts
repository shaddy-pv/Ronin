import { useState, useEffect, useMemo } from 'react';
import { subscribeToHistory, addHistoryLog, HistoryLog } from '@/lib/firebaseService';

export const useHistory = () => {
  const [historyData, setHistoryData] = useState<Record<string, HistoryLog> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToHistory((data) => {
      setHistoryData(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const history = useMemo(() => {
    if (!historyData) return [];
    return Object.entries(historyData).map(([id, log]) => ({
      id,
      ...log
    })).sort((a, b) => b.timestamp - a.timestamp);
  }, [historyData]);

  return {
    history,
    loading,
    addLog: addHistoryLog
  };
};
