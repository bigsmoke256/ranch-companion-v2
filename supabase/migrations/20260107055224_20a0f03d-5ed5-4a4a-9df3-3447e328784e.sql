-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    role app_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create livestock table
CREATE TABLE public.livestock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id TEXT NOT NULL UNIQUE,
    breed TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0),
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased', 'transferred')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_records table
CREATE TABLE public.health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestock_id UUID REFERENCES public.livestock(id) ON DELETE CASCADE NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('vaccination', 'treatment', 'checkup', 'illness', 'other')),
    description TEXT NOT NULL,
    performed_by TEXT,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create breeding_records table
CREATE TABLE public.breeding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestock_id UUID REFERENCES public.livestock(id) ON DELETE CASCADE NOT NULL,
    partner_animal_id TEXT,
    breeding_date DATE NOT NULL,
    expected_due_date DATE,
    actual_birth_date DATE,
    offspring_count INTEGER,
    outcome TEXT CHECK (outcome IN ('pending', 'successful', 'unsuccessful', 'complications')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movement_records table
CREATE TABLE public.movement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestock_id UUID REFERENCES public.livestock(id) ON DELETE CASCADE NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    transported_by TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_log for traceability
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestock_id UUID REFERENCES public.livestock(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Livestock policies - all authenticated users can read
CREATE POLICY "Authenticated users can view livestock"
ON public.livestock FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert livestock"
ON public.livestock FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update livestock"
ON public.livestock FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only admins can delete livestock"
ON public.livestock FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Health records policies
CREATE POLICY "Authenticated users can view health records"
ON public.health_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert health records"
ON public.health_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update health records"
ON public.health_records FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only admins can delete health records"
ON public.health_records FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Breeding records policies
CREATE POLICY "Authenticated users can view breeding records"
ON public.breeding_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert breeding records"
ON public.breeding_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update breeding records"
ON public.breeding_records FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only admins can delete breeding records"
ON public.breeding_records FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Movement records policies
CREATE POLICY "Authenticated users can view movement records"
ON public.movement_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert movement records"
ON public.movement_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update movement records"
ON public.movement_records FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Only admins can delete movement records"
ON public.movement_records FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Activity log policies
CREATE POLICY "Authenticated users can view activity log"
ON public.activity_log FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert activity log"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = performed_by);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_role app_role;
BEGIN
  -- Get role from metadata, default to 'staff'
  selected_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'staff'
  );
  
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    selected_role
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_livestock_updated_at
  BEFORE UPDATE ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at
  BEFORE UPDATE ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_breeding_records_updated_at
  BEFORE UPDATE ON public.breeding_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movement_records_updated_at
  BEFORE UPDATE ON public.movement_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_livestock_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (livestock_id, activity_type, description, performed_by, metadata)
    VALUES (NEW.id, 'livestock_added', 'New animal added: ' || NEW.animal_id, NEW.created_by, 
      jsonb_build_object('animal_id', NEW.animal_id, 'breed', NEW.breed, 'sex', NEW.sex));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.activity_log (livestock_id, activity_type, description, performed_by, metadata)
      VALUES (NEW.id, 'status_changed', 'Status changed from ' || OLD.status || ' to ' || NEW.status, NEW.created_by,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_livestock_changes
  AFTER INSERT OR UPDATE ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.log_livestock_activity();

-- Function to log health records
CREATE OR REPLACE FUNCTION public.log_health_record_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  animal_tag TEXT;
BEGIN
  SELECT animal_id INTO animal_tag FROM public.livestock WHERE id = NEW.livestock_id;
  
  INSERT INTO public.activity_log (livestock_id, activity_type, description, performed_by, metadata)
  VALUES (NEW.livestock_id, 'health_record', NEW.record_type || ' recorded for ' || animal_tag, NEW.created_by,
    jsonb_build_object('record_type', NEW.record_type, 'description', NEW.description));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_health_record_changes
  AFTER INSERT ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.log_health_record_activity();

-- Function to log breeding records
CREATE OR REPLACE FUNCTION public.log_breeding_record_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  animal_tag TEXT;
BEGIN
  SELECT animal_id INTO animal_tag FROM public.livestock WHERE id = NEW.livestock_id;
  
  INSERT INTO public.activity_log (livestock_id, activity_type, description, performed_by, metadata)
  VALUES (NEW.livestock_id, 'breeding_record', 'Breeding recorded for ' || animal_tag, NEW.created_by,
    jsonb_build_object('breeding_date', NEW.breeding_date, 'partner', NEW.partner_animal_id));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_breeding_record_changes
  AFTER INSERT ON public.breeding_records
  FOR EACH ROW EXECUTE FUNCTION public.log_breeding_record_activity();

-- Function to log movement records
CREATE OR REPLACE FUNCTION public.log_movement_record_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  animal_tag TEXT;
BEGIN
  SELECT animal_id INTO animal_tag FROM public.livestock WHERE id = NEW.livestock_id;
  
  INSERT INTO public.activity_log (livestock_id, activity_type, description, performed_by, metadata)
  VALUES (NEW.livestock_id, 'movement_record', animal_tag || ' moved from ' || NEW.from_location || ' to ' || NEW.to_location, NEW.created_by,
    jsonb_build_object('from', NEW.from_location, 'to', NEW.to_location, 'reason', NEW.reason));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_movement_record_changes
  AFTER INSERT ON public.movement_records
  FOR EACH ROW EXECUTE FUNCTION public.log_movement_record_activity();