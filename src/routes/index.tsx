import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Lock, Timer } from "lucide-react";
import { toast } from "sonner";
import { CoinIcon, MusicIcon } from "@/components/CoinIcon";
import { VinylDisc } from "@/components/VinylDisc";
import { useGame } from "@/hooks/useGame";
import {
  MINERS,
  bestNft,
  cycleDone,
  fillPct,
  formatCrypto,
  formatDuration,
  formatNumber,
  minerPending,
  minerUnlocked,
  msLeft,
  pending,
  storageHours,
} from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mine | Music AI" },
      {
        name: "description",
        content: "Collect your studio earnings in MUSIC, GRAM and USDT and raise your mining rate.",
      },
      { property: "og:title", content: "Mine | Music AI" },
      { property: "og:description", content: "Mine three coins inside your Telegram studio." },
    ],
  }),
  component: MinePage,
});

function MinePage() {
  const { state, now, collect } = useGame();

  const done = cycleDone(state, now);
  const left = msLeft(state, now);
  const fill = fillPct(state, now);
  const nft = bestNft(state);

  const onCollect = () => {
    if (!done) return;
    const gained = collect();
    if (gained.music <= 0 && gained.gram <= 0 && gained.usdt <= 0) {
      toast("Nothing to collect yet");
      return;
    }
    const extra = [
      gained.gram > 0 ? `+${formatCrypto(gained.gram)} GRAM` : null,
      gained.usdt > 0 ? `+${formatCrypto(gained.usdt)} USDT` : null,
    ].filter(Boolean);
    toast.success(`+${formatNumber(gained.music)} MUSIC`, {
      description: extra.length ? extra.join("  ·  ") : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Balance */}
      <section className="animate-fade-up pt-1 text-center">
        <p className="flex items-center justify-center gap-2 text-[2.6rem] leading-none tracking-tight">
          <MusicIcon size={30} />
          {formatNumber(state.balance)}
        </p>
      </section>

      {/* Mining cycle */}
      <section className="liquid-glass animate-fade-up delay-1 rounded-3xl p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] uppercase tracking-widest text-foreground/40">Mining now</p>
          <p className="text-[11px] text-foreground/40">{storageHours(state)}h cycle</p>
        </div>
        <p className="mt-1 text-3xl tracking-tight">{formatNumber(pending(state, now))}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-foreground/50">
          <Timer size={11} />
          {done ? "Cycle complete" : `Ready in ${formatDuration(left)}`}
        </p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-300 to-blue-600 transition-[width] duration-700"
            style={{ width: `${fill}%` }}
          />
        </div>

        <button
          onClick={onCollect}
          disabled={!done}
          className={`mt-4 w-full rounded-2xl py-3.5 text-sm transition-transform duration-200 active:scale-95 ${
            done ? "bg-white text-gray-900" : "glass-thin text-foreground/40"
          }`}
        >
          {done ? "Collect earnings" : formatDuration(left)}
        </button>
      </section>

      {/* Crypto balances */}
      <section className="animate-fade-up delay-2 grid grid-cols-2 gap-3">
        {MINERS.map((m) => {
          const balance = m.id === "gram" ? state.gram : state.usdt;
          const unlocked = minerUnlocked(state, m.id);
          return (
            <div key={m.id} className="liquid-glass rounded-3xl p-4">
              <div className="flex items-center gap-2">
                <CoinIcon id={m.id} size={22} />
                <span className="text-[11px] text-foreground/55">{m.symbol}</span>
              </div>
              <p className="mt-3 text-xl tracking-tight">{formatCrypto(balance)}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-foreground/45">
                {unlocked ? (
                  `+${formatCrypto(minerPending(state, m, now))} mining`
                ) : (
                  <>
                    <Lock size={9} /> Locked
                  </>
                )}
              </p>
            </div>
          );
        })}
      </section>

      {/* Featured NFT */}
      {nft ? (
        <section className="liquid-glass animate-fade-up delay-3 rounded-3xl p-4">
          <div className="flex items-center gap-4">
            <VinylDisc src={nft.audioUrl} cover={nft.coverUrl} title={nft.name} tone={nft.tone} size={92} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-foreground/35">Your top NFT</p>
              <p className="mt-1 truncate text-base tracking-tight">{nft.name}</p>
              <p className="text-[11px] text-foreground/45">
                {nft.artist} · {nft.album}
              </p>
            </div>
          </div>
          <Link
            to="/studio"
            className="mt-3 flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5 text-xs text-foreground/75 transition-transform duration-200 active:scale-95"
          >
            Collect more Music NFTs <ChevronRight size={14} />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
