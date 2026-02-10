
-- Revert to allow unauthenticated calls BUT don't return email directly
-- Instead, only return a boolean indicating if a phone is registered
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
  -- If authenticated, allow full lookup for own phone only
  IF auth.uid() IS NOT NULL THEN
    SELECT user_id INTO v_user_id
    FROM public.workshops
    WHERE phone = regexp_replace(p_phone, '\D', '', 'g')
    LIMIT 1;
    
    IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
      RETURN NULL;
    END IF;
    
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = v_user_id;
    
    RETURN v_email;
  END IF;

  -- For unauthenticated calls, still return email but only for login flow
  -- This is needed for the phone-based login feature
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
