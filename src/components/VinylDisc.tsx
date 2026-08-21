import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Music2, Pause, Play } from "lucide-react";
import { registerPlayer, stopOthers } from "@/lib/audio-bus";

type Props = {
  /** Direct audio URL of the record. */
  src: string;
  /** Cover art printed on the disc label. */
  cover?: string;
  title: string;
  tone: string;
  size?: number;
  label?: string;
};

/** A spinning record with a clean play control. Spins only while playing. */
export function VinylDisc({ src, cover, title, tone, size = 132, label }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [artFailed, setArtFailed] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    audio.current?.pause();
    setPlaying(false);
    setLoading(false);
  }, []);

  /* One record at a time across the whole app. */
  useEffect(() => {
    const unregister = registerPlayer(stop);
    return () => {
      unregister();
    };
  }, [stop]);

  useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
    },
    [],
  );

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (playing || loading) {
      stop();
      return;
    }

    stopOthers(stop);

    if (!audio.current) {
      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.preload = "metadata";
      el.src = src;
      el.addEventListener("ended", () => setPlaying(false));
      el.addEventListener("pause", () => setPlaying(false));
      el.addEventListener("waiting", () => setLoading(true));
      el.addEventListener("playing", () => {
        setLoading(false);
        setPlaying(true);
      });
      el.addEventListener("error", () => {
        setLoading(false);
        setPlaying(false);
      });
      audio.current = el;
    }

    setLoading(true);
    try {
      await audio.current.play();
    } catch {
      setLoading(false);
      setPlaying(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={playing ? `Pause ${title}` : `Play ${title}`}
      className="group relative shrink-0 rounded-full transition-transform duration-200 active:scale-95"
      style={{ width: size, height: size }}
    >
      <span
        className={`absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0,rgba(0,0,0,0.9)_58%,rgba(0,0,0,0.75)_100%)] shadow-[0_16px_40px_-18px_rgba(0,0,0,0.9)] ${
          playing ? "animate-spin-vinyl" : ""
        }`}
      >
        <span className="absolute inset-[8%] rounded-full border border-white/10" />
        <span className="absolute inset-[18%] rounded-full border border-white/10" />
        <span className="absolute inset-[28%] rounded-full border border-white/10" />
        <span
          className={`absolute inset-[32%] flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${tone} ring-1 ring-white/20`}
        >
          {cover && !artFailed ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              onError={() => setArtFailed(true)}
              className="h-full w-full rounded-full object-cover opacity-90"
            />
          ) : (
            <Music2 size={Math.round(size * 0.14)} className="text-white/70" />
          )}
        </span>
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
      </span>

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg backdrop-blur transition-transform duration-200 group-hover:scale-105">
          {loading && !playing ? (
            <Loader2 size={17} strokeWidth={2.2} className="animate-spin" />
          ) : playing ? (
            <Pause size={17} strokeWidth={2.2} className="fill-gray-900" />
          ) : (
            <Play size={17} strokeWidth={2.2} className="ml-0.5 fill-gray-900" />
          )}
        </span>
      </span>

      {label ? (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-foreground/45">
          {label}
        </span>
      ) : null}
    </button>
  );
}
