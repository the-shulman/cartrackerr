import { useState, useRef } from "react";
import { ClipboardList, Plus, Trash2, Send, Loader2, ImagePlus, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DiagnosticItem, DiagnosticReport, Service } from "@/types/service";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiagnosticReportDialogProps {
  serviceId: string;
  service: Service;
  onSubmit: (serviceId: string, report: DiagnosticReport) => void;
}

export function DiagnosticReportDialog({ serviceId, service, onSubmit }: DiagnosticReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [findings, setFindings] = useState("");
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [newItem, setNewItem] = useState({ description: "", price: "", priority: "recommended" as DiagnosticItem['priority'] });
  const [sendNotification, setSendNotification] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const vehicleInfo = `${service.vehicleBrand} ${service.vehicleModel} (${service.vehiclePlate})`;

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast({
        title: "Límite de imágenes",
        description: "Máximo 10 imágenes por reporte",
        variant: "destructive",
      });
      return;
    }
    
    const newImages = [...images, ...files];
    setImages(newImages);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${serviceId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('diagnostic-images')
          .upload(fileName, image);
        
        if (uploadError) throw uploadError;
        
        // Use signed URLs instead of public URLs for better security
        // Signed URLs expire after 24 hours (86400 seconds)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('diagnostic-images')
          .createSignedUrl(fileName, 86400);
        
        if (signedUrlError) throw signedUrlError;
        
        uploadedUrls.push(signedUrlData.signedUrl);
      }
      
      return uploadedUrls;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const sendSmsNotification = async () => {
    const portalUrl = `${window.location.origin}/track`;
    
    const { data, error } = await supabase.functions.invoke('send-sms-notification', {
      body: {
        clientName: service.clientName,
        clientPhone: service.clientPhone,
        portalUrl,
      },
    });

    if (error) {
      console.error("SMS notification error:", error);
      throw error;
    }

    return data;
  };

  const handleSubmit = async () => {
    if (findings.trim() && items.length > 0) {
      setIsSending(true);
      
      try {
        // Upload images first
        const uploadedImageUrls = await uploadImages();
        
        // Submit the report with images
        onSubmit(serviceId, {
          findings: findings.trim(),
          items,
          images: uploadedImageUrls,
          createdAt: new Date(),
        });

        // Send SMS notification if enabled
        if (sendNotification) {
          await sendSmsNotification();
          toast({
            title: "¡Notificación enviada!",
            description: `SMS enviado a ${service.clientName}`,
          });
        }

        setOpen(false);
        resetForm();
      } catch (error: any) {
        console.error("Error:", error);
        toast({
          title: "Reporte guardado",
          description: sendNotification 
            ? "El reporte se guardó pero falló la notificación de WhatsApp. El cliente puede acceder al portal." 
            : "Reporte diagnóstico enviado para aprobación.",
          variant: sendNotification ? "destructive" : "default",
        });
        setOpen(false);
        resetForm();
      } finally {
        setIsSending(false);
      }
    }
  };

  const resetForm = () => {
    setFindings("");
    setItems([]);
    setImages([]);
    setImagePreviews([]);
  };

  const totalEstimate = items.reduce((sum, item) => sum + item.price, 0);

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
        <Button size="sm" variant="secondary" className="gap-2">
          <ClipboardList className="w-4 h-4" />
          Agregar Reporte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reporte de Diagnóstico</DialogTitle>
          <DialogDescription>
            Agregar hallazgos y servicios para {vehicleInfo}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="findings">Hallazgos del Diagnóstico</Label>
            <Textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Describe lo que se encontró durante el diagnóstico..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <Label>Servicios y Precios</Label>
            
            {/* Add new item */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Input
                placeholder="Descripción del servicio"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Precio"
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
                  <SelectItem value="required">Requerido</SelectItem>
                  <SelectItem value="recommended">Recomendado</SelectItem>
                  <SelectItem value="optional">Opcional</SelectItem>
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
                    <p className="font-semibold">${item.price.toLocaleString('es-MX')} MXN</p>
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
                  <span>Estimado Total:</span>
                  <span>${totalEstimate.toLocaleString('es-MX')} MXN</span>
                </div>
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>Fotografías del Diagnóstico</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2"
              disabled={images.length >= 10}
            >
              <ImagePlus className="w-4 h-4" />
              Agregar Imágenes ({images.length}/10)
            </Button>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp notification option */}
          <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50 border">
            <Checkbox
              id="send-notification"
              checked={sendNotification}
              onCheckedChange={(checked) => setSendNotification(checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="send-notification" className="cursor-pointer font-medium flex items-center gap-2">
                <Send className="w-4 h-4 text-status-ready" />
                Enviar notificación por WhatsApp
              </Label>
              <p className="text-sm text-muted-foreground">
                Notificar a {service.clientName} por WhatsApp con un enlace para aprobar los servicios
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!findings.trim() || items.length === 0 || isSending || isUploadingImages}
          >
            {isSending || isUploadingImages ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isUploadingImages ? "Subiendo imágenes..." : "Enviando..."}
              </>
            ) : (
              <>
                {sendNotification && <Send className="w-4 h-4 mr-2" />}
                Enviar para Aprobación
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
