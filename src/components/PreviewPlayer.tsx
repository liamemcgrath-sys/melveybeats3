"use client";

import { useEffect, useRef, useState } from "react";

export default function PreviewPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
    };

    const onTime = () => {
      setProgress(audio.currentTime);
    };

    const onEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const scrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const value = Number(e.target.value);
    audio.currentTime = value;
    setProgress(value);
  };

  return (
    <div className="mt-3 w-full">
      <audio ref={audioRef} src={src} preload="auto" className="hidden" />

      <div className="flex items-center gap-3">
        {/* CLEAN PLAY BUTTON */}
        <button
          onClick={togglePlay}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-cyan-600 text-white text-lg font-bold shadow hover:bg-cyan-700 transition"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        {/* PROGRESS BAR */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={progress}
          onChange={scrub}
          className="flex-1 accent-cyan-600 cursor-pointer"
        />
      </div>
    </div>
  );
}
