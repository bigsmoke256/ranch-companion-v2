-- Add profile columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;

-- Create animal_interests table for client interest tracking
CREATE TABLE IF NOT EXISTS public.animal_interests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id uuid NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(animal_id, client_id)
);

-- Enable RLS on animal_interests
ALTER TABLE public.animal_interests ENABLE ROW LEVEL SECURITY;

-- Policies for animal_interests
CREATE POLICY "Clients can create interest"
ON public.animal_interests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can view their own interests"
ON public.animal_interests
FOR SELECT
TO authenticated
USING (auth.uid() = client_id OR has_role(auth.uid(), 'farmer') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Farmers can update interest status"
ON public.animal_interests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'farmer') OR has_role(auth.uid(), 'admin'));

-- Update livestock table to add sale_ready flag
ALTER TABLE public.livestock ADD COLUMN IF NOT EXISTS sale_ready boolean NOT NULL DEFAULT false;

-- Update RLS policies for profiles to allow admins/farmers to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'farmer') 
    OR has_role(auth.uid(), 'admin')
);

-- Drop existing update policy to replace it
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow farmers and admins to update any profile, users can update their own
CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'farmer') 
    OR has_role(auth.uid(), 'admin')
);

-- Update the handle_new_user function to use the role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  requested_role text;
  valid_role app_role;
BEGIN
  -- Get role from user metadata, default to 'client' if not specified
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  -- Validate and cast the role
  BEGIN
    valid_role := requested_role::app_role;
  EXCEPTION WHEN OTHERS THEN
    valid_role := 'client'::app_role;
  END;
  
  -- Insert profile with the requested role
  INSERT INTO public.profiles (user_id, full_name, role, license_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    valid_role,
    NEW.raw_user_meta_data->>'license_number'
  );
  
  -- Also insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, valid_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();