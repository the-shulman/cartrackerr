import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "received" | "diagnosing" | "progress" | "ready";
}

const colorClasses = {
  received: "bg-status-received",
  diagnosing: "bg-status-diagnosing",
  progress: "bg-status-progress",
  ready: "bg-status-ready",
};

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  return (
    <div className="gradient-card rounded-xl p-4 shadow-card hover:shadow-elevated transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg", colorClasses[color])}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
