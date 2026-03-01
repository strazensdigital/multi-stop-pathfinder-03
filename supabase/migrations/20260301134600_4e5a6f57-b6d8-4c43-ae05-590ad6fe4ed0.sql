
-- Add auth_provider column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email';

-- Update the handle_new_user trigger to capture the provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, plan, display_name, auth_provider)
  values (
    new.id,
    new.email,
    'free',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', null),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  );
  return new;
end;
$function$;
