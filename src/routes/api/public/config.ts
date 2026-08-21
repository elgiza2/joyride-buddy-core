import { createFileRoute } from "@tanstack/react-router";

/** Public, non-secret client config (ad block id). */
export const Route = createFileRoute("/api/public/config")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          adsgramBlockId: process.env["ADSGRAM_BLOCK_ID"] ?? "43800",
        }),
    },
  },
});
