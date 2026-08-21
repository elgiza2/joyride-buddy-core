import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, corsJson, corsPreflight } from "@/lib/cors";

/** Sings the generated lyrics and streams back an MP3 vocal take. */
export const Route = createFileRoute("/api/public/ai/vocals")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return corsJson({ error: "Missing LOVABLE_API_KEY" }, 500);

        const { lyrics, mood, voice } = (await request.json().catch(() => ({}))) as {
          lyrics?: string[];
          mood?: string;
          voice?: string;
        };
        const text = (lyrics ?? []).join("\n").slice(0, 1800);
        if (!text.trim()) return corsJson({ error: "No lyrics" }, 400);

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: voice && /^[a-z]+$/.test(voice) ? voice : "alloy",
            response_format: "mp3",
            instructions: `Sing these lyrics musically, in tune, with a ${
              mood ?? "warm"
            } vocal performance. Keep a steady rhythm, hold the vowels, and breathe between lines.`,
          }),
        });

        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          console.error(`Vocals failed [${res.status}]: ${body}`);
          return corsJson({ error: body || "Vocal take failed" }, res.status);
        }

        return new Response(res.body, {
          headers: { "content-type": "audio/mpeg", "cache-control": "no-store", ...corsHeaders },
        });
      },
    },
  },
});
