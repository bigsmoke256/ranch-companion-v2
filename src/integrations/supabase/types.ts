export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          farm_id: string | null
          id: string
          livestock_id: string | null
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          farm_id?: string | null
          id?: string
          livestock_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          farm_id?: string | null
          id?: string
          livestock_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_interests: {
        Row: {
          animal_id: string
          client_id: string
          created_at: string
          id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          animal_id: string
          client_id: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          animal_id?: string
          client_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_interests_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_records: {
        Row: {
          actual_birth_date: string | null
          breeding_date: string
          created_at: string
          created_by: string | null
          expected_due_date: string | null
          farm_id: string | null
          id: string
          livestock_id: string
          notes: string | null
          offspring_count: number | null
          outcome: string | null
          partner_animal_id: string | null
          updated_at: string
        }
        Insert: {
          actual_birth_date?: string | null
          breeding_date: string
          created_at?: string
          created_by?: string | null
          expected_due_date?: string | null
          farm_id?: string | null
          id?: string
          livestock_id: string
          notes?: string | null
          offspring_count?: number | null
          outcome?: string | null
          partner_animal_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_birth_date?: string | null
          breeding_date?: string
          created_at?: string
          created_by?: string | null
          expected_due_date?: string | null
          farm_id?: string | null
          id?: string
          livestock_id?: string
          notes?: string | null
          offspring_count?: number | null
          outcome?: string | null
          partner_animal_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeding_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_records_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_members: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_members_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          farm_code: string
          id: string
          location: string | null
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          farm_code: string
          id?: string
          location?: string | null
          name: string
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          farm_code?: string
          id?: string
          location?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          farm_id: string | null
          id: string
          livestock_id: string
          performed_by: string | null
          record_date: string
          record_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          farm_id?: string | null
          id?: string
          livestock_id: string
          performed_by?: string | null
          record_date?: string
          record_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          farm_id?: string | null
          id?: string
          livestock_id?: string
          performed_by?: string | null
          record_date?: string
          record_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock: {
        Row: {
          age: number
          animal_id: string
          breed: string
          created_at: string
          created_by: string | null
          farm_id: string | null
          id: string
          notes: string | null
          sale_ready: boolean
          sex: string
          status: string
          updated_at: string
        }
        Insert: {
          age: number
          animal_id: string
          breed: string
          created_at?: string
          created_by?: string | null
          farm_id?: string | null
          id?: string
          notes?: string | null
          sale_ready?: boolean
          sex: string
          status?: string
          updated_at?: string
        }
        Update: {
          age?: number
          animal_id?: string
          breed?: string
          created_at?: string
          created_by?: string | null
          farm_id?: string | null
          id?: string
          notes?: string | null
          sale_ready?: boolean
          sex?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_records: {
        Row: {
          created_at: string
          created_by: string | null
          farm_id: string | null
          from_location: string
          id: string
          livestock_id: string
          movement_date: string
          reason: string | null
          to_location: string
          transported_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          farm_id?: string | null
          from_location: string
          id?: string
          livestock_id: string
          movement_date?: string
          reason?: string | null
          to_location: string
          transported_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          farm_id?: string | null
          from_location?: string
          id?: string
          livestock_id?: string
          movement_date?: string
          reason?: string | null
          to_location?: string
          transported_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movement_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_records_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          farm_id: string | null
          full_name: string | null
          id: string
          license_number: string | null
          location: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_id?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          location?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          location?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_role_request:
        | { Args: { request_id: string }; Returns: boolean }
        | {
            Args: { request_id: string; reviewer_id: string }
            Returns: boolean
          }
      generate_farm_code: { Args: never; Returns: string }
      get_user_farm_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_role_request:
        | { Args: { reason: string; request_id: string }; Returns: boolean }
        | {
            Args: { reason: string; request_id: string; reviewer_id: string }
            Returns: boolean
          }
      user_belongs_to_farm: {
        Args: { _farm_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "farmer" | "vet" | "farm_manager" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "farmer", "vet", "farm_manager", "client"],
    },
  },
} as const
