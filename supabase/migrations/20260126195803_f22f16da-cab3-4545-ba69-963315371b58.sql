-- Function to get all services history for a client by phone and plate
CREATE OR REPLACE FUNCTION public.get_client_service_history(p_phone text, p_plate text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Get all services for this client (phone + plate), including delivered ones
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'client_name', s.client_name,
      'client_phone', s.client_phone,
      'vehicle_brand', s.vehicle_brand,
      'vehicle_model', s.vehicle_model,
      'vehicle_plate', s.vehicle_plate,
      'vehicle_year', s.vehicle_year,
      'service_type', s.service_type,
      'description', s.description,
      'status', s.status,
      'diagnostic_report', s.diagnostic_report,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'estimated_completion', s.estimated_completion
    )
    ORDER BY s.created_at DESC
  )
  INTO result
  FROM public.services s
  WHERE 
    regexp_replace(s.client_phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    AND UPPER(TRIM(s.vehicle_plate)) = UPPER(TRIM(p_plate));
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;