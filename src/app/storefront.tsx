"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { money, priceFor, artwork, audioUrl, filterBeats, parseCart, cartTotal, addToCart, removeFromCart, changeLicense, formatTime, licenseNames, type Beat, type CartItem, type License, type Receipt } from "@/lib/catalog";
import AccountPanel, { type AccountData } from "./account-panel";
import { Icon, Wordmark } from "./components/brand";
import { AudioController, type PlayerState } from "@/lib/audio-controller";

const initialPlayer: PlayerState = { index: -1, playing: false, loading: false, time: 0, duration: 0, volume: 0.75, muted: false, error: "" };
const genres = ["All beats", "Melodic", "Trap", "R&B", "Dark"];
const CART_KEY = "melvey.cart.v1";
const RECEIPT_KEY = "melvey.lastReceipt.v1";

function BeatCard({ beat, number, active, playing, inCart, onPlay, onAdd }: { beat: Beat; number: number; active: boolean; playing: boolean; inCart: boolean; onPlay: () => void; onAdd: () => void }) {
  return <article className={`beat-card ${active ? "is-active" : ""}`}>
    <div className="cover-wrap">
      <img src={artwork(beat)} alt={`${beat.title} cover artwork`} width="640" height="440" loading="lazy" />
      <span className="cover-label">{beat.genre}</span>
      <button className="cover-play" aria-label={`${active && playing ? "Pause" : "Play"} ${beat.title}`} onClick={onPlay}><Icon name={active && playing ? "pause" : "play"} size={24} /></button>
      <span className="cover-time">{active && playing ? <><i className="eq"><i /><i /><i /></i> PLAYING</> : `${formatTime(beat.duration)} PREVIEW`}</span>
    </div>
    <div className="card-body">
      <div className="card-heading"><h3>{beat.title}</h3><span className="track-number">{String(number).padStart(2, "0")}</span></div>
      <p className="beat-meta">{beat.bpm} BPM <span>·</span> {beat.key}</p>
      <div className="card-bottom"><span className="starting-price"><small>From</small> {money(beat.price)}</span><button className={`add-button ${inCart ? "added" : ""}`} onClick={onAdd} aria-label={inCart ? `View ${beat.title} in cart` : `Add ${beat.title} to cart for ${money(beat.price)}`}><Icon name={inCart ? "check" : "cart"} size={16} />{inCart ? "In cart" : "Add to cart"}</button></div>
    </div>
  </article>;
}

export default function Storefront({ initialBeats, initialFeaturedId }: {initialBeats: Beat[]; initialFeaturedId: string | null}) {
  const [beats, setBeats] = useState(initialBeats);
  const [featuredId, setFeaturedId] = useState(initialFeaturedId);
  const beatById = new Map(beats.map(beat => [beat.id,beat]));
  const featuredIndex = Math.max(0, beats.findIndex(beat => beat.id === featuredId));
  const featured = beats[featuredIndex];
  const [account, setAccount] = useState<AccountData | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const afterAccount = useRef(false);
  const refreshAccount = useCallback(async () => {
    try { const response = await fetch("/api/account", {signal:AbortSignal.timeout(15000)}); if(response.ok) { const data = await response.json() as AccountData; setAccount(data); return data; } setAccount(null); }
    catch { setAccount(null); } finally { setAccountLoading(false); }
    return null;
  }, []);
  const refreshCatalog = useCallback(async () => { const response = await fetch("/api/catalog"); if(!response.ok) return; const data = await response.json() as {beats:Beat[];featuredId:string|null}; setBeats(data.beats); setFeaturedId(data.featuredId); setCart(items => parseCart(JSON.stringify(items), data.beats)); }, []);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All beats");
  const [sort, setSort] = useState("featured");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [player, setPlayer] = useState(initialPlayer);
  const controller = useRef<AudioController | null>(null);
  const [panel, setPanel] = useState<"cart" | "checkout" | "receipt" | "account" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [toast, setToast] = useState("");
  const [email, setEmail] = useState("");
  
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [lastReceipt, setLastReceipt] = useState("");
  const idempotency = useRef("");

  const openReceipt = useCallback(async (token: string) => {
    setBusy(true); setPanel("receipt"); setReceipt(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(15000) });
      const data = await response.json() as { order?: Receipt; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "Could not load your receipt.");
      setReceipt(data.order);
      const url = new URL(window.location.href); url.searchParams.set("order", token); window.history.replaceState(null, "", url);
    } catch (error) { setPanel(null); setToast(error instanceof Error ? error.message : "Could not load your receipt."); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    try { setCart(parseCart(localStorage.getItem(CART_KEY), initialBeats)); setLastReceipt(localStorage.getItem(RECEIPT_KEY) || ""); } catch { /* Storage can be unavailable in private browsing. */ }
    setHydrated(true);
    const audio = new Audio(); audio.preload = "none";
    const instance = new AudioController(audio, initialBeats); controller.current = instance;
    const unsubscribe = instance.subscribe(setPlayer);
    const order = new URL(window.location.href).searchParams.get("order");
    if (order) void openReceipt(order);
    else if (new URL(window.location.href).searchParams.get("account")) setPanel("account");
    void refreshAccount();
    return () => { unsubscribe(); instance.destroy(); controller.current = null; };
  }, [openReceipt, refreshAccount, initialBeats]);
  useEffect(() => { controller.current?.setPlaylist(beats); }, [beats]);
  useEffect(() => { if (hydrated) { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* The cart still works in memory. */ } } }, [cart, hydrated]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (panel && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!panel && dialog.current?.open) dialog.current.close();
  }, [panel]);

  const visible = filterBeats(query, genre, sort, beats);
  const total = cartTotal(cart, beats);
  const pricingRange = (field: "price" | "exclusive") => { const prices=beats.map(beat=>beat[field]); if(!prices.length)return field==="price"?"$29–39":"$79–99";const min=Math.min(...prices),max=Math.max(...prices);return min===max?money(min):`${money(min)}–${money(max).replace("$","")}`; };
  const current = player.index >= 0 ? beats[player.index] : null;
  function closePanel() {
    if (busy) return;
    setPanel(null); setCheckoutError("");
    const url = new URL(window.location.href); url.searchParams.delete("order"); url.searchParams.delete("account"); window.history.replaceState(null, "", url);
  }
  function add(beat: Beat) {
    if (cart.some(item => item.beatId === beat.id)) { setPanel("cart"); return; }
    setCart(items => addToCart(items, beat.id, beats)); setToast(`${beat.title} added to your cart`);
  }
  function beginCheckout() {
    if (!cart.length) return;
    if (!account?.profile) { afterAccount.current = true; setPanel("account"); return; }
    setEmail(account.identity.email);
    launchCheckout();
  }
  function launchCheckout() {
    idempotency.current = crypto.randomUUID(); setAccepted(false); setCheckoutError(""); setPanel("checkout");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setCheckoutError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", signal: AbortSignal.timeout(15000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, items: cart, acceptedTerms: accepted, idempotencyKey: idempotency.current }) });
      const data = await response.json() as {url?:string;error?:string};
      if(!response.ok || !data.url){if(response.status===409)void refreshCatalog();throw new Error(data.error || "Checkout could not start.");}
      const checkoutUrl=new URL(data.url);if(checkoutUrl.protocol!=="https:"||checkoutUrl.hostname!=="checkout.stripe.com")throw new Error("Invalid checkout destination.");
      window.location.assign(data.url);
    } catch (error) { setCheckoutError(error instanceof TypeError || (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) ? "Connection interrupted. Your cart is saved; please try again." : error instanceof Error ? error.message : "Checkout could not finish. Your cart is saved."); }
    finally { setBusy(false); }
  }
  function receiptText(order: Receipt) {
    return `MELVEY — ${order.mode==="test"?"TEST ":""}RECEIPT\n${order.id}\n${order.createdAt}\n${order.email}\n\n${order.items.map(item=>`${item.title} / ${licenseNames[item.license]} / ${money(item.price)}`).join("\n")}\n\nTotal: ${money(order.total)} USD\nLicense terms: https://www.melvybeats.com/licenses\n${order.mode==="test"?"Stripe test payment. No money charged or commercial rights granted.":"Payment verified. License terms melvey-v1 apply."}\n`;

  }

  return <div className={`site-shell ${current ? "with-player" : ""}`}>
    <div className="preview-banner"><Icon name="shield" size={14} /><span>Independent beats</span><i /> Secure checkout with Stripe.</div>
    <header className="site-header wrap"><a href="#" aria-label="Melvey home"><Wordmark /></a><nav aria-label="Main navigation"><a href="#beats">Beats</a><a href="#licenses">Licenses</a><a href="#how-it-works">How it works</a></nav><div className="header-actions"><button className="account-button" onClick={() => { afterAccount.current=false; setPanel("account"); }}>{account?.profile ? "My beats" : "Log in / Sign up"}</button><button className="cart-button" onClick={() => setPanel("cart")} aria-label={`Open cart, ${cart.length} ${cart.length === 1 ? "beat" : "beats"}`}><Icon name="cart" /><span>Cart</span><b>{cart.length}</b></button></div></header>
    <main>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow"><span className="status-dot" /> INDEPENDENT SOUND. UNLIMITED POSSIBILITIES.</p><h1 id="hero-title">Your next sound<br /><span>Starts here.</span></h1><p className="hero-description">Find the beat that feels like you. Melodic textures,<br className="desktop-break" /> heavy drums, and room for your own voice.</p><div className="hero-actions"><a className="primary-button" href="#beats">Explore beats <Icon name="arrow" /></a><button className="hero-listen" disabled={!featured} onClick={() => void controller.current?.select(featuredIndex)}><Icon name={player.index === featuredIndex && player.playing ? "pause" : "play"} size={18} />{player.index === featuredIndex && player.playing ? "Pause featured" : "Hear the latest"}</button></div><div className="hero-details"><span><Icon name="check" size={15} /> Audio previews</span><span><Icon name="check" size={15} /> Clear license tiers</span><span><Icon name="check" size={15} /> Your account library</span></div></div>
        <div className="hero-visual"><span className="orbital orbital-one" /><span className="orbital orbital-two" /><div className="featured-art"><img src={featured?.id === "night-drive" ? "/art/featured.svg" : featured ? artwork(featured) : "/art/featured.svg"} alt="Featured beat cover artwork" width="600" height="600" /><span className="featured-tag">FEATURED BEAT <span>{String(featuredIndex+1).padStart(3,"0")}</span></span><div className="featured-info"><div><small>MELVEY</small><strong>{featured?.title || "New sound soon"}</strong><span>{featured ? `${featured.bpm} BPM · ${featured.key}` : "Catalog coming soon"}</span></div><button disabled={!featured} aria-label={!featured ? "Featured preview coming soon" : player.index === featuredIndex && player.playing ? `Pause featured ${featured.title}` : `Play featured ${featured.title}`} onClick={() => void controller.current?.select(featuredIndex)}><Icon name={player.index === featuredIndex && player.playing ? "pause" : "play"} size={26} /></button></div></div><span className="visual-caption">MADE FOR THE MOMENT YOU PRESS PLAY.</span></div>
      </section>
      <div className="catalog-divider wrap"><span>THE CATALOG</span><span>{String(beats.length).padStart(2,"0")} BEATS <span className="line" /> THE MELVEY COLLECTION</span></div>
      <section className="catalog wrap" id="beats" aria-labelledby="beats-title">
        <div className="section-heading"><div><p className="eyebrow muted">FIND YOUR POCKET</p><h2 id="beats-title">Beats with a feeling<span>.</span></h2></div></div>
        <div className="browse-tools"><div className="search-box"><Icon name="search" /><label className="sr-only" htmlFor="beat-search">Search by title, mood, key, or BPM</label><input id="beat-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title, mood, key, or BPM…" />{query ? <button className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}><Icon name="close" size={17} /></button> : null}</div><label className="sort-box"><span>Sort by</span><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort beats"><option value="featured">Featured</option><option value="price">Price: low to high</option><option value="bpm">BPM: low to high</option></select></label></div>
        <div className="filter-row"><div className="filters" role="group" aria-label="Filter beats by style">{genres.map(value => <button key={value} aria-pressed={genre === value} className={genre === value ? "selected" : ""} onClick={() => setGenre(value)}>{value}</button>)}</div><span className="result-count" aria-live="polite">{visible.length} {visible.length === 1 ? "beat" : "beats"}</span></div>
        {visible.length ? <div className="beat-grid">{visible.map(beat => <BeatCard key={beat.id} beat={beat} number={beats.indexOf(beat)+1} active={current?.id === beat.id} playing={player.playing} inCart={cart.some(item => item.beatId === beat.id)} onPlay={() => void controller.current?.select(beats.indexOf(beat))} onAdd={() => add(beat)} />)}</div> : <div className="empty-results"><Icon name="search" size={32} /><h3>No beats in this pocket yet.</h3><p>{beats.length?"Try a different title, mood, or style.":"New releases are coming soon. Check back for the next collection."}</p><button className="primary-button" onClick={() => { setQuery(""); setGenre("All beats"); }}>Reset filters</button></div>}
        <p className="catalog-note"><span className="status-dot" /> Your Melvey collection. New releases coming soon.</p>
      </section>
      <section className="license-section wrap" id="licenses" aria-labelledby="licenses-title"><div className="license-intro"><p className="eyebrow muted">YOUR BEAT. YOUR NEXT MOVE.</p><h2 id="licenses-title">Simple pricing.<br />Room to grow.</h2><p>Choose your tier in the cart. Every beat has its price up front.</p><span className="small-note"><a href="/licenses">Read the license terms.</a><br />Exclusive sales honor earlier standard licenses.</span></div><div className="license-card"><p>STANDARD</p><h3>For your next release.</h3><div className="license-price">{pricingRange("price")} <span>/ beat</span></div><ul><li><Icon name="check" size={17} /> Audio download</li><li><Icon name="check" size={17} /> Non-exclusive license</li><li><Icon name="check" size={17} /> Up to 50,000 streams</li></ul><a href="#beats">Find a beat <Icon name="arrow" size={17} /></a></div><div className="license-card premium"><p>EXCLUSIVE</p><h3>One beat. One artist.</h3><div className="license-price">{pricingRange("exclusive")} <span>/ beat</span></div><ul><li><Icon name="check" size={17} /> Audio download</li><li><Icon name="check" size={17} /> Exclusive license</li><li><Icon name="check" size={17} /> Removed from sale after purchase</li></ul><a href="#beats">Find a beat <Icon name="arrow" size={17} /></a></div></section>
      <section className="how-section wrap" id="how-it-works"><div className="section-heading"><h2>From first listen to first take.</h2><span className="eyebrow muted">THREE SIMPLE STEPS</span></div><div className="steps"><div><span>01</span><h3>Find your sound</h3><p>Explore the catalog and preview any beat. Your player follows you while you browse.</p></div><div><span>02</span><h3>Choose your license</h3><p>Add a beat to your cart, pick a tier, and review the price before checkout.</p></div><div><span>03</span><h3>Make it yours</h3><p>Complete your purchase and download the audio files from your account library.</p></div></div></section>
    </main>
    <footer className="site-footer wrap"><div><Wordmark /><p>Independent beats. Your own direction.</p></div><div className="footer-right"><span>melvybeats.com</span>{lastReceipt ? <button onClick={() => void openReceipt(lastReceipt)}>View last receipt <Icon name="arrow" size={15} /></button> : <span>© 2026 Melvey</span>}<a className="studio-entry" href="/studio">Studio</a></div></footer>
    <div className={`toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">{toast ? <><Icon name="check" size={17} />{toast}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast("")}><Icon name="close" size={16} /></button></> : null}</div>
    {current ? <aside className="player" aria-label="Beat preview player"><div className="player-inner wrap"><div className="player-track"><img src={artwork(current)} alt="" width="48" height="48" /><div><strong>{current.title}</strong><span>Melvey · {current.bpm} BPM</span></div></div><div className="player-center"><div className="playback-buttons"><button className="icon-button" aria-label="Previous beat" onClick={() => void controller.current?.move(-1)}><Icon name="previous" size={17} /></button><button className="player-play" aria-label={player.playing ? "Pause preview" : "Play preview"} onClick={() => void controller.current?.toggle()}><Icon name={player.playing ? "pause" : "play"} size={19} /></button><button className="icon-button" aria-label="Next beat" onClick={() => void controller.current?.move(1)}><Icon name="next" size={17} /></button></div><div className="seek-row"><span>{formatTime(player.time)}</span><input type="range" min="0" max={player.duration || 1} step="0.1" value={Math.min(player.time, player.duration)} aria-label="Seek preview" onChange={event => controller.current?.seek(Number(event.target.value))} /><span>{formatTime(player.duration)}</span></div></div><div className="volume-control"><button className="icon-button" aria-label={player.muted ? "Unmute preview" : "Mute preview"} onClick={() => controller.current?.mute()}><Icon name={player.muted || player.volume === 0 ? "muted" : "volume"} size={19} /></button><input type="range" min="0" max="1" step="0.01" value={player.muted ? 0 : player.volume} aria-label="Preview volume" onChange={event => controller.current?.setVolume(Number(event.target.value))} /><span className="preview-indicator">PREVIEW</span></div></div>{player.error ? <p className="player-error" role="alert">{player.error}</p> : null}</aside> : null}
    <dialog ref={dialog} className="cart-dialog" aria-label={panel === "account" ? "Melvey account and my beats" : panel === "checkout" ? "Checkout" : panel === "receipt" ? "Order receipt" : "Your cart"} onCancel={event => { event.preventDefault(); closePanel(); }} onClick={event => { if (event.target === event.currentTarget) closePanel(); }}>
      <div className="panel-inner"><div className="panel-header"><div><p className="eyebrow muted">MELVEY STORE</p><h2>{panel === "account" ? "Your account" : panel === "checkout" ? "Checkout" : panel === "receipt" ? "Your order" : "Your cart"}{panel === "cart" ? <span> ({cart.length})</span> : null}</h2></div><button className="icon-button" aria-label="Close cart or checkout" disabled={busy} onClick={closePanel}><Icon name="close" size={23} /></button></div>
      {panel === "cart" ? <>
        {cart.length ? <><p className="panel-subtitle">A little closer to your next release.</p><div className="cart-items">{cart.map(item => { const beat = beatById.get(item.beatId)!; return <div className="cart-item" key={item.beatId}><img src={artwork(beat)} alt="" width="80" height="80" /><div className="cart-item-detail"><h3>{beat.title}</h3><span>{beat.bpm} BPM · {beat.key}</span><label><span className="sr-only">License for {beat.title}</span><select value={item.license} onChange={event => setCart(items => changeLicense(items, item.beatId, event.target.value as License))}><option value="standard">Standard · {money(beat.price)}</option><option value="exclusive">Exclusive · {money(beat.exclusive)}</option></select></label></div><div className="cart-item-end"><strong>{money(priceFor(beat, item.license))}</strong><button className="icon-button" aria-label={`Remove ${beat.title} from cart`} onClick={() => setCart(items => removeFromCart(items, item.beatId))}><Icon name="trash" size={17} /></button></div></div>; })}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(total)}</strong></div><div className="total-row"><span>Order total <small>USD</small></span><strong>{money(total)}</strong></div><p>Your final price is shown before payment.</p><button className="primary-button wide" onClick={beginCheckout}>Continue to checkout <Icon name="arrow" size={19} /></button><button className="text-button wide" onClick={closePanel}>Keep browsing</button></div></> : <div className="empty-cart"><span><Icon name="cart" size={34} /></span><h3>Your next sound is waiting.</h3><p>Preview a few beats, then add your favorites here.</p><button className="primary-button" onClick={closePanel}>Explore beats <Icon name="arrow" size={18} /></button></div>}
      </> : null}
      {panel === "checkout" ? <form onSubmit={submit}><button type="button" className="text-button back-button" disabled={busy} onClick={()=>setPanel("cart")}>← Back to cart</button><div className="test-notice"><Icon name="shield" size={21}/><div><strong>Secure payment with Stripe.</strong><p>Review your licenses below, then continue to Stripe. We never collect card details on this page.</p></div></div><div className="account-email"><span>Account email</span><strong>{email}</strong></div><div className="checkout-review"><h3>Order summary</h3>{cart.map(item=><div key={item.beatId}><span>{beatById.get(item.beatId)!.title}<small>{licenseNames[item.license]} license</small></span><strong>{money(priceFor(beatById.get(item.beatId)!,item.license))}</strong></div>)}<div className="total-row"><span>Total <small>USD</small></span><strong>{money(total)}</strong></div></div><label className="terms"><input type="checkbox" checked={accepted} required disabled={busy} onChange={event=>setAccepted(event.target.checked)}/><span>I accept the <a href="/licenses" target="_blank" rel="noreferrer">license terms</a> for each selected tier. Earlier standard licenses remain valid after an exclusive sale.</span></label>{checkoutError?<p className="checkout-error" role="alert">{checkoutError}</p>:null}<button className="primary-button wide" type="submit" disabled={busy||!cart.length}>{busy?"Opening secure checkout…":`Continue to Stripe · ${money(total)}`}<Icon name="arrow" size={18}/></button></form>:null}
      {panel === "receipt" ? receipt ? <div className="receipt"><span className="receipt-check"><Icon name="check" size={30} /></span><h3>You're all set.</h3><p>Payment verified. Your audio files are ready.</p><div className="receipt-info"><div><span>Order</span><strong>{receipt.id}</strong></div><div><span>Email</span><strong>{receipt.email}</strong></div><div><span>Order total</span><strong>{money(receipt.total)} USD</strong></div><div><span>Amount charged</span><strong>{receipt.mode==="test"?"$0.00 (Stripe test)":money(receipt.total)}</strong></div></div><div className="receipt-downloads">{receipt.items.map(item => <div key={item.beatId}><div><strong>{item.title}</strong><small>{licenseNames[item.license]} · Purchased audio</small></div><a className="download-button" href={item.downloadUrl || `/audio/${item.beatId}.wav`}  aria-label={`Download ${item.title} purchased audio`}><Icon name="download" size={19} /> Audio</a></div>)}</div><a className="secondary-button wide" href={`data:text/plain;charset=utf-8,${encodeURIComponent(receiptText(receipt))}`} download={`${receipt.id}-receipt.txt`}><Icon name="download" size={17} /> Download receipt</a><button className="primary-button wide" onClick={closePanel}>Back to the beats <Icon name="arrow" size={18} /></button><p className="charge-note">This order is saved in My beats. Reopen its receipt from your account or this page's URL. {receipt.mode==="test"?"Stripe test order: no money charged or commercial rights granted.":"Your purchased license terms apply."}</p></div> : <div className="receipt-loading" role="status">Loading your receipt…</div> : null}
      {panel === "account" ? <AccountPanel data={account} loading={accountLoading} onReceipt={token => void openReceipt(token)} onAudioPlay={() => { if(controller.current?.state.playing) void controller.current.toggle(); }} onUpdated={async () => { const data = await refreshAccount(); if(afterAccount.current && data?.profile) { afterAccount.current=false; setEmail(data.identity.email); launchCheckout(); } }} /> : null}
      </div>
    </dialog>
  </div>;
}
