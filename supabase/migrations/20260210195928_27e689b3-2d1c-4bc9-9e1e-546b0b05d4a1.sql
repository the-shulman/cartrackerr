
CREATE OR REPLACE FUNCTION public.get_email_by_phone(p_phone text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  -- Only allow service role or authenticated users to call this
  -- When called from edge function with service role, auth.uid() is null
  -- but that's OK because edge function controls access
  
  SELECT user_id INTO v_user_id
  FROM public.workshops
  WHERE phone = regexp_replace(p_phone, '\D', '', 'g')
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;
  
  RETURN v_email;
END;
$function$;

-- Revoke public execute permission - only service role can call it
REVOKE EXECUTE ON FUNCTION public.get_email_by_phone(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_email_by_phone(text) FROM authenticated;
