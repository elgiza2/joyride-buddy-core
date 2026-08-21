import { createFileRoute } from "@tanstack/react-router";

/** Called hourly by pg_cron; publishes the next plan post once every 24h. */
export const Route = createFileRoute("/api/public/telegram/cron")({
  server: {
    handlers: {
      POST: async () => {
        const { getState, publishNext } = await import("@/lib/telegram-bot.server");
        const state = await getState();

        if (!state.autopost_enabled) {
          return Response.json({ skipped: "autopost disabled" });
        }

        const last = state.last_post_at ? Date.parse(state.last_post_at) : 0;
        if (Date.now() - last < 23.5 * 3_600_000) {
          return Response.json({ skipped: "not due yet" });
        }

        const result = await publishNext();
        return Response.json(result, { status: result.ok ? 200 : 502 });
      },
    },
  },
});
