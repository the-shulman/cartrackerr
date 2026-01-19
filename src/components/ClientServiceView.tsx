import { useState } from 'react';
import { Service, STATUS_LABELS } from '@/types/service';
import { StatusProgress } from '@/components/StatusProgress';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Car, Calendar, FileText, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface ClientServiceViewProps {
  service: Service;
  onApprove: (serviceId: string, approvedItemIds: string[], clientNotes?: string) => void;
  onBack: () => void;
}

export function ClientServiceView({ service, onApprove, onBack }: ClientServiceViewProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(
    service.diagnosticReport?.items
      .filter(item => item.priority === 'required' || item.approved)
      .map(item => item.id) || []
  );
  const [clientNotes, setClientNotes] = useState(service.diagnosticReport?.clientNotes || '');

  const report = service.diagnosticReport;
  const isAwaitingApproval = service.status === 'awaiting_approval';
  const hasApprovedReport = report?.approvedAt;

  const toggleItem = (itemId: string) => {
    const item = report?.items.find(i => i.id === itemId);
    if (item?.priority === 'required') return;
    
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleApprove = () => {
    onApprove(service.id, selectedItems, clientNotes || undefined);
  };

  const selectedTotal = report?.items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0) || 0;

  const priorityStyles = {
    required: 'bg-destructive/10 text-destructive border-destructive/20',
    recommended: 'bg-status-awaiting/10 text-status-awaiting border-status-awaiting/20',
    optional: 'bg-muted text-muted-foreground border-muted',
  };

  const priorityLabels = {
    required: 'requerido',
    recommended: 'recomendado',
    optional: 'opcional',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 pb-6">
      <Button variant="ghost" onClick={onBack} className="mb-2 md:mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Buscar
      </Button>

      {/* Vehicle Info Card */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Car className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base md:text-lg truncate">{service.vehicleBrand} {service.vehicleModel}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1 text-sm">
                  <span className="font-mono font-semibold">{service.vehiclePlate}</span>
                  <span className="text-muted-foreground">• {service.vehicleYear}</span>
                </CardDescription>
              </div>
            </div>
            <StatusBadge status={service.status} />
          </div>
        </CardHeader>
        <CardContent>
          <StatusProgress currentStatus={service.status} />
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Detalles del Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo de Servicio</span>
              <p className="font-medium">{service.serviceType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Recibido</span>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(service.createdAt, 'PPp')}
              </p>
            </div>
          </div>
          {service.description && (
            <div>
              <span className="text-muted-foreground text-sm">Descripción</span>
              <p className="text-sm mt-1">{service.description}</p>
            </div>
          )}
          {service.estimatedCompletion && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Entrega estimada: <strong>{format(service.estimatedCompletion, 'PPp')}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Report */}
      {report && (
        <Card className={isAwaitingApproval ? 'ring-2 ring-status-awaiting' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Reporte de Diagnóstico
              </CardTitle>
              {hasApprovedReport && (
                <Badge variant="default" className="bg-status-ready">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprobado
                </Badge>
              )}
            </div>
            {isAwaitingApproval && (
              <CardDescription className="text-status-awaiting font-medium">
                Por favor revisa y aprueba los servicios a continuación
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Findings */}
            <div>
              <h4 className="font-medium mb-2">Hallazgos</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                {report.findings}
              </p>
            </div>

            <Separator />

            {/* Service Items */}
            <div>
              <h4 className="font-medium mb-3">Servicios Recomendados</h4>
              <div className="space-y-3">
                {report.items.map(item => {
                  const isSelected = selectedItems.includes(item.id);
                  const isRequired = item.priority === 'required';
                  const isDisabled = !isAwaitingApproval || isRequired;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
                      }`}
                    >
                      <Checkbox
                        id={item.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleItem(item.id)}
                        disabled={isDisabled}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor={item.id}
                            className={`font-medium text-sm ${isDisabled ? '' : 'cursor-pointer'}`}
                          >
                            {item.description}
                          </label>
                          <Badge variant="outline" className={priorityStyles[item.priority]}>
                            {item.priority}
                          </Badge>
                        </div>
                      </div>
                      <span className="font-semibold text-sm whitespace-nowrap">
                        ${item.price.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <span className="font-medium">Total Seleccionado</span>
              <span className="text-2xl font-bold text-primary">
                ${selectedTotal.toLocaleString('es-MX')} MXN
              </span>
            </div>

            {/* Client Notes */}
            {isAwaitingApproval && (
              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Solicitudes especiales o comentarios..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {hasApprovedReport && report.clientNotes && (
              <div>
                <h4 className="font-medium mb-2">Tus Notas</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {report.clientNotes}
                </p>
              </div>
            )}

            {/* Approve Button */}
            {isAwaitingApproval && (
              <Button 
                onClick={handleApprove} 
                className="w-full" 
                size="lg"
                disabled={selectedItems.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprobar Servicios Seleccionados (${selectedTotal.toLocaleString('es-MX')} MXN)
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Report Yet */}
      {!report && service.status === 'received' && (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Vehículo Recibido</h3>
            <p className="text-muted-foreground">
              Tu vehículo ha sido recibido. Comenzaremos el diagnóstico pronto.
            </p>
          </CardContent>
        </Card>
      )}

      {!report && service.status === 'diagnosing' && (
        <Card>
          <CardContent className="py-8 text-center">
            <Wrench className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
            <h3 className="font-medium text-lg mb-2">Diagnóstico en Progreso</h3>
            <p className="text-muted-foreground">
              Nuestros técnicos están diagnosticando tu vehículo. Recibirás un reporte detallado pronto.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
