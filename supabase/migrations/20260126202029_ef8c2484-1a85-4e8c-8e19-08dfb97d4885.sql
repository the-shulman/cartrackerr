-- Add next maintenance columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS next_maintenance_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_maintenance_km integer;

-- Create maintenance reminders tracking table
CREATE TABLE public.maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_phone text NOT NULL,
  client_name text NOT NULL,
  vehicle_info text NOT NULL,
  reminder_date date NOT NULL,
  reminder_type text NOT NULL DEFAULT 'date', -- 'date' or 'km'
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for maintenance_reminders
CREATE POLICY "Workshop owners can view their reminders"
ON public.maintenance_reminders
FOR SELECT
USING (workshop_id IN (
  SELECT id FROM public.workshops WHERE user_id = auth.uid()
));

CREATE POLICY "Workshop owners can create reminders"
ON public.maintenance_reminders
FOR INSERT
WITH CHECK (workshop_id IN (
  SELECT id FROM public.workshops WHERE user_id = auth.uid()
));

CREATE POLICY "Workshop owners can update their reminders"
ON public.maintenance_reminders
FOR UPDATE
USING (workshop_id IN (
  SELECT id FROM public.workshops WHERE user_id = auth.uid()
));

CREATE POLICY "Workshop owners can delete their reminders"
ON public.maintenance_reminders
FOR DELETE
USING (workshop_id IN (
  SELECT id FROM public.workshops WHERE user_id = auth.uid()
));

-- Create index for efficient querying of pending reminders
CREATE INDEX idx_maintenance_reminders_pending 
ON public.maintenance_reminders(reminder_date, sent_at) 
WHERE sent_at IS NULL;