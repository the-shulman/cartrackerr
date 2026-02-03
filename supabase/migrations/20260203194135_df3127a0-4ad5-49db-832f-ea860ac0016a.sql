-- Update the handle_new_user function to also save the phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.workshops (user_id, workshop_name, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'workshop_name', 'Mi Taller'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$function$;