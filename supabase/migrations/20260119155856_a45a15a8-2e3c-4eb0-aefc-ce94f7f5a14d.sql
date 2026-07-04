-- ============================================================
-- SECURITY FIX: Prevent privilege escalation through self-role-assignment
-- Fixes: rpc_functions_access, role_checks_client, role_assignment_conflict
-- ============================================================

-- 1. Fix handle_new_user to ONLY allow 'client' role on self-signup
-- All other roles must be granted by farm owners through a proper workflow
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role app_role := 'client'::app_role;
BEGIN
  -- SECURITY: All new signups start as 'client'
  -- Privileged roles (farmer, vet, farm_manager, admin, staff) must be granted
  -- by farm owners through proper approval workflow
  
  -- Insert profile with client role only (ignore any role in metadata)
  INSERT INTO public.profiles (user_id, full_name, role, license_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    assigned_role,
    NEW.raw_user_meta_data->>'license_number'
  );
  
  -- Also insert into user_roles table with client role only
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;

-- 2. Fix approve_role_request to use auth.uid() instead of client-supplied reviewer_id
-- Also adds proper authorization check that caller owns the farm
CREATE OR REPLACE FUNCTION public.approve_role_request(request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  caller_id UUID := auth.uid();
  farm_owner_id UUID;
BEGIN
  -- Check caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the request
  SELECT * INTO req FROM public.role_requests WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role request not found or already processed';
  END IF;
  
  -- CRITICAL: Verify caller owns the farm
  SELECT owner_id INTO farm_owner_id FROM public.farms WHERE id = req.farm_id;
  
  IF farm_owner_id IS NULL THEN
    RAISE EXCEPTION 'Farm not found';
  END IF;
  
  IF farm_owner_id != caller_id THEN
    RAISE EXCEPTION 'Only farm owner can approve role requests';
  END IF;
  
  -- Update request status
  UPDATE public.role_requests
  SET status = 'approved', reviewed_by = caller_id, reviewed_at = now()
  WHERE id = request_id;
  
  -- Add user to farm_members with the requested role
  INSERT INTO public.farm_members (farm_id, user_id, role, is_active)
  VALUES (req.farm_id, req.user_id, req.requested_role, true)
  ON CONFLICT (farm_id, user_id) DO UPDATE 
  SET role = req.requested_role, is_active = true, updated_at = now();
  
  -- Update user role in user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (req.user_id, req.requested_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile role
  UPDATE public.profiles
  SET role = req.requested_role, updated_at = now()
  WHERE user_id = req.user_id;
  
  RETURN TRUE;
END;
$$;

-- 3. Fix reject_role_request similarly - use auth.uid() and verify farm ownership
CREATE OR REPLACE FUNCTION public.reject_role_request(request_id uuid, reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  caller_id UUID := auth.uid();
  farm_owner_id UUID;
BEGIN
  -- Check caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the request
  SELECT * INTO req FROM public.role_requests WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role request not found or already processed';
  END IF;
  
  -- CRITICAL: Verify caller owns the farm
  SELECT owner_id INTO farm_owner_id FROM public.farms WHERE id = req.farm_id;
  
  IF farm_owner_id IS NULL THEN
    RAISE EXCEPTION 'Farm not found';
  END IF;
  
  IF farm_owner_id != caller_id THEN
    RAISE EXCEPTION 'Only farm owner can reject role requests';
  END IF;
  
  -- Update request status
  UPDATE public.role_requests
  SET status = 'rejected', 
      reviewed_by = caller_id, 
      reviewed_at = now(),
      rejection_reason = reason
  WHERE id = request_id;
  
  RETURN TRUE;
END;
$$;

-- 4. Drop and recreate DELETE policies to use farm ownership instead of has_role('admin')
-- This prevents the attack vector where self-assigned admin role grants delete privileges

-- Livestock DELETE policy
DROP POLICY IF EXISTS "Farm admins can delete livestock" ON public.livestock;
CREATE POLICY "Farm owners can delete livestock"
ON public.livestock FOR DELETE
USING (
  farm_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = livestock.farm_id 
    AND owner_id = auth.uid()
  )
);

-- Health records DELETE policy  
DROP POLICY IF EXISTS "Farm admins can delete health records" ON public.health_records;
CREATE POLICY "Farm owners can delete health records"
ON public.health_records FOR DELETE
USING (
  farm_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = health_records.farm_id 
    AND owner_id = auth.uid()
  )
);

-- Breeding records DELETE policy
DROP POLICY IF EXISTS "Farm admins can delete breeding records" ON public.breeding_records;
CREATE POLICY "Farm owners can delete breeding records"
ON public.breeding_records FOR DELETE
USING (
  farm_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = breeding_records.farm_id 
    AND owner_id = auth.uid()
  )
);

-- Movement records DELETE policy
DROP POLICY IF EXISTS "Farm admins can delete movement records" ON public.movement_records;
CREATE POLICY "Farm owners can delete movement records"
ON public.movement_records FOR DELETE
USING (
  farm_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = movement_records.farm_id 
    AND owner_id = auth.uid()
  )
);

-- 5. Add unique constraint on farm_members if not exists (for upsert to work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'farm_members_farm_user_unique'
  ) THEN
    ALTER TABLE public.farm_members ADD CONSTRAINT farm_members_farm_user_unique UNIQUE (farm_id, user_id);
  END IF;
END
$$;