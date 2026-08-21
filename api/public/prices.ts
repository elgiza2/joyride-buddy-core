/* eslint-disable @typescript-eslint/no-explicit-any */
import { corsJson, corsPreflight } from "../../src/lib/cors";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return send(res, corsPreflight());
  if (req.method !== "GET") return send(res, corsJson({ error: "Method not allowed" }, 405));
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network,the-open-network,tether&vs_currencies=usd&include_24hr_change=true",
      { headers: { accept: "application/json" } },
    );
    if (!response.ok)
      return send(
        res,
        corsJson({ prices: null, error: `Market data unavailable (${response.status})` }),
      );
    const body = (await response.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;
    const ton = {
      usd: Number(body["the-open-network"]?.usd ?? 0),
      change24h: Number(body["the-open-network"]?.usd_24h_change ?? 0),
    };
    const usdt = {
      usd: Number(body.tether?.usd ?? 0),
      change24h: Number(body.tether?.usd_24h_change ?? 0),
    };
    return send(res, corsJson({ prices: { gram: ton, ton, usdt }, error: null }));
  } catch {
    return send(res, corsJson({ prices: null, error: "Market data unavailable" }));
  }
}
function send(res: any, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  response.arrayBuffer().then((b) => res.end(Buffer.from(b)));
}
