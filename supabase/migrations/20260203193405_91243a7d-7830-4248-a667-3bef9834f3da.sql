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
  v_user_id uuid;
  v_total_services integer;
  v_completed_services integer;
  v_pending_services integer;
  v_total_revenue numeric;
  v_avg_service_time interval;
  v_services_by_type jsonb;
  v_services_by_status jsonb;
  v_daily_revenue jsonb;
  result jsonb;
BEGIN
  -- CRITICAL: Verify caller owns the workshop
  SELECT user_id INTO v_user_id
  FROM public.workshops
  WHERE id = p_workshop_id;
  
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You do not have access to this workshop';
  END IF;

  -- Total services in date range
  SELECT COUNT(*) INTO v_total_services
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Completed services
  SELECT COUNT(*) INTO v_completed_services
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND status = 'completed'
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Pending services (all non-completed)
  SELECT COUNT(*) INTO v_pending_services
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND status != 'completed'
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Total revenue from approved diagnostic items
  SELECT COALESCE(SUM(
    (SELECT SUM((item->>'price')::numeric)
     FROM jsonb_array_elements(diagnostic_report->'items') AS item
     WHERE item->>'status' = 'approved')
  ), 0) INTO v_total_revenue
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND diagnostic_report IS NOT NULL
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Average service time for completed services
  SELECT AVG(updated_at - created_at) INTO v_avg_service_time
  FROM public.services
  WHERE workshop_id = p_workshop_id
    AND status = 'completed'
    AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Services by type
  SELECT COALESCE(jsonb_object_agg(service_type, count), '{}'::jsonb) INTO v_services_by_type
  FROM (
    SELECT service_type, COUNT(*) as count
    FROM public.services
    WHERE workshop_id = p_workshop_id
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY service_type
  ) AS type_counts;

  -- Services by status
  SELECT COALESCE(jsonb_object_agg(status, count), '{}'::jsonb) INTO v_services_by_status
  FROM (
    SELECT status, COUNT(*) as count
    FROM public.services
    WHERE workshop_id = p_workshop_id
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY status
  ) AS status_counts;

  -- Daily revenue for the period
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('date', day, 'revenue', COALESCE(revenue, 0))
    ORDER BY day
  ), '[]'::jsonb) INTO v_daily_revenue
  FROM (
    SELECT 
      d.day::date as day,
      SUM(
        (SELECT SUM((item->>'price')::numeric)
         FROM jsonb_array_elements(s.diagnostic_report->'items') AS item
         WHERE item->>'status' = 'approved')
      ) as revenue
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS d(day)
    LEFT JOIN public.services s 
      ON s.workshop_id = p_workshop_id 
      AND s.created_at::date = d.day::date
      AND s.diagnostic_report IS NOT NULL
    GROUP BY d.day
  ) AS daily;

  -- Build result
  result := jsonb_build_object(
    'total_services', v_total_services,
    'completed_services', v_completed_services,
    'pending_services', v_pending_services,
    'total_revenue', v_total_revenue,
    'avg_service_time_hours', EXTRACT(EPOCH FROM v_avg_service_time) / 3600,
    'services_by_type', v_services_by_type,
    'services_by_status', v_services_by_status,
    'daily_revenue', v_daily_revenue
  );

  RETURN result;
END;
$function$;