import { Service } from '@/types/service';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Calendar, ChevronRight, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ServiceHistoryListProps {
  services: Service[];
  activeServiceId?: string;
  onSelectService: (service: Service) => void;
  onBack: () => void;
}

export function ServiceHistoryList({ 
  services, 
  activeServiceId,
  onSelectService, 
  onBack 
}: ServiceHistoryListProps) {
  const activeServices = services.filter(s => s.status !== 'delivered');
  const completedServices = services.filter(s => s.status === 'delivered');

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Historial de Servicios</h2>
        </div>
        <Button variant="outline" onClick={onBack}>
          Nueva Búsqueda
        </Button>
      </div>

      {/* Active Services */}
      {activeServices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Servicios Activos ({activeServices.length})
          </h3>
          {activeServices.map(service => (
            <ServiceHistoryCard
              key={service.id}
              service={service}
              isActive={service.id === activeServiceId}
              onSelect={() => onSelectService(service)}
            />
          ))}
        </div>
      )}

      {/* Completed Services */}
      {completedServices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Servicios Completados ({completedServices.length})
          </h3>
          {completedServices.map(service => (
            <ServiceHistoryCard
              key={service.id}
              service={service}
              isActive={service.id === activeServiceId}
              onSelect={() => onSelectService(service)}
            />
          ))}
        </div>
      )}

      {services.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Sin Historial</h3>
            <p className="text-muted-foreground">
              No se encontraron servicios anteriores para este vehículo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ServiceHistoryCardProps {
  service: Service;
  isActive: boolean;
  onSelect: () => void;
}

function ServiceHistoryCard({ service, isActive, onSelect }: ServiceHistoryCardProps) {
  const totalAmount = service.diagnosticReport?.items
    ?.filter(item => item.approved)
    ?.reduce((sum, item) => sum + item.price, 0) || 0;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">
                  {service.serviceType}
                </span>
                <StatusBadge status={service.status} size="sm" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{format(service.createdAt, "d 'de' MMM yyyy", { locale: es })}</span>
                {totalAmount > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-foreground">
                      ${totalAmount.toLocaleString('es-MX')} MXN
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
