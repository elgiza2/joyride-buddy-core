import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are a songwriter and composer inside the Music AI app.
From the user's brief, write a REAL short song: it must have sung lyrics, not just music.

Return JSON only:
{"title":"short title","genre":"...","mood":"...","bpm":90,"key":"A minor","chords":["Am","F","C","G"],"melody":[69,72,76,74,0,72,69,67],"lyrics":["line 1","line 2","..."],"hook":"one catchy repeated line","description":"one sentence"}

Rules: 4-8 chords, 8-32 MIDI notes between 55 and 88 (0 = rest), bpm 70-150,
8-14 lyric lines that rhyme and fit the mood, written in the same language as the brief.
No text outside the JSON.`;

export const Route = createFileRoute("/api/ai/compose")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || prompt.length > 400) {
          return Response.json({ error: "Invalid description" }, { status: 400 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-preview",
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          console.error(`Compose failed [${res.status}]: ${body}`);
          return Response.json({ error: body }, { status: res.status });
        }

        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = json.choices?.[0]?.message?.content ?? "";
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return Response.json({ error: "Could not compose the song" }, { status: 502 });

        try {
          const comp = JSON.parse(match[0]) as Record<string, unknown>;
          const lyrics = (Array.isArray(comp["lyrics"]) ? comp["lyrics"] : [])
            .slice(0, 16)
            .map((l) => String(l).slice(0, 120))
            .filter(Boolean);
          return Response.json({
            title: String(comp["title"] ?? "Untitled").slice(0, 60),
            genre: String(comp["genre"] ?? "Lo-Fi").slice(0, 40),
            mood: String(comp["mood"] ?? "calm").slice(0, 40),
            bpm: Math.min(180, Math.max(60, Number(comp["bpm"]) || 90)),
            key: String(comp["key"] ?? "A minor").slice(0, 20),
            chords: (Array.isArray(comp["chords"]) ? comp["chords"] : ["Am", "F", "C", "G"])
              .slice(0, 8)
              .map((c) => String(c).slice(0, 8)),
            melody: (Array.isArray(comp["melody"]) ? comp["melody"] : [69, 72, 76, 74])
              .slice(0, 32)
              .map((n) => {
                const v = Number(n) || 0;
                return v === 0 ? 0 : Math.min(96, Math.max(48, Math.round(v)));
              }),
            lyrics,
            hook: String(comp["hook"] ?? lyrics[0] ?? "").slice(0, 120),
            description: String(comp["description"] ?? "").slice(0, 160),
          });
        } catch {
          return Response.json({ error: "Could not read the song" }, { status: 502 });
        }
      },
    },
  },
});
