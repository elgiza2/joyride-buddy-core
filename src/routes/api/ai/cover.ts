import { createFileRoute } from "@tanstack/react-router";

/** Track cover art via DeepAI, using the rotating key pool. */
export const Route = createFileRoute("/api/ai/cover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || prompt.length > 400) {
          return Response.json({ error: "وصف غير صالح" }, { status: 400 });
        }

        const { deepaiImage } = await import("@/lib/deepai.server");
        const url = await deepaiImage(`album cover artwork for a song about ${prompt}`);
        if (!url) return Response.json({ error: "No image key available" }, { status: 502 });
        return Response.json({ url });
      },
    },
  },
});
