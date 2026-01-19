import { Wrench } from "lucide-react";
import { BrandingConfig } from "@/types/branding";
import { SettingsDialog } from "@/components/SettingsDialog";

interface HeaderProps {
  branding: BrandingConfig;
  onUpdateBranding: (updates: Partial<BrandingConfig>) => void;
  onResetBranding: () => void;
}

export function Header({ branding, onUpdateBranding, onResetBranding }: HeaderProps) {
  return (
    <header className="gradient-hero text-primary-foreground py-4 md:py-6 px-4 md:px-6 shadow-elevated">
      <div className="container mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.workshopName} 
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-contain bg-accent p-1 flex-shrink-0"
            />
          ) : (
            <div className="p-1.5 md:p-2 bg-accent rounded-lg flex-shrink-0">
              <Wrench className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate">{branding.workshopName}</h1>
            <p className="text-xs md:text-sm text-primary-foreground/70 truncate">{branding.tagline}</p>
          </div>
        </div>
        <SettingsDialog 
          branding={branding} 
          onUpdate={onUpdateBranding} 
          onReset={onResetBranding} 
        />
      </div>
    </header>
  );
}
