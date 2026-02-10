
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
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Find the workshop with this phone number
  SELECT user_id INTO v_user_id
  FROM public.workshops
  WHERE phone = regexp_replace(p_phone, '\D', '', 'g')
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Only allow users to lookup their own phone number
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: you can only look up your own phone number';
  END IF;
  
  -- Get the email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;
  
  RETURN v_email;
END;
$function$;
