"use client";

import { useEffect, useRef, useState } from "react";

export default function PreviewPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => {
      const current = audio.currentTime;

      // ⭐ HARD STOP AT 30 SECONDS
      if (current >= 30) {
        audio.pause();
        audio.currentTime = 0;

        // ⭐ Leave the bar at the END (30)
        setProgress(30);

        setIsPlaying(false);
        return;
      }

      setProgress(current);
    };

    const handleEnd = () => {
      setIsPlaying(false);
      setProgress(30); // ⭐ End of bar
    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("ended", handleEnd);

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("ended", handleEnd);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // ⭐ If bar is at the end, reset before playing
    if (!isPlaying && progress === 30) {
      audio.currentTime = 0;
      setProgress(0);
    }

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

    // ⭐ Prevent scrubbing past 30
    if (value >= 30) {
      setProgress(30);
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    audio.currentTime = value;
    setProgress(value);
  };

  return (
    <div className="mt-3 w-full">
      <audio ref={audioRef} src={src} preload="auto" className="hidden" />

      <div className="flex items-center gap-3">
        {/* Play Button */}
        <button
          onClick={togglePlay}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-sky-300 text-white shadow hover:bg-sky-400 transition"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <input
          type="range"
          min={0}
          max={30}   // ⭐ Hard limit
          value={progress}
          onChange={scrub}
          className="flex-1 accent-sky-400 cursor-pointer"
        />
      </div>
    </div>
  );
}
