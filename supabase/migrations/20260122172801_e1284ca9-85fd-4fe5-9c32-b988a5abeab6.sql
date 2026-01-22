-- Create services table for persisting service data
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_year TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  diagnostic_report JSONB,
  estimated_completion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by workshop
CREATE INDEX idx_services_workshop_id ON public.services(workshop_id);

-- Create index for client portal lookup (phone + plate combination)
CREATE INDEX idx_services_client_lookup ON public.services(client_phone, vehicle_plate);

-- Create index for status filtering
CREATE INDEX idx_services_status ON public.services(status);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy: Workshop owners can view their own services
CREATE POLICY "Workshop owners can view their services"
ON public.services
FOR SELECT
TO authenticated
USING (
  workshop_id IN (
    SELECT id FROM public.workshops WHERE user_id = auth.uid()
  )
);

-- Policy: Workshop owners can create services for their workshop
CREATE POLICY "Workshop owners can create services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  workshop_id IN (
    SELECT id FROM public.workshops WHERE user_id = auth.uid()
  )
);

-- Policy: Workshop owners can update their services
CREATE POLICY "Workshop owners can update their services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  workshop_id IN (
    SELECT id FROM public.workshops WHERE user_id = auth.uid()
  )
);

-- Policy: Workshop owners can delete their services
CREATE POLICY "Workshop owners can delete their services"
ON public.services
FOR DELETE
TO authenticated
USING (
  workshop_id IN (
    SELECT id FROM public.workshops WHERE user_id = auth.uid()
  )
);

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a secure function for client portal lookup (no auth required)
-- This allows clients to look up their service by phone + plate without being authenticated
CREATE OR REPLACE FUNCTION public.lookup_service_by_phone_plate(
  p_phone TEXT,
  p_plate TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Normalize phone and plate for comparison
  SELECT jsonb_build_object(
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
    'updated_at', s.updated_at
  )
  INTO result
  FROM public.services s
  WHERE 
    -- Normalize phone comparison (remove non-digits)
    regexp_replace(s.client_phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    AND UPPER(TRIM(s.vehicle_plate)) = UPPER(TRIM(p_plate))
    -- Only return services that are not yet delivered
    AND s.status != 'delivered'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- Create a secure function for clients to approve services
CREATE OR REPLACE FUNCTION public.approve_service_items(
  p_service_id UUID,
  p_phone TEXT,
  p_plate TEXT,
  p_approved_item_ids TEXT[],
  p_client_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_updated_report JSONB;
BEGIN
  -- Verify the service exists and matches phone/plate
  SELECT * INTO v_service
  FROM public.services
  WHERE 
    id = p_service_id
    AND regexp_replace(client_phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    AND UPPER(TRIM(vehicle_plate)) = UPPER(TRIM(p_plate))
    AND status = 'awaiting_approval';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service not found or not awaiting approval');
  END IF;
  
  -- Update the diagnostic report with approved items
  v_updated_report := v_service.diagnostic_report;
  
  -- Update each item's approved status
  SELECT jsonb_set(
    v_updated_report,
    '{items}',
    (
      SELECT jsonb_agg(
        CASE 
          WHEN item->>'id' = ANY(p_approved_item_ids) 
          THEN jsonb_set(item, '{approved}', 'true'::jsonb)
          ELSE jsonb_set(item, '{approved}', 'false'::jsonb)
        END
      )
      FROM jsonb_array_elements(v_updated_report->'items') AS item
    )
  ) INTO v_updated_report;
  
  -- Add approval timestamp and client notes
  v_updated_report := jsonb_set(v_updated_report, '{approvedAt}', to_jsonb(NOW()));
  IF p_client_notes IS NOT NULL THEN
    v_updated_report := jsonb_set(v_updated_report, '{clientNotes}', to_jsonb(p_client_notes));
  END IF;
  
  -- Update the service
  UPDATE public.services
  SET 
    status = 'in_progress',
    diagnostic_report = v_updated_report,
    updated_at = NOW()
  WHERE id = p_service_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;