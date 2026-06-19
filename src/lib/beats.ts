import { Database } from "./database";

export function toDisplayBeat(beat: Database["public"]["Tables"]["beats"]["Row"]) {
  return {
    id: beat.id,
    title: beat.title,
    price: beat.price,
    audio_url: beat.audio_url,        // correct
    fullAudioPath: beat.fullAudioPath,
    cover_url: beat.cover_url,
    created_at: beat.created_at,
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

