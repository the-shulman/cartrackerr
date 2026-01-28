import { Download, X, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { useState, useEffect, forwardRef } from "react";

export const InstallPrompt = forwardRef<HTMLDivElement>((_, ref) => {
  const { isInstallable, isOnline, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineToast(true);
      const timer = setTimeout(() => setShowOfflineToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setDismissed(true);
    }
  };

  if (dismissed || !isInstallable) return null;

  return (
    <>
      {/* Offline indicator */}
      {showOfflineToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Sin conexión</span>
        </div>
      )}

      {/* Install banner */}
      <div ref={ref} className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <div className="bg-card border border-border rounded-xl shadow-elevated p-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">
                Instalar AutoTrack
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Accede más rápido desde tu pantalla de inicio
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDismissed(true)}
            >
              Ahora no
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleInstall}
            >
              Instalar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});

InstallPrompt.displayName = "InstallPrompt";

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-accent-foreground px-4 py-1.5 text-center">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4" />
        <span>Modo sin conexión - Algunas funciones pueden no estar disponibles</span>
      </div>
    </div>
  );
}
