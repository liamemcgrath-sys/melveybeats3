export type Database = {
  public: {
    Tables: {
      beats: {
        Row: {
          id: string;
          title: string | null;
          price: number | string | null;
          url: string | null;              // legacy preview URL
          audio_url: string | null;        // preview audio URL
          preview_url: string | null;      // ⭐ NEW FIELD
          cover_url: string | null;
          fullAudioPath: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title?: string | null;
          price?: number | null;
          url?: string | null;
          audio_url?: string | null;
          preview_url?: string | null;     // ⭐ NEW FIELD
          cover_url?: string | null;
          fullAudioPath?: string | null;
          created_at?: string | null;
        };
        Update: {
          title?: string | null;
          price?: number | null;
          url?: string | null;
          audio_url?: string | null;
          preview_url?: string | null;     // ⭐ NEW FIELD
          cover_url?: string | null;
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
};
