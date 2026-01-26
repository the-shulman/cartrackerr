import { useMetrics } from "@/hooks/useMetrics";
import { MetricsOverview } from "@/components/metrics/MetricsOverview";
import { RevenueChart } from "@/components/metrics/RevenueChart";
import { ServicesPieChart } from "@/components/metrics/ServicesPieChart";
import { DateRangeSelector } from "@/components/metrics/DateRangeSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function Metrics() {
  const navigate = useNavigate();
  const { metrics, loading, error, dateRange, setDateRange, refetch } = useMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="gradient-hero text-primary-foreground py-4 md:py-6 px-4 md:px-6 shadow-elevated">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent rounded-lg">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold">Dashboard de Métricas</h1>
                <p className="text-xs md:text-sm text-primary-foreground/70">
                  Análisis de rendimiento del taller
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            disabled={loading}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Date Range Selector */}
        <div className="flex flex-col gap-4">
          <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-[350px]" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-[350px]" />
              <Skeleton className="h-[350px]" />
            </div>
          </div>
        )}

        {/* Metrics Content */}
        {!loading && metrics && (
          <>
            {/* Overview Cards */}
            <MetricsOverview metrics={metrics} />

            {/* Revenue Chart */}
            <RevenueChart data={metrics.dailyRevenue} />

            {/* Pie Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <ServicesPieChart 
                data={metrics.servicesByStatus} 
                title="Servicios por Estado" 
                dataKey="status"
              />
              <ServicesPieChart 
                data={metrics.servicesByType.map(item => ({ status: item.type, count: item.count }))} 
                title="Servicios por Tipo" 
                dataKey="type"
              />
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && metrics && metrics.totalServices === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin datos para este período</h3>
            <p className="text-muted-foreground">
              No hay servicios registrados en el rango de fechas seleccionado.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
