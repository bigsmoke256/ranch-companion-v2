-- =============================================
-- FARM-LEVEL DATA ISOLATION MIGRATION
-- =============================================

-- 1. Create farms table with unique farm codes
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  location TEXT,
  description TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on farms
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- 2. Create farm_members table to link users to farms
CREATE TABLE public.farm_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(farm_id, user_id)
);

-- Enable RLS on farm_members
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;

-- 3. Function to generate unique farm code (e.g., FS-UG-2026-001)
CREATE OR REPLACE FUNCTION public.generate_farm_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(farm_code FROM 'FS-[A-Z]{2}-[0-9]{4}-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.farms
  WHERE farm_code LIKE 'FS-UG-' || year_part || '-%';
  
  new_code := 'FS-UG-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$;

-- 4. Function to get user's farm_id (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_farm_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT farm_id
  FROM public.farm_members
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1;
$$;

-- 5. Function to check if user belongs to a specific farm
CREATE OR REPLACE FUNCTION public.user_belongs_to_farm(_user_id UUID, _farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.farm_members
    WHERE user_id = _user_id
      AND farm_id = _farm_id
      AND is_active = true
  );
$$;

-- 6. Add farm_id column to livestock table
ALTER TABLE public.livestock ADD COLUMN farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE;

-- 7. Add farm_id column to health_records table
ALTER TABLE public.health_records ADD COLUMN farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE;

-- 8. Add farm_id column to breeding_records table
ALTER TABLE public.breeding_records ADD COLUMN farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE;

-- 9. Add farm_id column to movement_records table
ALTER TABLE public.movement_records ADD COLUMN farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE;

-- 10. Add farm_id column to activity_log table
ALTER TABLE public.activity_log ADD COLUMN farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE;

-- =============================================
-- RLS POLICIES FOR FARMS TABLE
-- =============================================

-- Farm owners and members can view their farms
CREATE POLICY "Users can view their farms"
ON public.farms
FOR SELECT
USING (
  owner_id = auth.uid() 
  OR public.user_belongs_to_farm(auth.uid(), id)
);

-- Only authenticated users can create farms (they become owners)
CREATE POLICY "Authenticated users can create farms"
ON public.farms
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Only farm owners can update their farms
CREATE POLICY "Farm owners can update their farms"
ON public.farms
FOR UPDATE
USING (owner_id = auth.uid());

-- Only farm owners can delete their farms
CREATE POLICY "Farm owners can delete their farms"
ON public.farms
FOR DELETE
USING (owner_id = auth.uid());

-- =============================================
-- RLS POLICIES FOR FARM_MEMBERS TABLE
-- =============================================

-- Users can view members of farms they belong to
CREATE POLICY "Users can view farm members"
ON public.farm_members
FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
  OR EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

-- Farm owners can add members
CREATE POLICY "Farm owners can add members"
ON public.farm_members
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

-- Farm owners can update member status
CREATE POLICY "Farm owners can update members"
ON public.farm_members
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

-- Farm owners can remove members
CREATE POLICY "Farm owners can remove members"
ON public.farm_members
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

-- =============================================
-- UPDATE LIVESTOCK RLS POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view livestock" ON public.livestock;
DROP POLICY IF EXISTS "Authenticated users can insert livestock" ON public.livestock;
DROP POLICY IF EXISTS "Authenticated users can update livestock" ON public.livestock;
DROP POLICY IF EXISTS "Only admins can delete livestock" ON public.livestock;

-- New farm-scoped policies
CREATE POLICY "Users can view livestock in their farm"
ON public.livestock
FOR SELECT
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
  OR (sale_ready = true AND status = 'active')
);

CREATE POLICY "Farm members can insert livestock"
ON public.livestock
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (farm_id IS NULL OR public.user_belongs_to_farm(auth.uid(), farm_id))
  AND (public.has_role(auth.uid(), 'farmer') OR public.has_role(auth.uid(), 'farm_manager'))
);

CREATE POLICY "Farm members can update livestock"
ON public.livestock
FOR UPDATE
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
);

CREATE POLICY "Farm admins can delete livestock"
ON public.livestock
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR (farm_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid()))
);

-- =============================================
-- UPDATE HEALTH_RECORDS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can view health records" ON public.health_records;
DROP POLICY IF EXISTS "Authenticated users can insert health records" ON public.health_records;
DROP POLICY IF EXISTS "Authenticated users can update health records" ON public.health_records;
DROP POLICY IF EXISTS "Only admins can delete health records" ON public.health_records;

CREATE POLICY "Users can view health records in their farm"
ON public.health_records
FOR SELECT
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
);

CREATE POLICY "Farm members can insert health records"
ON public.health_records
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (farm_id IS NULL OR public.user_belongs_to_farm(auth.uid(), farm_id))
);

CREATE POLICY "Farm members can update health records"
ON public.health_records
FOR UPDATE
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
);

CREATE POLICY "Farm admins can delete health records"
ON public.health_records
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR (farm_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid()))
);

-- =============================================
-- UPDATE BREEDING_RECORDS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can view breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "Authenticated users can insert breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "Authenticated users can update breeding records" ON public.breeding_records;
DROP POLICY IF EXISTS "Only admins can delete breeding records" ON public.breeding_records;

CREATE POLICY "Users can view breeding records in their farm"
ON public.breeding_records
FOR SELECT
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
);

CREATE POLICY "Farm members can insert breeding records"
ON public.breeding_records
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (farm_id IS NULL OR public.user_belongs_to_farm(auth.uid(), farm_id))
);

CREATE POLICY "Farm members can update breeding records"
ON public.breeding_records
FOR UPDATE
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
);

CREATE POLICY "Farm admins can delete breeding records"
ON public.breeding_records
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR (farm_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid()))
);

-- =============================================
-- UPDATE MOVEMENT_RECORDS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can view movement records" ON public.movement_records;
DROP POLICY IF EXISTS "Authenticated users can insert movement records" ON public.movement_records;
DROP POLICY IF EXISTS "Authenticated users can update movement records" ON public.movement_records;
DROP POLICY IF EXISTS "Only admins can delete movement records" ON public.movement_records;

CREATE POLICY "Users can view movement records in their farm"
ON public.movement_records
FOR SELECT
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
);

CREATE POLICY "Farm members can insert movement records"
ON public.movement_records
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (farm_id IS NULL OR public.user_belongs_to_farm(auth.uid(), farm_id))
);

CREATE POLICY "Farm members can update movement records"
ON public.movement_records
FOR UPDATE
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
);

CREATE POLICY "Farm admins can delete movement records"
ON public.movement_records
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR (farm_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid()))
);

-- =============================================
-- UPDATE ACTIVITY_LOG RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can view activity log" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert activity log" ON public.activity_log;

CREATE POLICY "Users can view activity log in their farm"
ON public.activity_log
FOR SELECT
USING (
  farm_id IS NULL 
  OR public.user_belongs_to_farm(auth.uid(), farm_id)
);

CREATE POLICY "Farm members can insert activity log"
ON public.activity_log
FOR INSERT
WITH CHECK (
  auth.uid() = performed_by
  AND (farm_id IS NULL OR public.user_belongs_to_farm(auth.uid(), farm_id))
);

-- =============================================
-- ADD farm_id TO PROFILES TABLE
-- =============================================

ALTER TABLE public.profiles ADD COLUMN farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL;

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_livestock_farm_id ON public.livestock(farm_id);
CREATE INDEX idx_health_records_farm_id ON public.health_records(farm_id);
CREATE INDEX idx_breeding_records_farm_id ON public.breeding_records(farm_id);
CREATE INDEX idx_movement_records_farm_id ON public.movement_records(farm_id);
CREATE INDEX idx_activity_log_farm_id ON public.activity_log(farm_id);
CREATE INDEX idx_farm_members_farm_id ON public.farm_members(farm_id);
CREATE INDEX idx_farm_members_user_id ON public.farm_members(user_id);
CREATE INDEX idx_profiles_farm_id ON public.profiles(farm_id);

-- =============================================
-- TRIGGER TO AUTO-UPDATE updated_at
-- =============================================

CREATE TRIGGER update_farms_updated_at
BEFORE UPDATE ON public.farms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farm_members_updated_at
BEFORE UPDATE ON public.farm_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();