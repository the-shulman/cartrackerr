-- Drop existing restrictive policies on services table
DROP POLICY IF EXISTS "Workshop owners can view their services" ON public.services;
DROP POLICY IF EXISTS "Workshop owners can create services" ON public.services;
DROP POLICY IF EXISTS "Workshop owners can update their services" ON public.services;
DROP POLICY IF EXISTS "Workshop owners can delete their services" ON public.services;

-- Create new PERMISSIVE policies with explicit authentication requirement
-- This ensures anonymous/public users have NO access

CREATE POLICY "Workshop owners can view their services" 
ON public.services 
FOR SELECT 
TO authenticated
USING (workshop_id IN (
  SELECT id FROM public.workshops WHERE user_id = auth.uid()
));

CREATE POLICY "Workshop owners can create services" 
ON public.services 
FOR INSERT 
TO authenticated
WITH CHECK (workshop_id IN (
  SELECT id FROM public.workshops WHERE user_id = auth.uid()
));

CREATE POLICY "Workshop owners can update their services" 
ON public.services 
FOR UPDATE 
TO authenticated
USING (workshop_id IN (
  SELECT id FROM public.workshops WHERE user_id = auth.uid()
));

CREATE POLICY "Workshop owners can delete their services" 
ON public.services 
FOR DELETE 
TO authenticated
USING (workshop_id IN (
  SELECT id FROM public.workshops WHERE user_id = auth.uid()
));