export type Beat = {
  id: string;
  title: string | null;
  price: number | string | null;
  url?: string | null;
  audio_url?: string | null;   // preview
  cover_url?: string | null;
  fullAudioPath?: string | null; // ⭐ full beat file path
};

export type DisplayBeat = {
  id: string;
  title: string;
  price: number;
  audioUrl: string;        // preview
  coverUrl?: string;
  fullAudioPath: string;   // ⭐ full beat file path
};

export function toDisplayBeat(beat: Beat): DisplayBeat {
  const price = Number(beat.price ?? 0);

  return {
    id: beat.id,
    title: beat.title?.trim() || "Untitled",
    price: Number.isFinite(price) ? price : 0,
    audioUrl: beat.audio_url || beat.url || "",
    coverUrl: beat.cover_url || undefined,
    fullAudioPath: beat.fullAudioPath || "", // ⭐ required for checkout + download
  };
}
