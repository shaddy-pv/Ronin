import { Card } from "@/components/ui/card";
import { AlertTriangle, Wind, Flame, Activity, CheckCircle } from "lucide-react";

export const IncidentTimeline = () => {
  const events = [
    {
      time: "17:45:10",
      label: "Gas spike detected (MQ-135 high)",
      icon: Wind,
      severity: "warning" as const,
    },
    {
      time: "17:45:12",
      label: "HazardScore crossed Warning threshold",
      icon: AlertTriangle,
      severity: "warning" as const,
    },
    {
      time: "17:45:15",
      label: "Rover auto-dispatched to Zone A",
      icon: Activity,
      severity: "info" as const,
    },
    {
      time: "17:46:00",
      label: "Rover reached Zone A",
      icon: Activity,
      severity: "info" as const,
    },
    {
      time: "17:48:30",
      label: "Investigation complete - False alarm",
      icon: CheckCircle,
      severity: "safe" as const,
    },
  ];

  const getSeverityColor = (severity: "warning" | "info" | "safe" | "danger") => {
    switch (severity) {
      case "warning":
        return "text-warning bg-warning/10 border-warning/20";
      case "danger":
        return "text-danger bg-danger/10 border-danger/20";
      case "safe":
        return "text-safe bg-safe/10 border-safe/20";
      default:
        return "text-primary bg-primary/10 border-primary/20";
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Incident Timeline</h2>
      <div className="space-y-3">
        {events.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg border ${getSeverityColor(event.severity)}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{event.label}</span>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
