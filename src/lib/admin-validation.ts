import { CheckoutError } from "./checkout";
import type { Beat, Genre } from "./catalog";
export function validateBeat(body: Record<string, unknown>): Omit<Beat, "id"> {
  const text = (key: string, max: number, min = 1) => { const value = body[key]; if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) throw new CheckoutError(`Check the beat ${key}.`); return value.trim(); };
  const number = (key: string, min: number, max: number, integer = false) => { const value = body[key]; if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new CheckoutError(`Check the beat ${key}.`); return value; };
  const genre = text("genre", 10) as Genre;
  if (!["Melodic", "Trap", "R&B", "Dark"].includes(genre)) throw new CheckoutError("Choose a supported style.");
  const price = number("price", 100, 100000, true), exclusive = number("exclusive", 100, 100000, true);
  if (exclusive < price) throw new CheckoutError("The exclusive price must be at least the standard price.");
  if (!Array.isArray(body.tags) || body.tags.length > 10 || body.tags.some(value => typeof value !== "string" || value.length > 30)) throw new CheckoutError("Use up to 10 short tags.");
  const asset = (key: string) => { const value = body[key]; if (value === null || value === undefined || value === "") return null; if (typeof value !== "string" || !/^[a-f0-9-]{36}\.(mp3|wav|ogg|png|jpg|webp)$/.test(value)) throw new CheckoutError("Select a valid uploaded file."); return value; };
  return { title: text("title", 100, 2), genre, bpm: number("bpm", 40, 240, true), key: text("key", 30), tags: [...new Set(body.tags.map(value => String(value).trim()).filter(Boolean))], price, exclusive, duration: number("duration", .5, 1800), previewKey: asset("previewKey"), downloadKey: asset("downloadKey"), artworkKey: asset("artworkKey") };
}
export function detectUpload(bytes: Uint8Array, kind: string) {
  const text = (start: number, end: number) => new TextDecoder().decode(bytes.slice(start, end));
  if (kind === "art") {
    if (bytes.length > 8 && bytes[0] === 137 && text(1,4) === "PNG") return { mime: "image/png", extension: "png" };
    if (bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { mime: "image/jpeg", extension: "jpg" };
    if (text(0,4) === "RIFF" && text(8,12) === "WEBP") return { mime: "image/webp", extension: "webp" };
    throw new CheckoutError("Artwork must be a PNG, JPG, or WebP image.");
  }
  if (bytes.length >= 44 && text(0,4) === "RIFF" && text(8,12) === "WAVE") return { mime: "audio/wav", extension: "wav" };
  if (bytes.length > 128 && (text(0,3) === "ID3" || (bytes[0] === 255 && (bytes[1] & 224) === 224))) return { mime: "audio/mpeg", extension: "mp3" };
  if (bytes.length > 32 && text(0,4) === "OggS") return { mime: "audio/ogg", extension: "ogg" };
  throw new CheckoutError("Audio must be a valid MP3, WAV, or OGG file.");
}
export function byteRange(header: string | null, size: number) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) throw new CheckoutError("Range not satisfiable.", 416);
  let start: number, end: number;
  if (!match[1]) { const suffix = Number(match[2]); if (!Number.isSafeInteger(suffix) || suffix < 1) throw new CheckoutError("Range not satisfiable.", 416); start = Math.max(0, size-suffix); end = size-1; }
  else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size-1) : size-1; }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) throw new CheckoutError("Range not satisfiable.", 416);
  return { offset: start, length: end-start+1 };
}
