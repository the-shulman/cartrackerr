import { Badge } from "@/components/ui/badge";
import { ServiceStatus, STATUS_LABELS } from "@/types/service";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: ServiceStatus;
  size?: 'sm' | 'default';
}

const statusVariantMap: Record<ServiceStatus, "received" | "diagnosing" | "awaiting" | "progress" | "ready" | "delivered"> = {
  received: "received",
  diagnosing: "diagnosing",
  awaiting_approval: "awaiting",
  in_progress: "progress",
  ready: "ready",
  delivered: "delivered",
};

export function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  return (
    <Badge 
      variant={statusVariantMap[status]}
      className={cn(size === 'sm' && 'text-xs px-2 py-0')}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
