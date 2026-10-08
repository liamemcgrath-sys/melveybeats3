import { beats, audioUrl } from "./catalog";
export type PlayerState = { index: number; playing: boolean; loading: boolean; time: number; duration: number; volume: number; muted: boolean; error: string };
type AudioPort = Pick<HTMLAudioElement, "src" | "currentTime" | "duration" | "volume" | "muted" | "paused" | "load" | "play" | "pause" | "addEventListener" | "removeEventListener">;
export class AudioController {
  state: PlayerState = { index: -1, playing: false, loading: false, time: 0, duration: 0, volume: 0.75, muted: false, error: "" };
  private listeners = new Set<(state: PlayerState) => void>();
  private events: [string, EventListener][] = [];
  private selection = 0;
  constructor(private audio: AudioPort, private playlist = beats) {
    audio.volume = 0.75;
    this.bind("play", () => this.update({ playing: true, loading: false, error: "" }));
    this.bind("pause", () => this.update({ playing: false }));
    this.bind("loadedmetadata", () => this.update({ duration: Number.isFinite(audio.duration) ? audio.duration : this.state.duration, loading: false }));
    this.bind("timeupdate", () => this.update({ time: audio.currentTime }));
    this.bind("ended", () => this.update({ playing: false, time: audio.duration }));
    this.bind("error", () => this.update({ playing: false, loading: false, error: "This preview could not load. Try another beat or retry playback." }));
    this.bind("volumechange", () => this.update({ volume: audio.volume, muted: audio.muted }));
  }
  setPlaylist(next: typeof beats) { const previous=this.playlist[this.state.index]?.id; this.playlist=next; const index=previous?next.findIndex(beat=>beat.id===previous):-1; if(previous && index<0){this.selection++;this.audio.pause();this.audio.src="";this.audio.load();this.update({index:-1,time:0,duration:0,playing:false});}else if(previous)this.update({index}); }
  private bind(name: string, fn: EventListener) { this.audio.addEventListener(name, fn); this.events.push([name, fn]); }
  private update(patch: Partial<PlayerState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn(this.state)); }
  subscribe(fn: (state: PlayerState) => void) { this.listeners.add(fn); fn(this.state); return () => { this.listeners.delete(fn); }; }
  async select(index: number): Promise<void> {
    if (!this.playlist[index]) return;
    if (this.state.index === index) return this.toggle();
    this.selection++; this.audio.pause(); this.audio.src = audioUrl(this.playlist[index]); this.audio.load();
    this.update({ index, playing: false, loading: true, time: 0, duration: this.playlist[index].duration, error: "" });
    await this.start();
  }
  private async start() {
    const selection = this.selection;
    try { await this.audio.play(); }
    catch { if (selection === this.selection) this.update({ playing: false, loading: false, error: "Playback was interrupted. Press play to try again." }); }
  }
  async toggle(): Promise<void> {
    if (this.state.index < 0) return this.select(0);
    if (!this.audio.paused) this.audio.pause();
    else { if (this.audio.currentTime >= this.state.duration - 0.1) this.audio.currentTime = 0; await this.start(); }
  }
  async move(delta: number) { if(!this.playlist.length)return; await this.select((Math.max(this.state.index, 0) + delta + this.playlist.length) % this.playlist.length); }
  seek(value: number) { if (this.state.index < 0 || !Number.isFinite(value)) return; this.audio.currentTime = Math.max(0, Math.min(value, this.state.duration)); this.update({ time: this.audio.currentTime }); }
  setVolume(value: number) { if (!Number.isFinite(value)) return; this.audio.volume = Math.max(0, Math.min(value, 1)); this.audio.muted = false; this.update({ volume: this.audio.volume, muted: false }); }
  mute() { this.audio.muted = !this.audio.muted; this.update({ muted: this.audio.muted }); }
  destroy() { this.audio.pause(); this.events.forEach(([name, fn]) => this.audio.removeEventListener(name, fn)); this.listeners.clear(); }
}
