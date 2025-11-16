import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "SAFE" | "WARNING" | "DANGER";
  size?: "sm" | "md" | "lg";
}

export const StatusBadge = ({ status, size = "md" }: StatusBadgeProps) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const statusClasses = {
    SAFE: "bg-safe/10 text-safe border-safe/20",
    WARNING: "bg-warning/10 text-warning border-warning/20",
    DANGER: "bg-danger/10 text-danger border-danger/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold border rounded-md",
        sizeClasses[size],
        statusClasses[status]
      )}
    >
      {status}
    </span>
  );
};
