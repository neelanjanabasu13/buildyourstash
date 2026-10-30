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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      provider_usage: {
        Row: {
          calls: number
          day: string
          provider: string
        }
        Insert: {
          calls?: number
          day?: string
          provider: string
        }
        Update: {
          calls?: number
          day?: string
          provider?: string
        }
        Relationships: []
      }
      radar_query_attempts: {
        Row: {
          attempts: number
          kind: string
          lease_until: string | null
          round_id: string
          sweep_id: string
        }
        Insert: {
          attempts?: number
          kind: string
          lease_until?: string | null
          round_id: string
          sweep_id: string
        }
        Update: {
          attempts?: number
          kind?: string
          lease_until?: string | null
          round_id?: string
          sweep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "radar_query_attempts_sweep_id_fkey"
            columns: ["sweep_id"]
            isOneToOne: false
            referencedRelation: "sweeps"
            referencedColumns: ["id"]
          },
        ]
      }
      sweep_parts: {
        Row: {
          created_at: string
          part: string
          sweep_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          part: string
          sweep_id: string
          value: Json
        }
        Update: {
          created_at?: string
          part?: string
          sweep_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sweep_parts_sweep_id_fkey"
            columns: ["sweep_id"]
            isOneToOne: false
            referencedRelation: "sweeps"
            referencedColumns: ["id"]
          },
        ]
      }
      sweeps: {
        Row: {
          created_at: string
          id: string
          is_example: boolean
          pile: string
          pile_chars: number
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_example?: boolean
          pile: string
          pile_chars: number
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_example?: boolean
          pile?: string
          pile_chars?: number
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workshop_examples: {
        Row: {
          generated_at: string
          result: Json
          slug: string
          source_idea_id: string
          source_sweep_id: string
          timings: Json
          title: string
        }
        Insert: {
          generated_at: string
          result: Json
          slug: string
          source_idea_id: string
          source_sweep_id: string
          timings?: Json
          title: string
        }
        Update: {
          generated_at?: string
          result?: Json
          slug?: string
          source_idea_id?: string
          source_sweep_id?: string
          timings?: Json
          title?: string
        }
        Relationships: []
      }
      workshop_jobs: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          events: Json
          lease_token: string | null
          lease_until: string | null
          progress: Json
          status: string
          step: string
          sweep_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          events?: Json
          lease_token?: string | null
          lease_until?: string | null
          progress?: Json
          status?: string
          step?: string
          sweep_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          events?: Json
          lease_token?: string | null
          lease_until?: string | null
          progress?: Json
          status?: string
          step?: string
          sweep_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_jobs_sweep_id_fkey"
            columns: ["sweep_id"]
            isOneToOne: true
            referencedRelation: "sweeps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      begin_radar: {
        Args: { _force?: boolean; _idea_id: string; _sweep_id: string }
        Returns: string
      }
      claim_radar_query: {
        Args: {
          _idea_id: string
          _kind: string
          _round_id: string
          _sweep_id: string
        }
        Returns: boolean
      }
      claim_workshop_step: {
        Args: { _id: string; _step: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reserve_provider_call: { Args: { _provider: string }; Returns: boolean }
      save_sweep_result: {
        Args: { _id: string; _result: Json; _status: string }
        Returns: undefined
      }
      start_sweep: {
        Args: { _is_example: boolean; _pile: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
    },
  },
} as const
