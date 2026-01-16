import { ServiceStatus, STATUS_ORDER, STATUS_LABELS } from "@/types/service";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StatusProgressProps {
  currentStatus: ServiceStatus;
}

export function StatusProgress({ currentStatus }: StatusProgressProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between w-full">
      {STATUS_ORDER.slice(0, -1).map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STATUS_ORDER.length - 2;

        return (
          <div key={status} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                  isCompleted && "bg-status-ready text-white",
                  isCurrent && "bg-accent text-accent-foreground animate-pulse-glow",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs text-center max-w-[60px]",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-all duration-300",
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
