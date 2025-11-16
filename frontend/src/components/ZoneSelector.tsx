import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Circle } from "lucide-react";

export const ZoneSelector = () => {
  const zones = [
    { id: "zone-a", name: "Zone A", status: "safe" as const },
    { id: "zone-b", name: "Zone B", status: "offline" as const },
    { id: "zone-c", name: "Zone C", status: "not-configured" as const },
  ];

  const getStatusColor = (status: string) => {
    if (status === "safe") return "bg-safe";
    if (status === "offline") return "bg-muted-foreground";
    return "bg-muted-foreground";
  };

  const getStatusLabel = (status: string) => {
    if (status === "safe") return "Safe";
    if (status === "offline") return "Offline";
    return "Not Configured";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Select defaultValue="zone-a">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">(Current)</span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {zones.map((zone) => (
          <div key={zone.id} className="flex items-center gap-2">
            <Circle className={`w-2 h-2 ${getStatusColor(zone.status)}`} />
            <span className="text-muted-foreground">{zone.name}</span>
            <span className="text-xs">– {getStatusLabel(zone.status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
