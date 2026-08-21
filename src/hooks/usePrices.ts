import { useQuery } from "@tanstack/react-query";
import { getPrices, type Prices } from "@/lib/prices.functions";
import { readCache, writeCache } from "@/lib/ui-cache";

/** Live coin prices, refreshed every 2 minutes. */
export function usePrices() {
  const query = useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const res = await getPrices();
      if (res.prices) writeCache("prices", res.prices);
      return res;
    },
    initialData: () => {
      const cached = readCache<Prices>("prices");
      return cached ? { prices: cached, error: null } : undefined;
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  return {
    prices: (query.data?.prices ?? null) as Prices | null,
    loading: query.isLoading,
    error: query.data?.error ?? null,
  };
}

export function usd(amount: number, price: number | undefined) {
  if (!price) return null;
  const value = amount * price;
  if (value === 0) return "$0.00";
  return `$${value < 0.01 ? value.toFixed(6) : value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
