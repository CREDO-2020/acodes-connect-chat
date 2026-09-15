export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; full_name: string; username: string | null; avatar_url: string | null; class_name: string | null; bio: string | null; phone: string | null; is_online: boolean; last_seen: string | null; created_at: string; updated_at: string }; Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }; Update: Partial<Database['public']['Tables']['profiles']['Row']>; Relationships: [] };
      user_roles: { Row: { id: string; user_id: string; role: string }; Insert: { id?: string; user_id: string; role: string }; Update: Partial<Database['public']['Tables']['user_roles']['Row']>; Relationships: [] };
      conversations: { Row: { id: string; kind: string; title: string | null; created_by: string | null; created_at: string }; Insert: { id?: string; kind?: string; title?: string | null; created_by?: string | null; created_at?: string }; Update: Partial<Database['public']['Tables']['conversations']['Row']>; Relationships: [] };
      conversation_members: { Row: { conversation_id: string; user_id: string; joined_at: string; last_read_at: string | null }; Insert: { conversation_id: string; user_id: string; joined_at?: string; last_read_at?: string | null }; Update: Partial<Database['public']['Tables']['conversation_members']['Row']>; Relationships: [] };
      messages: { Row: { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; edited_at: string | null; deleted_at: string | null }; Insert: { id?: string; conversation_id: string; sender_id: string; body: string; created_at?: string; edited_at?: string | null; deleted_at?: string | null }; Update: Partial<Database['public']['Tables']['messages']['Row']>; Relationships: [] };
      message_receipts: { Row: { message_id: string; user_id: string; read_at: string }; Insert: { message_id: string; user_id: string; read_at?: string }; Update: Partial<Database['public']['Tables']['message_receipts']['Row']>; Relationships: [] };
      typing_status: { Row: { conversation_id: string; user_id: string; is_typing: boolean; updated_at: string }; Insert: { conversation_id: string; user_id: string; is_typing?: boolean; updated_at?: string }; Update: Partial<Database['public']['Tables']['typing_status']['Row']>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: { get_or_create_direct_conversation: { Args: { other_user: string }; Returns: string } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
