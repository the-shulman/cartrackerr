import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandingConfig } from "@/types/branding";

interface SettingsDialogProps {
  branding: BrandingConfig;
  onUpdate: (updates: Partial<BrandingConfig>) => void;
  onReset: () => void;
}

export function SettingsDialog({ branding, onUpdate, onReset }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [workshopName, setWorkshopName] = useState(branding.workshopName);
  const [tagline, setTagline] = useState(branding.tagline);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || "");

  const handleSave = () => {
    onUpdate({
      workshopName: workshopName.trim() || "AutoTrack",
      tagline: tagline.trim() || "Workshop Service Manager",
      logoUrl: logoUrl.trim() || undefined,
    });
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
    setWorkshopName("AutoTrack");
    setTagline("Workshop Service Manager");
    setLogoUrl("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setWorkshopName(branding.workshopName);
      setTagline(branding.tagline);
      setLogoUrl(branding.logoUrl || "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marca del Taller</DialogTitle>
          <DialogDescription>
            Personaliza el nombre y marca de tu taller
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="workshopName">Nombre del Taller</Label>
            <Input
              id="workshopName"
              value={workshopName}
              onChange={(e) => setWorkshopName(e.target.value)}
              placeholder="Nombre de tu Taller"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Eslogan</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tu eslogan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL del Logo (opcional)</Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Ingresa la URL de tu logo. Deja vacío para usar el ícono predeterminado.
            </p>
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Restablecer
          </Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
