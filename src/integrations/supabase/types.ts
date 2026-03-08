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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_episodic_summaries: {
        Row: {
          agent_id: string
          created_at: string
          decisions_made: string[] | null
          emotional_tone: string | null
          id: string
          key_topics: string[] | null
          message_count: number | null
          session_id: string | null
          summary: string
          time_range_end: string | null
          time_range_start: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          decisions_made?: string[] | null
          emotional_tone?: string | null
          id?: string
          key_topics?: string[] | null
          message_count?: number | null
          session_id?: string | null
          summary: string
          time_range_end?: string | null
          time_range_start?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          decisions_made?: string[] | null
          emotional_tone?: string | null
          id?: string
          key_topics?: string[] | null
          message_count?: number | null
          session_id?: string | null
          summary?: string
          time_range_end?: string | null
          time_range_start?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_files: {
        Row: {
          agent_id: string
          created_at: string
          file_content: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          owner_id: string | null
          uploaded_by: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          file_content: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          owner_id?: string | null
          uploaded_by: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          file_content?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          owner_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_files_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_long_term_memory: {
        Row: {
          access_count: number | null
          agent_id: string
          created_at: string
          id: string
          importance: number | null
          last_accessed_at: string | null
          memory_key: string
          memory_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          agent_id: string
          created_at?: string
          id?: string
          importance?: number | null
          last_accessed_at?: string | null
          memory_key: string
          memory_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          agent_id?: string
          created_at?: string
          id?: string
          importance?: number | null
          last_accessed_at?: string | null
          memory_key?: string
          memory_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_memory: {
        Row: {
          agent_id: string
          content: Json
          created_at: string
          id: string
          memory_type: string
          owner_id: string | null
        }
        Insert: {
          agent_id: string
          content: Json
          created_at?: string
          id?: string
          memory_type: string
          owner_id?: string | null
        }
        Update: {
          agent_id?: string
          content?: Json
          created_at?: string
          id?: string
          memory_type?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          base_model: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean
          max_tokens: number | null
          name: string
          owner_id: string | null
          published: boolean | null
          slug: string
          system_prompt: string | null
          tags: string[] | null
          temperature: number | null
          updated_at: string
          visibility: Database["public"]["Enums"]["agent_visibility"] | null
          voice_id: string | null
        }
        Insert: {
          base_model?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean
          max_tokens?: number | null
          name: string
          owner_id?: string | null
          published?: boolean | null
          slug: string
          system_prompt?: string | null
          tags?: string[] | null
          temperature?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["agent_visibility"] | null
          voice_id?: string | null
        }
        Update: {
          base_model?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          max_tokens?: number | null
          name?: string
          owner_id?: string | null
          published?: boolean | null
          slug?: string
          system_prompt?: string | null
          tags?: string[] | null
          temperature?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["agent_visibility"] | null
          voice_id?: string | null
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      user_personas: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          preferences: Json | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_agent_owner: { Args: { a_id: string }; Returns: boolean }
    }
    Enums: {
      agent_visibility: "private" | "unlisted" | "public"
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
      agent_visibility: ["private", "unlisted", "public"],
    },
  },
} as const
