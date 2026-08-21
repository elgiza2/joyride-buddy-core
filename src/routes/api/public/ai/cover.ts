import { createFileRoute } from "@tanstack/react-router";
import { corsJson, corsPreflight } from "@/lib/cors";

/** Track cover art via DeepAI, using the rotating key pool. */
export const Route = createFileRoute("/api/public/ai/cover")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      POST: async ({ request }) => {
        const { prompt } = (await request.json().catch(() => ({}))) as { prompt?: string };
        if (!prompt || prompt.length > 400) {
          return corsJson({ error: "وصف غير صالح" }, 400);
        }

        const { deepaiImage } = await import("@/lib/deepai.server");
        const url = await deepaiImage(`album cover artwork for a song about ${prompt}`);
        if (!url) return corsJson({ error: "No image key available" }, 502);
        return corsJson({ url });
      },
    },
  },
});
