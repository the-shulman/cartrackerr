import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { Service } from "@/types/service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBranding } from "@/hooks/useBranding";

interface DownloadQuoteButtonProps {
  service: Service;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DownloadQuoteButton({ 
  service, 
  variant = "outline", 
  size = "sm",
  className 
}: DownloadQuoteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { branding } = useBranding();

  const handleDownload = async () => {
    if (!service.diagnosticReport) {
      toast.error("No hay reporte de diagnóstico disponible");
      return;
    }

    setLoading(true);
    try {
      const portalUrl = `${window.location.origin}/track`;
      
      const { data, error } = await supabase.functions.invoke('generate-pdf-quote', {
        body: {
          workshopName: branding.workshopName,
          workshopPhone: undefined,
          clientName: service.clientName,
          clientPhone: service.clientPhone,
          vehicleBrand: service.vehicleBrand,
          vehicleModel: service.vehicleModel,
          vehiclePlate: service.vehiclePlate,
          vehicleYear: service.vehicleYear,
          serviceType: service.serviceType,
          findings: service.diagnosticReport.findings,
          items: service.diagnosticReport.items,
          createdAt: service.diagnosticReport.createdAt.toISOString(),
          portalUrl,
        },
      });

      if (error) throw error;

      // Open in new window for printing/saving as PDF
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(data);
        newWindow.document.close();
        toast.success("Presupuesto generado", {
          description: "Usa Ctrl+P o Cmd+P para guardar como PDF",
        });
      } else {
        // Fallback: download as HTML
        const blob = new Blob([data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `presupuesto-${service.vehiclePlate}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Presupuesto descargado");
      }
    } catch (error: any) {
      console.error('Error generating quote:', error);
      toast.error("Error al generar presupuesto", {
        description: error.message || "Intenta de nuevo",
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show if there's a diagnostic report
  if (!service.diagnosticReport) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Presupuesto
    </Button>
  );
}
