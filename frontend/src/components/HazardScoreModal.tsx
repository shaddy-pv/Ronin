import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HazardScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HazardScoreModal = ({ open, onOpenChange }: HazardScoreModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>How RONIN Calculates Hazard Score</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The RONIN system uses a weighted algorithm to assess environmental hazards in real-time. 
            Multiple sensor inputs are normalized and combined to produce a single, actionable safety score 
            ranging from 0 (completely safe) to 100 (critical danger).
          </p>

          <div className="bg-secondary p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">Step 1: Normalize Each Sensor (0-100)</h4>
            <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`Norm = 100 × (Rₓ - Rₘᵢₙ) / (Rₘₐₓ - Rₘᵢₙ)`}
            </pre>

            <h4 className="font-semibold text-sm mt-4">Step 2: Weighted Hazard Score</h4>
            <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`HazardScore = 0.6 × Norm(MQ-135)
            + 0.3 × Norm(MQ-2)
            + 0.1 × Norm(Temperature)`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Risk Classification</h4>
            <div className="grid gap-2">
              <div className="flex items-center gap-3 p-2 bg-safe/10 rounded border border-safe/20">
                <div className="w-16 text-xs font-semibold text-safe">0 - 30</div>
                <div className="text-sm">SAFE - All systems normal</div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-warning/10 rounded border border-warning/20">
                <div className="w-16 text-xs font-semibold text-warning">30 - 60</div>
                <div className="text-sm">WARNING - Elevated levels detected</div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-danger/10 rounded border border-danger/20">
                <div className="w-16 text-xs font-semibold text-danger">60 - 100</div>
                <div className="text-sm">DANGER - Immediate action required</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
