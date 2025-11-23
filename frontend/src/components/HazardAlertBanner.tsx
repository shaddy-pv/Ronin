import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

interface HazardAlertBannerProps {
  hazardScore: number;
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER';
}

export const HazardAlertBanner = ({ hazardScore, riskLevel }: HazardAlertBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when risk level changes
  useEffect(() => {
    setDismissed(false);
  }, [riskLevel]);

  // Don't show banner if dismissed or safe
  if (dismissed || riskLevel === 'SAFE') {
    return null;
  }

  const isDanger = hazardScore >= 61;
  const isWarning = hazardScore >= 31 && hazardScore <= 60;

  if (!isDanger && !isWarning) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        isDanger
          ? 'bg-danger text-white'
          : 'bg-warning text-black'
      } shadow-lg animate-in slide-in-from-top duration-300`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <div className="font-bold text-lg">
              {isDanger ? '🚨 DANGER — Immediate Action Required' : '⚠️ WARNING — Check Situation'}
            </div>
            <div className="text-sm opacity-90">
              {isDanger
                ? `Critical hazard level detected: ${hazardScore.toFixed(1)}/100. Evacuate area and investigate immediately.`
                : `Elevated hazard level: ${hazardScore.toFixed(1)}/100. Monitor situation closely and prepare for action.`}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          className={`flex-shrink-0 ${
            isDanger
              ? 'hover:bg-danger-foreground/20 text-white'
              : 'hover:bg-warning-foreground/20'
          }`}
          aria-label="Dismiss alert"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
