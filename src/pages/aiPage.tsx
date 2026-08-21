import { apiUrl } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { HelpCircle, Mic, Music2, Play, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { TrackPlayer, type Composition } from "@/lib/synth";
import { activePlan, type Track } from "@/lib/game";
import { loadTrackAudio, saveTrackAudio } from "@/lib/track-audio";

export default function AiPage() {
  const { state, addTrack, grant } = useGame();
  const [mode, setMode] = useState<"voice" | "prompt">("voice");
  const [help, setHelp] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [comp, setComp] = useState<Composition | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<TrackPlayer | null>(null);

  // voice recording
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const voiceElRef = useRef<HTMLAudioElement | null>(null);
  const generatedAudioRef = useRef<HTMLAudioElement | null>(null);

  const plan = activePlan(state);
  const todayCount = state.tracks.filter(
    (t) => new Date(t.createdAt).toDateString() === new Date().toDateString(),
  ).length;
  const dailyLimit = plan?.aiTracks ?? 1;
  const remaining = Math.max(0, dailyLimit - todayCount);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    return () => {
      playerRef.current?.stop();
      voiceElRef.current?.pause();
      generatedAudioRef.current?.pause();
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setVoiceBlob(blob);
        setVoiceUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      setSeconds(0);
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone blocked", {
        description: "Allow mic access in your browser or Telegram settings.",
      });
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function generate() {
    if (mode === "voice" && !voiceUrl) {
      toast.error("Record your voice first");
      return;
    }
    if (mode === "prompt" && !prompt.trim()) {
      toast.error("Describe the track first");
      return;
    }
    if (remaining <= 0) {
      toast.error("Daily limit reached", {
        description: "A subscription plan gives you more songs per day.",
      });
      return;
    }

    const brief =
      mode === "voice"
        ? `instrumental backing track for a ${seconds || 15}s vocal recording${
            prompt.trim() ? `, style: ${prompt.trim()}` : ""
          }`
        : prompt.trim();

    setLoading(true);
    setComp(null);
    setCover(null);
    setGeneratedAudio((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    try {
      setStep(mode === "voice" ? "Building your backing track..." : "Composing...");
      const res = await fetch(apiUrl("/api/public/ai/compose"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: brief }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Generation failed (${res.status})`);
      }
      const composition = (await res.json()) as Composition;
      setComp(composition);

      setStep("Painting the cover...");
      let coverUrl: string | null = null;
      try {
        const coverRes = await fetch(apiUrl("/api/public/ai/cover"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `${composition.genre}, ${composition.mood}, ${brief}` }),
        });
        if (coverRes.ok) coverUrl = ((await coverRes.json()) as { url?: string }).url ?? null;
      } catch {
        /* cover is optional */
      }
      if (!coverUrl)
        coverUrl = "/bg-poster.jpg";
      setCover(coverUrl);

      /* Sing the generated lyrics when the user did not record their own take. */
      let audio = voiceUrl;
      let audioBlob = voiceBlob;
      const lyrics = composition.lyrics;
      if (!audio && lyrics && lyrics.length > 0) {
        setStep("Recording the vocals...");
        try {
          const vocalRes = await fetch(apiUrl("/api/public/ai/vocals"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lyrics, mood: composition.mood }),
          });
          if (!vocalRes.ok) {
            const error = (await vocalRes.json().catch(() => ({}))) as { error?: string };
            throw new Error(error.error ?? "Vocal generation failed");
          }
          audioBlob = await vocalRes.blob();
          audio = URL.createObjectURL(audioBlob);
          setGeneratedAudio(audio);
        } catch {
          /* vocals are optional */
        }
      }

      const bonusPct = 10 + Math.floor(Math.random() * 26);
      const trackId = String(Date.now());
      const audioKey = audioBlob ? `track-${trackId}` : undefined;
      if (audioBlob && audioKey) await saveTrackAudio(audioKey, audioBlob);
      const track: Track = {
        id: trackId,
        title: composition.title,
        genre: composition.genre,
        mood: composition.mood,
        coverUrl,
        audioUrl: audio,
        ...(audioKey ? { audioKey } : {}),
        composition,

        bonusPct,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 3_600_000,
      };
      addTrack(track);
      grant(500);
      toast.success(`"${composition.title}" is ready · +${bonusPct}% mining for 24h`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  async function togglePlay() {
    if (!comp) return;
    if (playing) {
      playerRef.current?.stop();
      voiceElRef.current?.pause();
      generatedAudioRef.current?.pause();
      setPlaying(false);
      return;
    }
    playerRef.current = new TrackPlayer();
    setPlaying(true);
    const vocalElement = generatedAudio ? generatedAudioRef.current : voiceElRef.current;
    if (vocalElement) {
      vocalElement.currentTime = 0;
      void vocalElement.play().catch(() => undefined);
    }
    await playerRef.current.play(comp, () => setPlaying(false));
  }

  return (
    <div className="space-y-3 pt-4">
      {/* Mode switch */}
      <div className="glass-thin animate-fade-up mx-auto flex w-full max-w-xs rounded-full p-1">
        {(
          [
            ["voice", "Sing a song"],
            ["prompt", "Describe it"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 rounded-full py-2 text-xs transition-all duration-200 active:scale-95 ${
              mode === id ? "bg-white text-gray-900 shadow-lg" : "text-foreground/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setHelp((h) => !h)}
          className="glass-thin flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-foreground/70 transition-transform duration-200 active:scale-95"
        >
          <HelpCircle size={13} /> How does this work?
        </button>
      </div>

      {help ? (
        <section className="liquid-glass animate-fade-up space-y-2 rounded-3xl p-4 text-[11px] leading-relaxed text-foreground/70">
          <p>1. Pick "Sing a song" and record your voice, or "Describe it" and type the style.</p>
          <p>2. Tap the button below — the AI composes an instrumental and paints a cover.</p>
          <p>3. Play it back: your voice and the AI music are mixed together.</p>
          <p>4. Every finished song adds a 24-hour mining bonus to all three coins.</p>
        </section>
      ) : null}

      <section className="liquid-glass animate-fade-up delay-1 rounded-3xl p-5">
        {mode === "voice" ? (
          <>
            <h1 className="text-lg tracking-tight">Turn your voice into a song</h1>
            <p className="mt-1 text-xs text-foreground/60">
              Record yourself humming or singing. The AI writes an instrumental around it and plays
              them together.
            </p>

            <div className="mt-5 flex flex-col items-center">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`flex h-24 w-24 items-center justify-center rounded-full transition-transform duration-200 active:scale-95 ${
                  recording ? "bg-red-500 animate-pulse" : "bg-white text-gray-900"
                }`}
                aria-label={recording ? "Stop recording" : "Start recording"}
              >
                {recording ? <Square size={26} /> : <Mic size={30} strokeWidth={1.8} />}
              </button>
              <p className="mt-3 text-sm tabular-nums">
                {recording
                  ? `Recording ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
                      seconds % 60,
                    ).padStart(2, "0")}`
                  : voiceUrl
                    ? "Voice recorded"
                    : "Tap to record"}
              </p>
            </div>

            {voiceUrl ? (
              <div className="glass-thin mt-4 flex items-center gap-2 rounded-2xl p-2.5">
                <audio ref={voiceElRef} src={voiceUrl} controls className="h-8 w-full" />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(voiceUrl);
                    setVoiceUrl(null);
                    setVoiceBlob(null);
                    setSeconds(0);
                  }}
                  className="shrink-0 rounded-xl p-2 text-foreground/60 transition-transform active:scale-95"
                  aria-label="Delete recording"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : null}

            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={120}
              placeholder="Optional: the style you want (e.g. soft piano ballad)"
              className="glass-thin mt-3 w-full rounded-2xl p-3 text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-blue-700"
            />
          </>
        ) : (
          <>
            <h1 className="text-lg tracking-tight">Describe a track</h1>
            <p className="mt-1 text-xs text-foreground/60">
              Say the genre and mood — the AI composes it and paints the cover.
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="e.g. calm lo-fi with soft piano and light drums"
              className="glass-thin mt-3 w-full resize-none rounded-2xl p-3 text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-blue-700"
            />
          </>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm text-gray-900 transition-transform duration-200 active:scale-95 disabled:opacity-60"
        >
          {loading ? step || "Working..." : mode === "voice" ? "Make my song" : "Generate track"}
        </button>
        <p className="mt-2 text-center text-[11px] text-foreground/60">
          {remaining} of {dailyLimit} left today
          {!plan && " · a plan raises this limit"}
        </p>
      </section>

      {comp && (
        <section className="liquid-glass animate-fade-up overflow-hidden rounded-3xl">
          {generatedAudio ? (
            <audio ref={generatedAudioRef} src={generatedAudio} preload="auto" />
          ) : null}
          <div
            className="aspect-square w-full bg-blue-700 bg-cover bg-center"
            style={cover ? { backgroundImage: `url(${cover})` } : undefined}
          />
          <div className="p-4">
            <p className="text-base tracking-tight">{comp.title}</p>
            <p className="text-[11px] text-foreground/60">
              {comp.genre} · {comp.mood} · {comp.bpm} BPM · {comp.key}
            </p>
            {comp.description && (
              <p className="mt-2 text-xs text-foreground/80">{comp.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {comp.chords.map((c, i) => (
                <span key={`${c}-${i}`} className="glass-thin rounded-lg px-2 py-1 text-[11px]">
                  {c}
                </span>
              ))}
            </div>
            <button
              onClick={togglePlay}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 py-3 text-sm transition-transform duration-200 active:scale-95"
            >
              {playing ? <Square size={14} strokeWidth={2} /> : <Play size={14} strokeWidth={2} />}
              {playing ? "Stop" : generatedAudio || voiceUrl ? "Play my song" : "Play track"}
            </button>
          </div>
        </section>
      )}

      {state.tracks.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-xs uppercase tracking-widest text-foreground/40">
            Your library
          </h2>
          {state.tracks.map((t) => (
            <SavedTrack key={t.id} track={t} />
          ))}
        </section>
      )}
    </div>
  );
}

function SavedTrack({ track }: { track: Track }) {
  const [audioUrl, setAudioUrl] = useState(track.audioUrl);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<TrackPlayer | null>(null);

  useEffect(() => {
    if (!track.audioKey || (track.audioUrl && !track.audioUrl.startsWith("blob:"))) return;
    let objectUrl: string | null = null;
    void loadTrackAudio(track.audioKey).then((blob) => {
      if (!blob) return;
      objectUrl = URL.createObjectURL(blob);
      setAudioUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      playerRef.current?.stop();
    };
  }, [track.audioKey, track.audioUrl]);

  async function toggle() {
    if (playing) {
      audioRef.current?.pause();
      playerRef.current?.stop();
      setPlaying(false);
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play().catch(() => undefined);
    }
    if (track.composition) {
      playerRef.current = new TrackPlayer();
      void playerRef.current.play(
        { title: track.title, genre: track.genre, mood: track.mood, ...track.composition },
        () => setPlaying(false),
      );
    }
    setPlaying(true);
  }

  return (
    <div className="liquid-glass flex items-center gap-3 rounded-2xl p-3">
      {audioUrl ? <audio ref={audioRef} src={audioUrl} preload="metadata" /> : null}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-700 bg-cover bg-center"
        style={track.coverUrl ? { backgroundImage: `url(${track.coverUrl})` } : undefined}
      >
        {track.coverUrl ? null : <Music2 size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{track.title}</p>
        <p className="text-[11px] text-foreground/60">
          {track.genre} · +{track.bonusPct}% bonus
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={!audioUrl && !track.composition}
        className="glass-thin flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40"
        aria-label={playing ? `Stop ${track.title}` : `Play ${track.title}`}
      >
        {playing ? <Square size={14} /> : <Play size={14} />}
      </button>
    </div>
  );
}
