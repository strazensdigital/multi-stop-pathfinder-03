
-- Fix function search_path for handle_new_user (security linter warning)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free');
  return new;
end;
$function$;
