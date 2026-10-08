import { beats, priceFor, artwork, audioUrl, downloadUrl, type Beat, type CartItem, type Receipt } from "./catalog";
export class CheckoutError extends Error { constructor(message: string, public status = 400) { super(message); } }
export type CheckoutInput = { email: string; items: CartItem[]; idempotencyKey: string; payment?: "approve" | "decline" };
export const validToken = (token: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(token);
export function validateCheckout(value: unknown): CheckoutInput {
  if (!value || typeof value !== "object") throw new CheckoutError("Please check your order details.");
  const body = value as Record<string, unknown>;
  if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) throw new CheckoutError("Enter a valid email address.");
  if (body.acceptedTerms !== true) throw new CheckoutError("Please accept the license terms.");
  if (typeof body.idempotencyKey !== "string" || !validToken(body.idempotencyKey)) throw new CheckoutError("Refresh checkout and try again.");
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) throw new CheckoutError("Add at least one beat to your cart (up to 50).");
  const seen = new Set<string>();
  const items: CartItem[] = body.items.map(item => {
    if (!item || typeof item !== "object" || typeof item.beatId !== "string" || !/^[a-z0-9-]{1,80}$/.test(item.beatId) || !["standard", "exclusive"].includes(item.license) || seen.has(item.beatId)) throw new CheckoutError("Your cart contains an invalid or duplicate item.");
    seen.add(item.beatId); return { beatId: item.beatId, license: item.license };
  });
  return { email: body.email.trim().toLowerCase(), items, idempotencyKey: body.idempotencyKey, payment: undefined };
}
export function createReceipt(input: CheckoutInput, catalog: Beat[] = beats): Receipt {
  const items = input.items.map(item => {
    const beat = catalog.find(beat => beat.id === item.beatId);
    if (!beat || beat.archived || beat.sold) throw new CheckoutError("A beat in your cart is no longer available. Update your cart and try again.", 409);
    return { ...item, title: beat.title, price: priceFor(beat, item.license), artworkUrl: artwork(beat), previewUrl: audioUrl(beat), downloadUrl: downloadUrl(beat), downloadKey: beat.downloadKey ?? null, bpm: beat.bpm, key: beat.key, duration: beat.duration, genre: beat.genre };
  });
  return { id: `MV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, token: crypto.randomUUID(), email: input.email, items, total: items.reduce((sum, item) => sum + item.price, 0), createdAt: new Date().toISOString(), mode: "live" };
}
export const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export function siteOrigin(request:Request){
  const host=(request.headers.get("host")||new URL(request.url).host).toLowerCase();
  if(/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))return `http://${host}`;
  if(host==="www.melvybeats.com"||host==="melvybeats.com"||/^[a-z0-9-]+\.vercel\.app$/.test(host))return `https://${host}`;
  return "https://www.melvybeats.com";
}
export function checkOrigin(request: Request) { const origin = request.headers.get("origin"); if ((origin && origin !== siteOrigin(request)) || request.headers.get("sec-fetch-site") === "cross-site") throw new CheckoutError("This request is not allowed.", 403); }
export async function readJson(request: Request) { const text = await request.text(); if (text.length > 16000) throw new CheckoutError("This request is too large.", 413); try { const value=JSON.parse(text); if(!value || typeof value!=="object" || Array.isArray(value))throw new Error("Invalid object"); return value as Record<string, unknown>; } catch { throw new CheckoutError("Please check your details."); } }
export function errorResponse(error: unknown) { return error instanceof CheckoutError ? json({ error: error.message }, error.status) : json({ error: "This action could not finish. Please try again." }, 503); }
