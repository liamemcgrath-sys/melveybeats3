import type { DisplayBeat } from "@/types";
export type Beat = {
  id: string;
  title: string | null;
  price: number | string | null;
  url?: string | null;
  audio_url?: string | null;   // preview
  cover_url?: string | null;
  fullAudioPath?: string | null; // full beat file path
};


export function toDisplayBeat(beat: Beat): DisplayBeat {
  const price = Number(beat.price ?? 0);

  return {
    id: beat.id,
    title: beat.title?.trim() || "Untitled",
    price: Number.isFinite(price) ? price : 0,
    audio_url: beat.audio_url || beat.url || "",   // MUST be audio_url
    fullAudioPath: beat.fullAudioPath || "",       // MUST match DB + DisplayBeat
    created_at: undefined,                         // optional
  };
}

