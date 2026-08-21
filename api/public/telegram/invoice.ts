/* eslint-disable @typescript-eslint/no-explicit-any */
import { corsJson, corsPreflight } from "../../../src/lib/cors";
const ITEMS: Record<string, { title: string; desc: string; stars: number }> = {
  premium: {
    title: "Premium Pass — 30 days",
    desc: "2x mining, 24h storage, 5 AI tracks/day",
    stars: 250,
  },
  booster: {
    title: "3x Booster — 8 hours",
    desc: "Triple your mining rate for 8 hours",
    stars: 75,
  },
  tracks10: { title: "10 AI track pack", desc: "Extra AI generations", stars: 100 },
  coins: { title: "250,000 MUSIC bag", desc: "Instant coins for upgrades", stars: 400 },
  "gram-rig": {
    title: "GRAM Extractor — 5 levels",
    desc: "Instant 5 levels of GRAM mining",
    stars: 900,
  },
  "usdt-rig": {
    title: "USDT Rig — 5 levels",
    desc: "Instant 5 levels of USDT mining",
    stars: 1400,
  },
  mega: {
    title: "Seasonal Mega Bundle",
    desc: "Premium + week booster + 1,000,000 MUSIC",
    stars: 2500,
  },
};
export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return send(res, corsPreflight());
  if (req.method !== "POST") return send(res, corsJson({ error: "Method not allowed" }, 405));
  const token = process.env.TELEGRAM_STARS_BOT_TOKEN ?? process.env.MUSIC_TELEGRAM_BOT_TOKEN;
  if (!token)
    return send(res, corsJson({ error: "TELEGRAM_STARS_BOT_TOKEN is not configured" }, 503));
  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  const item = ITEMS[body.itemId];
  if (!item) return send(res, corsJson({ error: "Unknown item" }, 400));
  const response = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: item.title,
      description: item.desc,
      payload: `music-ai:${body.itemId}:${Date.now()}`,
      currency: "XTR",
      prices: [{ label: item.title, amount: item.stars }],
    }),
  });
  const data = (await response.json()) as { ok: boolean; result?: string; description?: string };
  return send(
    res,
    data.ok && data.result
      ? corsJson({ link: data.result })
      : corsJson({ error: data.description ?? "Telegram error" }, 502),
  );
}
function send(res: any, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  response.arrayBuffer().then((b) => res.end(Buffer.from(b)));
}
