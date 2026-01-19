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
    <header className="gradient-hero text-primary-foreground py-6 px-6 shadow-elevated">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.workshopName} 
              className="w-10 h-10 rounded-lg object-contain bg-accent p-1"
            />
          ) : (
            <div className="p-2 bg-accent rounded-lg">
              <Wrench className="w-6 h-6 text-accent-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{branding.workshopName}</h1>
            <p className="text-sm text-primary-foreground/70">{branding.tagline}</p>
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
