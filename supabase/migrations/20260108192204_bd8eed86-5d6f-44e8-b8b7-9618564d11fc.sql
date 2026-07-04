-- Add remaining tables and functions that couldn't be created in previous migration
-- Using TEXT for role references instead of the new enum values to avoid transaction issues

-- 14. Create function to approve role request (use text comparison)
CREATE OR REPLACE FUNCTION public.approve_role_request(
  request_id UUID,
  reviewer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  -- Get the request
  SELECT * INTO req FROM public.role_requests WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE public.role_requests
  SET status = 'approved', reviewed_by = reviewer_id, reviewed_at = now()
  WHERE id = request_id;
  
  -- Create farm assignment
  INSERT INTO public.farm_assignments (farm_id, user_id, role, assigned_by)
  VALUES (req.farm_id, req.user_id, req.requested_role, reviewer_id);
  
  -- Update user role in user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (req.user_id, req.requested_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- If vet, create vet profile
  IF req.requested_role::text = 'veterinarian' AND req.license_number IS NOT NULL THEN
    INSERT INTO public.veterinarians (user_id, license_number)
    VALUES (req.user_id, req.license_number)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 15. Create function to reject role request
CREATE OR REPLACE FUNCTION public.reject_role_request(
  request_id UUID,
  reviewer_id UUID,
  reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.role_requests
  SET status = 'rejected', 
      reviewed_by = reviewer_id, 
      reviewed_at = now(),
      rejection_reason = reason
  WHERE id = request_id;
  
  RETURN FOUND;
END;
$$;

-- 16. Update get_user_role to handle new roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 17. Update handle_new_user to default to 'staff' (which exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Always assign 'staff' role for security
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'staff');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'staff');
  
  RETURN new;
END;
$$;