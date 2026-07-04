-- Update the handle_new_user function to ALWAYS assign 'staff' role, ignoring any client-supplied role
-- This prevents privilege escalation attacks where users try to self-assign admin role

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Always assign 'staff' role regardless of what the client sends
  -- This is a security measure to prevent self-privilege escalation
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'staff');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'staff');
  
  RETURN new;
END;
$$;