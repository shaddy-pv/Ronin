// Rover Alert Types
export type RoverAlertType =
  | "KNOWN_FACE"
  | "UNKNOWN_FACE"
  | "ACCIDENT"
  | "SYSTEM";

export interface RoverAlert {
  id: string;
  type: RoverAlertType;
  message: string;
  createdAt: string; // ISO timestamp
  confidence?: number;
  snapshotUrl?: string;
  meta?: Record<string, any>;
}

// Alert severity levels
export type AlertSeverity = "low" | "medium" | "high" | "critical";

// Extended alert interface for internal use
export interface ExtendedRoverAlert extends RoverAlert {
  severity: AlertSeverity;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}