import { useState } from "react";
import { Service, DiagnosticReport } from "@/types/service";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { StatusProgress } from "./StatusProgress";
import { DiagnosticReportDialog } from "./DiagnosticReportDialog";
import { ClientApprovalDialog } from "./ClientApprovalDialog";
import { DownloadQuoteButton } from "./DownloadQuoteButton";
import { Car, Phone, User, Calendar, Wrench, CheckCircle2, Image, MessageCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildWhatsAppLink, openWhatsAppLink } from "@/lib/whatsapp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ServiceCardProps {
  service: Service;
  onStatusChange: (id: string, status: Service['status']) => void;
  onAddDiagnosticReport: (id: string, report: DiagnosticReport) => void;
  onApproveServices: (id: string, approvedItemIds: string[], clientNotes?: string) => void;
  onDelete: (id: string) => void;
}

export function ServiceCard({ service, onStatusChange, onAddDiagnosticReport, onApproveServices, onDelete }: ServiceCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const vehicleInfo = `${service.vehicleBrand} ${service.vehicleModel} (${service.vehiclePlate})`;
  
  const approvedTotal = service.diagnosticReport?.items
    .filter(item => item.approved)
    .reduce((sum, item) => sum + item.price, 0) ?? 0;

  const canAdvanceStatus = () => {
    if (service.status === 'diagnosing') return false; // Must add report first
    if (service.status === 'awaiting_approval') return false; // Must approve first
    return service.status !== 'delivered';
  };

  const getNextStatus = () => {
    const statusFlow = ['received', 'diagnosing', 'awaiting_approval', 'in_progress', 'ready', 'delivered'];
    const currentIndex = statusFlow.indexOf(service.status);
    return statusFlow[currentIndex + 1] as Service['status'];
  };

  const handleOpenWhatsApp = () => {
    const portalUrl = `${window.location.origin}/track`;
    // Note: plain-text markers instead of emoji on purpose — WhatsApp's own
    // wa.me -> api.whatsapp.com redirect has been observed corrupting multi-byte
    // emoji into replacement characters ("�") for some recipients. Plain text
    // is guaranteed to survive that hop.
    const message = `¡Hola ${service.clientName}!

Te contactamos respecto a tu vehículo ${service.vehicleBrand} ${service.vehicleModel} (${service.vehiclePlate}).

Puedes consultar el estado de tu servicio en:
${portalUrl}

Ingresa con:
- Teléfono: ${service.clientPhone}
- Placa: ${service.vehiclePlate}`;

    const link = buildWhatsAppLink(service.clientPhone, message);
    openWhatsAppLink(link);
  };

  return (
    <Card className="gradient-card shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up overflow-hidden touch-manipulation">
      <CardHeader className="pb-3 px-4 md:px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-accent flex-shrink-0" />
              <h3
                className="font-semibold text-base md:text-lg line-clamp-2 break-words"
                title={`${service.vehicleBrand} ${service.vehicleModel}`}
              >
                {service.vehicleBrand} {service.vehicleModel}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {service.vehiclePlate} • {service.vehicleYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={service.status} />
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará el servicio de {service.vehicleBrand} {service.vehicleModel} ({service.vehiclePlate}) para {service.clientName}. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(service.id)}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{service.clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{service.clientPhone}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-status-ready hover:text-status-ready/80"
                    onClick={handleOpenWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Abrir WhatsApp (manual)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-muted-foreground" />
            <span>{service.serviceType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{format(service.createdAt, 'MMM d, yyyy')}</span>
          </div>
        </div>

        {service.description && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {service.description}
          </p>
        )}

        {/* Show diagnostic images */}
        {service.diagnosticReport?.images && service.diagnosticReport.images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Image className="w-4 h-4" />
              <span>Fotografías del Diagnóstico ({service.diagnosticReport.images.length})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {service.diagnosticReport.images.slice(0, 3).map((img, idx) => (
                <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                  <img
                    src={img}
                    alt={`Diagnóstico ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
            {service.diagnosticReport.images.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{service.diagnosticReport.images.length - 3} más
              </p>
            )}
          </div>
        )}

        {/* Show approved services summary */}
        {service.diagnosticReport?.approvedAt && (
          <div className="bg-status-ready/10 border border-status-ready/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-ready" />
              <span className="font-medium text-sm">Servicios Aprobados</span>
            </div>
            <div className="text-sm space-y-1">
              {service.diagnosticReport.items
                .filter(item => item.approved)
                .map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.description}</span>
                    <span className="font-medium">${item.price.toLocaleString('es-MX')} MXN</span>
                  </div>
                ))}
              <div className="flex justify-between pt-2 border-t border-status-ready/30 font-semibold">
                <span>Total</span>
                <span className="flex items-center gap-1">
                  ${approvedTotal.toLocaleString('es-MX')} MXN
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-status-ready/30">
              <DownloadQuoteButton service={service} variant="ghost" size="sm" className="w-full" />
            </div>
          </div>
        )}

        {service.status !== 'delivered' && (
          <div className="pt-4 border-t">
            <StatusProgress currentStatus={service.status} />
          </div>
        )}

        {service.status !== 'delivered' && (
          <div className="flex gap-2 pt-2 flex-wrap">
            {/* Show diagnostic report button when diagnosing */}
            {service.status === 'diagnosing' && (
              <DiagnosticReportDialog
                serviceId={service.id}
                service={service}
                onSubmit={onAddDiagnosticReport}
              />
            )}

            {/* Show approval button when awaiting approval */}
            {service.status === 'awaiting_approval' && service.diagnosticReport && (
              <ClientApprovalDialog
                serviceId={service.id}
                vehicleInfo={vehicleInfo}
                report={service.diagnosticReport}
                onApprove={onApproveServices}
              />
            )}

            {/* Show advance status button for other states */}
            {canAdvanceStatus() && (
              <button
                onClick={() => onStatusChange(service.id, getNextStatus())}
                className="flex-1 py-3 px-4 text-sm font-medium rounded-lg gradient-accent text-accent-foreground hover:opacity-90 active:scale-[0.98] transition-all min-h-[44px] touch-manipulation"
              >
                Avanzar Estado
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
