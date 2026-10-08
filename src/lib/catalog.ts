export type Genre = "Melodic" | "Trap" | "R&B" | "Dark";
export type License = "standard" | "exclusive";
export type CartItem = { beatId: string; license: License };
export type Beat = { id: string; title: string; genre: Genre; bpm: number; key: string; tags: string[]; price: number; exclusive: number; duration: number; previewKey?: string | null; downloadKey?: string | null; artworkKey?: string | null; isDemo?: boolean; archived?: boolean; sold?: boolean };
export const beats: Beat[] = [];
export const beatById = new Map(beats.map(beat => [beat.id, beat]));
export const licenseNames = { standard: "Standard", exclusive: "Exclusive", unlimited: "Unlimited (legacy)" } as const;
export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
export const priceFor = (beat: Beat, license: License) => license === "exclusive" ? beat.exclusive : beat.price;
export const mediaUrl = (key: string) => `/api/media/${encodeURIComponent(key)}`;
export const artwork = (beat: Beat) => beat.artworkKey ? mediaUrl(beat.artworkKey) : beat.isDemo ? `/art/${beat.id}.svg` : "/art/featured.svg";
export const audioUrl = (beat: Beat) => beat.previewKey ? mediaUrl(beat.previewKey) : "";
export const downloadUrl = (beat: Beat) => beat.downloadKey ? `${mediaUrl(beat.downloadKey)}?download=1` : audioUrl(beat);
export const formatTime = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, "0")}`;
export function filterBeats(query: string, genre: string, sort: string, catalog: Beat[] = beats) {
  const normalized = query.trim().toLowerCase().replaceAll("♯", "#");
  const result = catalog.filter(beat => (genre === "All beats" || beat.genre === genre) && `${beat.title} ${beat.genre} ${beat.bpm} bpm ${beat.key} ${beat.tags.join(" ")}`.toLowerCase().replaceAll("♯", "#").includes(normalized));
  if (sort === "price") result.sort((a, b) => a.price - b.price);
  if (sort === "bpm") result.sort((a, b) => a.bpm - b.bpm);
  return result;
}
export function parseCart(value: string | null, catalog: Beat[] = beats): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]"); if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>(), allowed = new Set(catalog.map(beat => beat.id));
    return parsed.flatMap(item => {
      if (!item || typeof item !== "object" || !allowed.has(item.beatId) || !["standard", "exclusive", "unlimited"].includes(item.license) || seen.has(item.beatId)) return [];
      seen.add(item.beatId); return [{ beatId: item.beatId, license: item.license === "unlimited" ? "exclusive" : item.license } as CartItem];
    }).slice(0, 50);
  } catch { return []; }
}
export const cartTotal = (cart: CartItem[], catalog: Beat[] = beats) => cart.reduce((sum, item) => { const beat = catalog.find(beat => beat.id === item.beatId); return sum + (beat ? priceFor(beat, item.license) : 0); }, 0);
export function addToCart(cart: CartItem[], beatId: string, catalog: Beat[] = beats): CartItem[] {
  if (!catalog.some(beat => beat.id === beatId) || cart.some(item => item.beatId === beatId)) return cart;
  return [...cart, { beatId, license: "standard" }];
}
export const removeFromCart = (cart: CartItem[], beatId: string) => cart.filter(item => item.beatId !== beatId);
export function changeLicense(cart: CartItem[], beatId: string, license: License) {
  if (license !== "standard" && license !== "exclusive") return cart;
  return cart.map(item => item.beatId === beatId ? { ...item, license } : item);
}
export type ReceiptItem = { beatId: string; license: License | "unlimited"; title: string; price: number; artworkUrl?: string; previewUrl?: string; downloadUrl?: string; downloadKey?: string | null; bpm?: number; key?: string; duration?: number; genre?: Genre };
export type Receipt = { id: string; email: string; items: ReceiptItem[]; total: number; token: string; createdAt: string; mode: "live" | "test" };
