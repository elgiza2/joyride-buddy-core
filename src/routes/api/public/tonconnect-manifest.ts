import { createFileRoute } from "@tanstack/react-router";
import icon from "@/assets/music-wallet-icon.png.asset.json";

/**
 * Public site identity shown by TON wallets during connect.
 * Must be a host that actually serves this app, otherwise wallets reject the
 * manifest and the connect sheet never opens.
 */
const SITE =
  process.env["MUSIC_APP_URL"] ??
  "https://project--cabbd000-2e02-47bd-9490-cb3561f12ac2-dev.lovable.app";

export const Route = createFileRoute("/api/public/tonconnect-manifest")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            url: SITE,
            name: "MUSIC",
            iconUrl: `${SITE}${icon.url}`,
          }),
          {
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*",
              "cache-control": "public, max-age=300",
            },
          },
        );
      },
    },
  },
});
