import { Suspense, lazy } from "react";
import { Lock } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { CoinIcon, MusicIcon } from "@/components/CoinIcon";
import { MINERS, formatCrypto, formatNumber, minerRate, minerUnlocked } from "@/lib/game";
import { usePrices, usd } from "@/hooks/usePrices";

const WalletPanel = lazy(() => import("@/components/WalletPanel"));

export default function WalletPage() {
  const { state } = useGame();
  const { prices } = usePrices();

  return (
    <div className="space-y-5">
      <section className="animate-fade-up flex flex-col items-center pt-2 text-center">
        <MusicIcon size={56} />
        <p className="mt-3 text-5xl tracking-tight">{formatNumber(state.balance)}</p>
        <p className="mt-1 text-sm text-foreground/50">MUSIC</p>
      </section>

      <Suspense fallback={<div className="h-24" aria-hidden />}>
        <WalletPanel />
      </Suspense>

      <section className="animate-fade-up delay-2 space-y-2">
        <div className="liquid-glass flex items-center gap-3 rounded-2xl p-4">
          <MusicIcon size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-sm">MUSIC</p>
            <p className="text-[11px] text-foreground/50">Our in-app coin</p>
          </div>
          <p className="text-base tracking-tight">{formatNumber(state.balance)}</p>
        </div>

        {MINERS.map((m) => {
          const balance = m.id === "gram" ? state.gram : state.usdt;
          const unlocked = minerUnlocked(state, m.id);
          return (
            <div key={m.id} className="liquid-glass flex items-center gap-3 rounded-2xl p-4">
              <CoinIcon id={m.id} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{m.symbol}</p>
                <p className="flex items-center gap-1 text-[11px] text-foreground/50">
                  {unlocked ? (
                    `${formatCrypto(minerRate(state, m))} ${m.symbol} / hr`
                  ) : (
                    <>
                      <Lock size={10} /> Unlocks with a Music NFT
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base tracking-tight">{formatCrypto(balance)}</p>
                <p className="text-[10px] text-foreground/40">
                  {usd(balance, prices?.[m.id]?.usd) ?? `min ${m.minWithdraw} ${m.symbol}`}
                </p>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
