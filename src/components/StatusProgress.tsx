import { ServiceStatus, STATUS_ORDER, STATUS_LABELS } from "@/types/service";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StatusProgressProps {
  currentStatus: ServiceStatus;
}

export function StatusProgress({ currentStatus }: StatusProgressProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  // On mobile, show fewer steps to avoid overflow
  const displayStatuses = STATUS_ORDER.slice(0, -1);

  return (
    <div className="flex items-center justify-between w-full overflow-x-auto pb-1">
      {displayStatuses.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === displayStatuses.length - 1;

        return (
          <div key={status} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center min-w-0">
              <div
                className={cn(
                  "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-medium transition-all duration-300 flex-shrink-0",
                  isCompleted && "bg-status-ready text-white",
                  isCurrent && "bg-accent text-accent-foreground animate-pulse-glow",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-1 md:mt-2 text-[9px] md:text-xs text-center max-w-[56px] md:max-w-[72px] leading-tight line-clamp-2 break-words",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
                title={STATUS_LABELS[status]}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-1 md:mx-2 transition-all duration-300 min-w-[8px]",
                  index < currentIndex ? "bg-status-ready" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
