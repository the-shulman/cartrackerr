import { useState, useEffect } from "react";
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

  const fetchMetrics = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

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

      // Parse the response
      const metricsData = data as unknown as WorkshopMetrics;
      setMetrics(metricsData);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Error al cargar las métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user, dateRange]);

  return {
    metrics,
    loading,
    error,
    dateRange,
    setDateRange,
    refetch: fetchMetrics,
  };
}
