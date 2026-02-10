import { Wrench, LogOut, BarChart3, Clock, CreditCard } from "lucide-react";
import { BrandingConfig } from "@/types/branding";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  branding: BrandingConfig;
  onUpdateBranding: (updates: Partial<BrandingConfig>) => void;
  onResetBranding: () => void;
}

export function Header({ branding, onUpdateBranding, onResetBranding }: HeaderProps) {
  const { signOut, user } = useAuthContext();
  const { isTrial, trialEnd } = useSubscription();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
      return;
    }
    toast.success("Sesión cerrada");
    navigate("/login");
  };

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
          {isTrial && (
            <Badge 
              variant="secondary" 
              className="bg-yellow-500/20 text-yellow-200 border-yellow-500/30 hidden sm:flex items-center gap-1 cursor-pointer hover:bg-yellow-500/30"
              onClick={() => navigate("/suscripcion")}
            >
              <Clock className="w-3 h-3" />
              Prueba gratis
              {trialEnd && (
                <span className="text-yellow-300/80 text-xs">
                  · {Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días
                </span>
              )}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/mi-suscripcion")}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <CreditCard className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mi Suscripción</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/metricas")}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Métricas</TooltipContent>
          </Tooltip>
          <ThemeToggle />
          <SettingsDialog 
            branding={branding} 
            onUpdate={onUpdateBranding} 
            onReset={onResetBranding} 
          />
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
