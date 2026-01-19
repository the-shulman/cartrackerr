import { useState } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiagnosticItem, DiagnosticReport } from "@/types/service";

interface DiagnosticReportDialogProps {
  serviceId: string;
  vehicleInfo: string;
  onSubmit: (serviceId: string, report: DiagnosticReport) => void;
}

export function DiagnosticReportDialog({ serviceId, vehicleInfo, onSubmit }: DiagnosticReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [findings, setFindings] = useState("");
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [newItem, setNewItem] = useState({ description: "", price: "", priority: "recommended" as DiagnosticItem['priority'] });

  const addItem = () => {
    if (newItem.description.trim() && newItem.price) {
      setItems([
        ...items,
        {
          id: crypto.randomUUID(),
          description: newItem.description.trim(),
          price: parseFloat(newItem.price),
          approved: false,
          priority: newItem.priority,
        },
      ]);
      setNewItem({ description: "", price: "", priority: "recommended" });
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    if (findings.trim() && items.length > 0) {
      onSubmit(serviceId, {
        findings: findings.trim(),
        items,
        createdAt: new Date(),
      });
      setOpen(false);
      setFindings("");
      setItems([]);
    }
  };

  const totalEstimate = items.reduce((sum, item) => sum + item.price, 0);

  const priorityLabels = {
    required: "Required",
    recommended: "Recommended",
    optional: "Optional",
  };

  const priorityColors = {
    required: "text-destructive",
    recommended: "text-accent",
    optional: "text-muted-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-2">
          <ClipboardList className="w-4 h-4" />
          Add Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diagnostic Report</DialogTitle>
          <DialogDescription>
            Add diagnostic findings and service items for {vehicleInfo}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="findings">Diagnostic Findings</Label>
            <Textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Describe what was found during diagnosis..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <Label>Service Items & Pricing</Label>
            
            {/* Add new item */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Input
                placeholder="Service description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                className="w-24"
              />
              <Select
                value={newItem.priority}
                onValueChange={(value) => setNewItem({ ...newItem, priority: value as DiagnosticItem['priority'] })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={addItem} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Items list */}
            {items.length > 0 && (
              <div className="space-y-2 border rounded-lg p-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className={`text-sm ${priorityColors[item.priority]}`}>
                        {priorityLabels[item.priority]}
                      </p>
                    </div>
                    <p className="font-semibold">${item.price.toFixed(2)}</p>
                    <Button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-between pt-4 font-semibold text-lg">
                  <span>Total Estimate:</span>
                  <span>${totalEstimate.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!findings.trim() || items.length === 0}
          >
            Send for Approval
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
