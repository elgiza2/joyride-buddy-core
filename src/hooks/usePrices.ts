import { useEffect, useState } from "react";
import { getPrices, type Prices } from "@/lib/prices.functions";
import { readCache, writeCache } from "@/lib/ui-cache";

export function usePrices() {
  const [prices, setPrices] = useState<Prices | null>(() => readCache<Prices>("prices"));
  const [loading, setLoading] = useState(!prices);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const res = await getPrices();
        if (!active) return;
        if (res.prices) {
          setPrices(res.prices);
          writeCache("prices", res.prices);
        }
        setError(res.error ?? null);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load prices");
      } finally {
        if (active) setLoading(false);
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 120_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return { prices, loading, error };
}

export function usd(amount: number, price: number | undefined) {
  if (!price) return null;
  const value = amount * price;
  if (value === 0) return "$0.00";
  return `$${value < 0.01 ? value.toFixed(6) : value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
