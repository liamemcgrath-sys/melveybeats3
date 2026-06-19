import type { Database } from "./database";
import type { DisplayBeat } from "@/types";

export function toDisplayBeat(
  beat: Database["public"]["Tables"]["beats"]["Row"]
): DisplayBeat {
  const price = Number(beat.price ?? 0);

  return {
    id: beat.id,
    title: beat.title?.trim() || "Untitled",
    price: Number.isFinite(price) ? price : 0,
    audio_url: beat.audio_url || "",
    fullAudioPath: beat.fullAudioPath || "",
    cover_url: beat.cover_url || undefined,
    created_at: beat.created_at ?? undefined,
  };
}
