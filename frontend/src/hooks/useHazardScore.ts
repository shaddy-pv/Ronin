import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { getRiskLevel } from '@/lib/hazardScore';

export const useHazardScore = () => {
  const [hazardScore, setHazardScore] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState<'SAFE' | 'WARNING' | 'DANGER'>('SAFE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const hazardScoreRef = ref(database, 'arohan/iot/hazardScore');
      
      const unsubscribe = onValue(hazardScoreRef, (snapshot) => {
        const score = snapshot.val() || 0;
        setHazardScore(score);
        setRiskLevel(getRiskLevel(score));
        setLoading(false);
      }, (err) => {
        setError(err as Error);
        setLoading(false);
      });

      return () => {
        off(hazardScoreRef);
        unsubscribe();
      };
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  return { hazardScore, riskLevel, loading, error };
};
