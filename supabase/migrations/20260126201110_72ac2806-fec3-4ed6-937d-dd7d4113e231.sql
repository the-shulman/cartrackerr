-- RPC function to get workshop metrics for dashboard
CREATE OR REPLACE FUNCTION public.get_workshop_metrics(
  p_workshop_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  v_total_services INTEGER;
  v_completed_services INTEGER;
  v_pending_services INTEGER;
  v_total_revenue NUMERIC;
  v_avg_service_time_hours NUMERIC;
  v_recurring_clients INTEGER;
  v_services_by_status JSONB;
  v_services_by_type JSONB;
  v_daily_revenue JSONB;
BEGIN
  -- Total services in date range
  SELECT COUNT(*) INTO v_total_services
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Completed services (delivered)
  SELECT COUNT(*) INTO v_completed_services
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND status = 'delivered'
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Pending services (not delivered)
  SELECT COUNT(*) INTO v_pending_services
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND status != 'delivered'
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Total revenue from approved items in diagnostic reports
  SELECT COALESCE(SUM(
    (SELECT COALESCE(SUM((item->>'price')::numeric), 0)
     FROM jsonb_array_elements(s.diagnostic_report->'items') AS item
     WHERE (item->>'approved')::boolean = true)
  ), 0) INTO v_total_revenue
  FROM public.services s
  WHERE s.workshop_id = p_workshop_id
    AND s.diagnostic_report IS NOT NULL
    AND s.created_at::date BETWEEN p_start_date AND p_end_date;

  -- Average service time (from created to delivered) in hours
  SELECT COALESCE(AVG(
    EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600
  ), 0) INTO v_avg_service_time_hours
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND status = 'delivered'
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Recurring clients (clients with more than 1 service)
  SELECT COUNT(*) INTO v_recurring_clients
  FROM (
    SELECT client_phone
    FROM public.services
    WHERE workshop_id = p_workshop_id
    GROUP BY client_phone
    HAVING COUNT(*) > 1
  ) AS recurring;

  -- Services grouped by status
  SELECT jsonb_agg(jsonb_build_object('status', status, 'count', cnt))
  INTO v_services_by_status
  FROM (
    SELECT status, COUNT(*) as cnt
    FROM public.services
    WHERE workshop_id = p_workshop_id
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY status
  ) AS status_counts;

  -- Services grouped by type
  SELECT jsonb_agg(jsonb_build_object('type', service_type, 'count', cnt))
  INTO v_services_by_type
  FROM (
    SELECT service_type, COUNT(*) as cnt
    FROM public.services
    WHERE workshop_id = p_workshop_id
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY service_type
    ORDER BY cnt DESC
    LIMIT 10
  ) AS type_counts;

  -- Daily revenue for chart
  SELECT jsonb_agg(jsonb_build_object('date', day, 'revenue', daily_total) ORDER BY day)
  INTO v_daily_revenue
  FROM (
    SELECT 
      created_at::date as day,
      COALESCE(SUM(
        (SELECT COALESCE(SUM((item->>'price')::numeric), 0)
         FROM jsonb_array_elements(s.diagnostic_report->'items') AS item
         WHERE (item->>'approved')::boolean = true)
      ), 0) as daily_total
    FROM public.services s
    WHERE s.workshop_id = p_workshop_id
      AND s.diagnostic_report IS NOT NULL
      AND s.created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY created_at::date
  ) AS daily;

  -- Build final result
  result := jsonb_build_object(
    'totalServices', v_total_services,
    'completedServices', v_completed_services,
    'pendingServices', v_pending_services,
    'totalRevenue', v_total_revenue,
    'avgServiceTimeHours', ROUND(v_avg_service_time_hours::numeric, 1),
    'recurringClients', v_recurring_clients,
    'servicesByStatus', COALESCE(v_services_by_status, '[]'::jsonb),
    'servicesByType', COALESCE(v_services_by_type, '[]'::jsonb),
    'dailyRevenue', COALESCE(v_daily_revenue, '[]'::jsonb)
  );

  RETURN result;
END;
$function$;