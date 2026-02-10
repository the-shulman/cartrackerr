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
  recurringClients: number;
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

      // Parse the response with safe defaults
      const raw = data as Record<string, unknown> | null;
      const metricsData: WorkshopMetrics = {
        totalServices: Number(raw?.totalServices ?? raw?.totalservices ?? 0),
        completedServices: Number(raw?.completedServices ?? raw?.completedservices ?? 0),
        pendingServices: Number(raw?.pendingServices ?? raw?.pendingservices ?? 0),
        totalRevenue: Number(raw?.totalRevenue ?? raw?.totalrevenue ?? 0),
        avgServiceTimeHours: Number(raw?.avgServiceTimeHours ?? raw?.avgservicetimehours ?? 0),
        recurringClients: Number(raw?.recurringClients ?? raw?.recurringclients ?? 0),
        servicesByStatus: Array.isArray(raw?.servicesByStatus ?? raw?.servicesbystatus)
          ? (raw?.servicesByStatus ?? raw?.servicesbystatus) as WorkshopMetrics["servicesByStatus"]
          : [],
        servicesByType: Array.isArray(raw?.servicesByType ?? raw?.servicesbytype)
          ? (raw?.servicesByType ?? raw?.servicesbytype) as WorkshopMetrics["servicesByType"]
          : [],
        dailyRevenue: Array.isArray(raw?.dailyRevenue ?? raw?.dailyrevenue)
          ? (raw?.dailyRevenue ?? raw?.dailyrevenue) as WorkshopMetrics["dailyRevenue"]
          : [],
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
