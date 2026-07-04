// Database types for FarmSync

export type AppRole = 'admin' | 'staff' | 'farmer' | 'vet' | 'farm_manager' | 'client';
export type AnimalCategory = 'cattle' | 'goats' | 'sheep' | 'poultry' | 'others';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type LivestockStatus = 'active' | 'sold' | 'deceased' | 'transferred' | 'archived';
export type HealthRecordType = 'vaccination' | 'treatment' | 'checkup' | 'illness' | 'diagnosis' | 'follow_up' | 'other';
export type BreedingOutcome = 'pending' | 'successful' | 'unsuccessful' | 'complications';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: AppRole;
  license_number?: string | null;
  phone?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  owner_id: string;
  name: string;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Livestock {
  id: string;
  animal_id: string;
  breed: string;
  age: number;
  sex: string;
  status: string;
  notes: string | null;
  sale_ready?: boolean;
  farm_id?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  livestock_id: string;
  record_type: string;
  description: string;
  performed_by: string | null;
  record_date: string;
  farm_id?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BreedingRecord {
  id: string;
  livestock_id: string;
  breeding_date: string;
  partner_animal_id: string | null;
  expected_due_date: string | null;
  actual_birth_date: string | null;
  offspring_count: number | null;
  outcome: string | null;
  notes: string | null;
  farm_id?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovementRecord {
  id: string;
  livestock_id: string;
  from_location: string;
  to_location: string;
  movement_date: string;
  reason: string | null;
  transported_by: string | null;
  farm_id?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  livestock_id: string;
  vet_id: string;
  record_type: string;
  diagnosis: string | null;
  treatment: string | null;
  medications: unknown;
  notes: string | null;
  record_date: string;
  next_visit_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: AppRole;
  farm_id: string | null;
  license_number: string | null;
  status: RegistrationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  farms?: Farm;
}

export interface FarmAssignment {
  id: string;
  farm_id: string;
  user_id: string;
  role: AppRole;
  assigned_by: string;
  created_at: string;
  profiles?: Profile;
  farms?: Farm;
}

export interface Veterinarian {
  id: string;
  user_id: string;
  license_number: string;
  specialization: string | null;
  contact_number: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  farm_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  client_id: string;
  farm_id: string;
  request_type: string;
  description: string | null;
  status: string;
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  livestock_id: string | null;
  activity_type: string;
  description: string;
  performed_by: string | null;
  metadata: Record<string, unknown> | null;
  farm_id?: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalLivestock: number;
  breedBreakdown: { breed: string; count: number }[];
  sexBreakdown: { sex: string; count: number }[];
  recentActivity: ActivityLog[];
}

export interface AnimalInterest {
  id: string;
  animal_id: string;
  client_id: string;
  message: string | null;
  status: 'pending' | 'contacted' | 'declined';
  created_at: string;
  updated_at: string;
}
