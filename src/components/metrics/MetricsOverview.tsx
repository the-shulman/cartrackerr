import { Card, CardContent } from "@/components/ui/card";
import { 
  Wrench, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Timer, 
  Users 
} from "lucide-react";
import { WorkshopMetrics } from "@/hooks/useMetrics";

interface MetricsOverviewProps {
  metrics: WorkshopMetrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const cards = [
    {
      title: "Total Servicios",
      value: metrics.totalServices,
      icon: Wrench,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Completados",
      value: metrics.completedServices,
      icon: CheckCircle,
      color: "text-status-ready",
      bgColor: "bg-status-ready/10",
    },
    {
      title: "Pendientes",
      value: metrics.pendingServices,
      icon: Clock,
      color: "text-status-progress",
      bgColor: "bg-status-progress/10",
    },
    {
      title: "Ingresos Totales",
      value: `$${metrics.totalRevenue.toLocaleString("es-MX")}`,
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
      isLarge: true,
    },
    {
      title: "Tiempo Promedio",
      value: `${metrics.avgServiceTimeHours}h`,
      icon: Timer,
      color: "text-status-diagnosing",
      bgColor: "bg-status-diagnosing/10",
    },
    {
      title: "Clientes Recurrentes",
      value: metrics.recurringClients,
      icon: Users,
      color: "text-status-awaiting",
      bgColor: "bg-status-awaiting/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                <p className={`font-bold ${card.isLarge ? 'text-lg' : 'text-xl'} truncate`}>
                  {card.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
