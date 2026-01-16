import { Wrench } from "lucide-react";

export function Header() {
  return (
    <header className="gradient-hero text-primary-foreground py-6 px-6 shadow-elevated">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent rounded-lg">
            <Wrench className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AutoTrack</h1>
            <p className="text-sm text-primary-foreground/70">Workshop Service Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
