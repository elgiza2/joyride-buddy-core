import { createFileRoute } from "@tanstack/react-router";
import { corsJson, corsPreflight } from "@/lib/cors";

/** Public, non-secret client config (ad block id). */
export const Route = createFileRoute("/api/public/config")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async () => corsJson({ adsgramBlockId: process.env["ADSGRAM_BLOCK_ID"] ?? "43800" }),
    },
  },
});
