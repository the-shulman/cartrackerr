import { Service, DiagnosticReport } from "@/types/service";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { StatusProgress } from "./StatusProgress";
import { DiagnosticReportDialog } from "./DiagnosticReportDialog";
import { ClientApprovalDialog } from "./ClientApprovalDialog";
import { Car, Phone, User, Calendar, Wrench, DollarSign, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface ServiceCardProps {
  service: Service;
  onStatusChange: (id: string, status: Service['status']) => void;
  onAddDiagnosticReport: (id: string, report: DiagnosticReport) => void;
  onApproveServices: (id: string, approvedItemIds: string[], clientNotes?: string) => void;
}

export function ServiceCard({ service, onStatusChange, onAddDiagnosticReport, onApproveServices }: ServiceCardProps) {
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

  return (
    <Card className="gradient-card shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-lg">
                {service.vehicleBrand} {service.vehicleModel}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {service.vehiclePlate} • {service.vehicleYear}
            </p>
          </div>
          <StatusBadge status={service.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{service.clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{service.clientPhone}</span>
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
                    <span className="font-medium">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              <div className="flex justify-between pt-2 border-t border-status-ready/30 font-semibold">
                <span>Total</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {approvedTotal.toFixed(2)}
                </span>
              </div>
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
                className="flex-1 py-2 px-4 text-sm font-medium rounded-lg gradient-accent text-accent-foreground hover:opacity-90 transition-opacity"
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
