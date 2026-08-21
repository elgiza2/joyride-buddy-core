import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/bg.mp4";
const POSTER_SRC = "/bg-poster.jpg";
const MAX_WIDTH = 960;
const FPS = 30;

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
};

/**
 * Plays the background clip once while capturing every frame into off-screen
 * canvases, then hides the <video> and ping-pongs the captured frames on a
 * canvas at 30fps — a seamless boomerang loop with no audio track and no
 * chance of Telegram's webview promoting it to a native player.
 */
export function BoomerangVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const [looping, setLooping] = useState(false);

  // Capture frames while the video plays through once.
  useEffect(() => {
    const video = videoRef.current as VideoWithFrameCallback | null;
    if (!video) return;
    let alive = true;

    const capture = () => {
      if (!alive || video.videoWidth === 0) return;
      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      const frame = document.createElement("canvas");
      frame.width = w;
      frame.height = h;
      frame.getContext("2d")?.drawImage(video, 0, 0, w, h);
      framesRef.current.push(frame);
    };

    let raf = 0;
    const tick = () => {
      if (!alive || video.ended) return;
      capture();
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(tick);
      else raf = requestAnimationFrame(tick);
    };

    const onPlay = () => tick();
    const onEnded = () => {
      if (alive && framesRef.current.length > 1) setLooping(true);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("ended", onEnded);
    void video.play().catch(() => {
      /* autoplay blocked — the poster keeps the hero looking right */
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  // Ping-pong the captured frames.
  useEffect(() => {
    if (!looping) return;
    const canvas = canvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length < 2) return;
    const first = frames[0]!;
    canvas.width = first.width;
    canvas.height = first.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let index = 0;
    let step = 1;
    const timer = setInterval(() => {
      const frame = frames[index];
      if (frame) ctx.drawImage(frame, 0, 0);
      index += step;
      if (index >= frames.length - 1 || index <= 0) step = -step;
    }, 1000 / FPS);

    return () => clearInterval(timer);
  }, [looping]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      <div className="absolute inset-0 origin-center scale-[1.08] overflow-hidden">
        <img
          className="background-still absolute inset-0 h-full w-full object-cover"
          src={POSTER_SRC}
          alt=""
          decoding="async"
          fetchPriority="high"
          draggable={false}
          aria-hidden="true"
        />
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ visibility: looping ? "hidden" : "visible" }}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          playsInline
          autoPlay
          preload="auto"
          crossOrigin="anonymous"
          aria-hidden="true"
        />
        {looping ? (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}
