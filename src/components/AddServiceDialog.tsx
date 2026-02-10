import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Service } from "@/types/service";

interface AddServiceDialogProps {
  onAdd: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
}

const SERVICE_TYPES = [
  "Cambio de Aceite",
  "Servicio de Frenos",
  "Reparación de Motor",
  "Transmisión",
  "Eléctrico",
  "Aire Acondicionado/Calefacción",
  "Servicio de Llantas",
  "Inspección General",
  "Carrocería",
  "Otro",
];

export function AddServiceDialog({ onAdd }: AddServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleYear: "",
    serviceType: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAdd(formData);
      setSubmitted(true);
      // Show success state for 1.5 seconds before closing
      setTimeout(() => {
        setFormData({
          clientName: "",
          clientPhone: "",
          vehicleBrand: "",
          vehicleModel: "",
          vehiclePlate: "",
          vehicleYear: "",
          serviceType: "",
          description: "",
        });
        setSubmitted(false);
        setSubmitting(false);
        setOpen(false);
      }, 1500);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-accent text-accent-foreground hover:opacity-90 shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] gradient-card">
        <DialogHeader>
          <DialogTitle className="text-xl">Registrar Nuevo Servicio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nombre del Cliente</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Teléfono (10 dígitos)</Label>
              <Input
                id="clientPhone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={formData.clientPhone}
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, clientPhone: value });
                }}
                required
                pattern="[0-9]{10}"
                placeholder="5512345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleBrand">Marca</Label>
              <Input
                id="vehicleBrand"
                value={formData.vehicleBrand}
                onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                required
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Modelo</Label>
              <Input
                id="vehicleModel"
                value={formData.vehicleModel}
                onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                required
                placeholder="Camry"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Placas</Label>
              <Input
                id="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                required
                placeholder="ABC-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleYear">Año</Label>
              <Input
                id="vehicleYear"
                value={formData.vehicleYear}
                onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                required
                placeholder="2022"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Tipo de Servicio</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles adicionales del servicio..."
              rows={3}
            />
          </div>

          {submitted ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle className="h-10 w-10 text-status-ready animate-in zoom-in" />
              <p className="text-sm font-medium text-status-ready">¡Servicio registrado!</p>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-accent text-accent-foreground" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submitting ? "Registrando..." : "Registrar Servicio"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
