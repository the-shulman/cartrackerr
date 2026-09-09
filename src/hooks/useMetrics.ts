import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { subDays, format } from "date-fns";

export interface WorkshopMetrics {
  totalServices: number;
  completedServices: number;
  pendingServices: number;
  totalRevenue: number;
  avgServiceTimeHours: number;
  servicesByStatus: { status: string; count: number }[];
  servicesByType: { type: string; count: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function useMetrics() {
  const { user } = useAuthContext();
  const [metrics, setMetrics] = useState<WorkshopMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // First get the workshop ID for the current user
      const { data: workshop, error: workshopError } = await supabase
        .from("workshops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (workshopError) throw workshopError;

      // Call the metrics RPC function
      const { data, error: metricsError } = await supabase.rpc("get_workshop_metrics", {
        p_workshop_id: workshop.id,
        p_start_date: format(dateRange.startDate, "yyyy-MM-dd"),
        p_end_date: format(dateRange.endDate, "yyyy-MM-dd"),
      });

      if (metricsError) throw metricsError;

      // Parse the response — RPC returns snake_case keys
      // and services_by_status/type as objects {key: count}, not arrays
      const raw = data as Record<string, unknown> | null;

      // Convert {status: count} object to [{status, count}] array
      const statusObj = (raw?.services_by_status ?? {}) as Record<string, number>;
      const servicesByStatus = Object.entries(statusObj).map(([status, count]) => ({ status, count }));

      // Convert {type: count} object to [{type, count}] array
      const typeObj = (raw?.services_by_type ?? {}) as Record<string, number>;
      const servicesByType = Object.entries(typeObj).map(([type, count]) => ({ type, count }));

      const dailyRaw = raw?.daily_revenue;
      const dailyRevenue = Array.isArray(dailyRaw) ? dailyRaw as WorkshopMetrics["dailyRevenue"] : [];

      const metricsData: WorkshopMetrics = {
        totalServices: Number(raw?.total_services ?? 0),
        completedServices: Number(raw?.completed_services ?? 0),
        pendingServices: Number(raw?.pending_services ?? 0),
        totalRevenue: Number(raw?.total_revenue ?? 0),
        avgServiceTimeHours: Number(raw?.avg_service_time_hours ?? 0),
        servicesByStatus,
        servicesByType,
        dailyRevenue,
      };
      setMetrics(metricsData);
    } catch (err: unknown) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("Error fetching metrics:", err);
      setError("Error al cargar las métricas");
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    fetchMetrics();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    dateRange,
    setDateRange,
    refetch: fetchMetrics,
  };
}
