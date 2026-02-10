import { useState } from "react";
import { CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DiagnosticReport } from "@/types/service";
import { format } from "date-fns";

interface ClientApprovalDialogProps {
  serviceId: string;
  vehicleInfo: string;
  report: DiagnosticReport;
  onApprove: (serviceId: string, approvedItemIds: string[], clientNotes?: string) => void;
}

export function ClientApprovalDialog({ serviceId, vehicleInfo, report, onApprove }: ClientApprovalDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(report.items.filter(item => item.priority === 'required').map(item => item.id))
  );
  const [clientNotes, setClientNotes] = useState("");

  const toggleItem = (id: string, priority: string) => {
    if (priority === 'required') return; // Required items cannot be deselected
    
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleApprove = () => {
    if (selectedItems.size > 0) {
      onApprove(serviceId, Array.from(selectedItems), clientNotes.trim() || undefined);
      setOpen(false);
    }
  };

  const selectedTotal = report.items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const priorityLabels = {
    required: "Requerido",
    recommended: "Recomendado",
    optional: "Opcional",
  };

  const priorityColors = {
    required: "text-destructive",
    recommended: "text-accent",
    optional: "text-muted-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 gradient-accent text-accent-foreground">
          <FileText className="w-4 h-4" />
          Ver Reporte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reporte de Diagnóstico</DialogTitle>
          <DialogDescription>
            Revisar hallazgos y seleccionar servicios para {vehicleInfo}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {report.createdAt ? `Reporte creado: ${format(new Date(report.createdAt), 'dd/MM/yyyy h:mm a')}` : 'Reporte de diagnóstico'}
            </p>
            <h4 className="font-medium mb-2">Hallazgos:</h4>
            <p className="text-sm">{report.findings}</p>
          </div>

          <div className="space-y-4">
            <Label>Seleccionar Servicios a Aprobar</Label>
            <div className="space-y-2 border rounded-lg p-4">
              {report.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-3 border-b last:border-0">
                  <Checkbox
                    id={item.id}
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id, item.priority)}
                    disabled={item.priority === 'required'}
                  />
                  <div className="flex-1">
                    <Label htmlFor={item.id} className="font-medium cursor-pointer">
                      {item.description}
                    </Label>
                    <p className={`text-sm ${priorityColors[item.priority]}`}>
                      {priorityLabels[item.priority]}
                      {item.priority === 'required' && ' - No se puede deseleccionar'}
                    </p>
                  </div>
                  <p className="font-semibold">${item.price.toLocaleString('es-MX')} MXN</p>
                </div>
              ))}
              <div className="flex justify-between pt-4 font-semibold text-lg border-t">
                <span>Total Seleccionado:</span>
                <span>${selectedTotal.toLocaleString('es-MX')} MXN</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientNotes">Notas Adicionales (Opcional)</Label>
            <Textarea
              id="clientNotes"
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Comentarios o solicitudes adicionales..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={selectedItems.size === 0}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Aprobar Selección (${selectedTotal.toLocaleString('es-MX')} MXN)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
