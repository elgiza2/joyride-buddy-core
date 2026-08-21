import { apiGet } from "@/lib/api";

export type CoinPrice = { usd: number; change24h: number };
export type Prices = Record<"gram" | "ton" | "usdt", CoinPrice>;

/** Live market prices, served by the backend route `/api/public/prices`. */
export async function getPrices(): Promise<{ prices: Prices | null; error: string | null }> {
  try {
    return await apiGet<{ prices: Prices | null; error: string | null }>("/api/public/prices");
  } catch {
    return { prices: null, error: "Market data unavailable" };
  }
}
