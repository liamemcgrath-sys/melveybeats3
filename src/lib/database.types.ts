export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      beats: {
        Row: {
          id: number;
          title: string | null;
          price: number | null;
          audio_url: string | null;
          cover_url: string | null;
          fullAudioPath: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          title?: string | null;
          price?: number | null;
          audio_url?: string | null;
          cover_url?: string | null;
          fullAudioPath?: string | null;
          created_at?: string | null;
        };
        Update: {
          title?: string | null;
          price?: number | null;
          audio_url?: string | null;
          cover_url?: string | null;
          fullAudioPath?: string | null;
        };
        Relationships: [];
      };

      free_beat: {
        Row: {
          id: number;                     // ✅ REQUIRED
          title: string | null;
          audio_url: string | null;
          fullAudioPath: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;                    // ✅ REQUIRED
          title?: string | null;
          audio_url?: string | null;
          fullAudioPath?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;                    // optional for updates
          title?: string | null;
          audio_url?: string | null;
          fullAudioPath?: string | null;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
