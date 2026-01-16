import { useState } from "react";
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
  "Oil Change",
  "Brake Service",
  "Engine Repair",
  "Transmission",
  "Electrical",
  "AC/Heating",
  "Tire Service",
  "General Inspection",
  "Bodywork",
  "Other",
];

export function AddServiceDialog({ onAdd }: AddServiceDialogProps) {
  const [open, setOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
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
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-accent text-accent-foreground hover:opacity-90 shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          New Service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] gradient-card">
        <DialogHeader>
          <DialogTitle className="text-xl">Register New Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Phone</Label>
              <Input
                id="clientPhone"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                required
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleBrand">Brand</Label>
              <Input
                id="vehicleBrand"
                value={formData.vehicleBrand}
                onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                required
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Model</Label>
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
              <Label htmlFor="vehiclePlate">License Plate</Label>
              <Input
                id="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                required
                placeholder="ABC-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleYear">Year</Label>
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
            <Label htmlFor="serviceType">Service Type</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
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
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about the service..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-accent text-accent-foreground">
              Register Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
