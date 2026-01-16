import { Badge } from "@/components/ui/badge";
import { ServiceStatus, STATUS_LABELS } from "@/types/service";

interface StatusBadgeProps {
  status: ServiceStatus;
}

const statusVariantMap: Record<ServiceStatus, "received" | "diagnosing" | "progress" | "ready" | "delivered"> = {
  received: "received",
  diagnosing: "diagnosing",
  in_progress: "progress",
  ready: "ready",
  delivered: "delivered",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
