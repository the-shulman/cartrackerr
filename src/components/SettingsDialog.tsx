import { useState } from "react";
import { Settings, Phone, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useServicesContext } from "@/contexts/ServicesContext";
import { toast } from "sonner";

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
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const { workshopPhone, refreshWorkshopInfo } = useServicesContext();

  const validatePhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(validatePhone(e.target.value));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("No se encontró el usuario");
        setSaving(false);
        return;
      }

      // Update workshop in database
      const updateData: { workshop_name: string; phone?: string } = {
        workshop_name: workshopName.trim() || "AutoTrack",
      };

      // Only update phone if it's been modified (not empty or different from current)
      if (phone && phone.length === 10) {
        updateData.phone = phone;
      }

      const { error } = await supabase
        .from("workshops")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating workshop:", error);
        toast.error("Error al guardar los cambios");
        setSaving(false);
        return;
      }

      // Update local branding
      onUpdate({
        workshopName: workshopName.trim() || "AutoTrack",
        tagline: tagline.trim() || "Workshop Service Manager",
        logoUrl: logoUrl.trim() || undefined,
      });

      // Refresh workshop info in context
      await refreshWorkshopInfo();

      toast.success("Perfil actualizado correctamente");
      setOpen(false);
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    onReset();
    setWorkshopName("AutoTrack");
    setTagline("Workshop Service Manager");
    setLogoUrl("");
    setPhone("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setWorkshopName(branding.workshopName);
      setTagline(branding.tagline);
      setLogoUrl(branding.logoUrl || "");
      setPhone(workshopPhone || "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil del Taller</DialogTitle>
          <DialogDescription>
            Configura el nombre, teléfono y marca de tu taller
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
            <Label htmlFor="phone">Número de WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="5512345678"
                className="pl-9"
                maxLength={10}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              10 dígitos. Se usará para enviar notificaciones automáticas a tus clientes.
            </p>
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
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Restablecer
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
