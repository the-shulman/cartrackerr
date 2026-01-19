import { cn } from "@/lib/utils";
import { ServiceStatus, STATUS_LABELS } from "@/types/service";

interface FilterTabsProps {
  activeFilter: ServiceStatus | 'all';
  onFilterChange: (filter: ServiceStatus | 'all') => void;
  counts: Record<ServiceStatus | 'all', number>;
}

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const filters: (ServiceStatus | 'all')[] = ['all', 'received', 'diagnosing', 'awaiting_approval', 'in_progress', 'ready', 'delivered'];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
            activeFilter === filter
              ? "gradient-accent text-accent-foreground shadow-glow"
              : "bg-card text-muted-foreground hover:bg-muted"
          )}
        >
          {filter === 'all' ? 'All Services' : STATUS_LABELS[filter]}
          <span className={cn(
            "ml-2 px-2 py-0.5 rounded-full text-xs",
            activeFilter === filter 
              ? "bg-white/20" 
              : "bg-muted"
          )}>
            {counts[filter]}
          </span>
        </button>
      ))}
    </div>
  );
}
