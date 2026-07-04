-- First migration: Add enum values only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'farmer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vet';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'farm_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';