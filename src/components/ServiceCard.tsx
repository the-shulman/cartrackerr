import { Service } from "@/types/service";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { StatusProgress } from "./StatusProgress";
import { Car, Phone, User, Calendar, Wrench } from "lucide-react";
import { format } from "date-fns";

interface ServiceCardProps {
  service: Service;
  onStatusChange: (id: string, status: Service['status']) => void;
}

export function ServiceCard({ service, onStatusChange }: ServiceCardProps) {
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

        {service.status !== 'delivered' && (
          <div className="pt-4 border-t">
            <StatusProgress currentStatus={service.status} />
          </div>
        )}

        {service.status !== 'delivered' && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                const statusIndex = ['received', 'diagnosing', 'in_progress', 'ready', 'delivered'].indexOf(service.status);
                const nextStatus = ['received', 'diagnosing', 'in_progress', 'ready', 'delivered'][statusIndex + 1] as Service['status'];
                if (nextStatus) onStatusChange(service.id, nextStatus);
              }}
              className="flex-1 py-2 px-4 text-sm font-medium rounded-lg gradient-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              Advance Status
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
