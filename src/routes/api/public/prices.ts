import { createFileRoute } from "@tanstack/react-router";
import { corsJson, corsPreflight } from "@/lib/cors";

const IDS = { gram: "the-open-network", ton: "the-open-network", usdt: "tether" } as const;

/** Live market prices from the public CoinGecko API (open, no key required). */
export const Route = createFileRoute("/api/public/prices")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async () => {
        const url =
          "https://api.coingecko.com/api/v3/simple/price?ids=" +
          Object.values(IDS).join(",") +
          "&vs_currencies=usd&include_24hr_change=true";

        try {
          const res = await fetch(url, { headers: { accept: "application/json" } });
          if (!res.ok) {
            return corsJson({ prices: null, error: `Market data unavailable (${res.status})` });
          }
          const body = (await res.json()) as Record<
            string,
            { usd?: number; usd_24h_change?: number }
          >;
          const pick = (id: string) => ({
            usd: Number(body[id]?.usd ?? 0),
            change24h: Number(body[id]?.usd_24h_change ?? 0),
          });
          return corsJson({
            prices: { gram: pick(IDS.gram), ton: pick(IDS.ton), usdt: pick(IDS.usdt) },
            error: null,
          });
        } catch {
          return corsJson({ prices: null, error: "Market data unavailable" });
        }
      },
    },
  },
});
