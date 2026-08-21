import { apiUrl } from "@/lib/api";
import { Suspense, lazy, useState } from "react";
import { Check, Loader2, Lock, Star } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { useGramPay } from "@/hooks/useGramPay";

import { VinylDisc } from "@/components/VinylDisc";
import { CoinIcon, GramIcon, MusicIcon } from "@/components/CoinIcon";
import { NFTS } from "@/lib/nfts";
import { formatCrypto, formatNumber, nftDaily, REFERRAL_NFT_TARGET } from "@/lib/game";
import { telegram } from "@/lib/payments";

const StorePanel = lazy(() =>
  import("@/components/StorePanel").then((m) => ({ default: m.StorePanel })),
);

export default function StudioPage() {
  const [tab, setTab] = useState<"nfts" | "plans">("nfts");

  return (
    <div className="space-y-4">
      <div className="liquid-glass animate-fade-up grid grid-cols-2 gap-1 rounded-2xl p-1 text-xs">
        {(
          [
            ["nfts", "Music NFTs"],
            ["plans", "Plans"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-xl py-2.5 transition-all duration-300 active:scale-95 ${
              tab === id ? "bg-white text-gray-900" : "text-foreground/55"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "nfts" ? (
        <NftsTab />
      ) : (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/5" />}>
          <StorePanel />
        </Suspense>
      )}
    </div>
  );
}

function NftsTab() {
  const { state, addNft } = useGame();
  const { pay, pending } = useGramPay();
  const [busy, setBusy] = useState<string | null>(null);

  const owned = state.nfts ?? [];
  const list = [...NFTS].sort(
    (a, b) => Number(owned.includes(b.id)) - Number(owned.includes(a.id)),
  );

  const payStars = async (nftId: string, name: string) => {
    setBusy(nftId);
    try {
      const res = await fetch(apiUrl("/api/public/telegram/invoice"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: "nft", nftId }),
      });
      const data = (await res.json()) as { link?: string; error?: string };
      if (!res.ok || !data.link) {
        toast.error("Stars checkout unavailable", {
          description: data.error ?? "Try again later.",
        });
        return;
      }
      const tg = telegram();
      if (tg?.openInvoice) {
        tg.openInvoice(data.link, (status) => {
          if (status === "paid") {
            addNft(nftId);
            telegram()?.HapticFeedback?.notificationOccurred?.("success");
            toast.success(`${name} is yours`);
          } else if (status === "failed") toast.error("Payment failed");
        });
      } else toast("Open the app inside Telegram to pay with Stars");
    } catch {
      toast.error("Could not start the checkout");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="animate-fade-up delay-1 px-2 text-center text-[11px] leading-relaxed text-foreground/45">
        Every NFT is a real record. Press play to listen — while you own it, it mines for you 24/7.
      </p>

      {list.map((nft, i) => {
        const has = owned.includes(nft.id);
        const daily = nftDaily(state, nft.id);
        const starsBusy = busy === nft.id;
        const gramBusy = pending === `nft-${nft.id}`;
        const rewardOnly = Boolean(nft.reward);

        return (
          <section
            key={nft.id}
            className={`liquid-glass animate-fade-up overflow-hidden rounded-3xl delay-${Math.min(i + 2, 5)}`}
          >
            <div className="flex items-center gap-4 p-4">
              <VinylDisc
                src={nft.audioUrl}
                cover={nft.coverUrl}
                title={nft.name}
                tone={nft.tone}
                size={104}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base tracking-tight">{nft.name}</p>
                <p className="mt-0.5 text-[11px] text-foreground/45">{nft.artist}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-foreground/60">{nft.desc}</p>
              </div>
            </div>

            {/* Three daily mining counters, one per coin */}
            <div className="grid grid-cols-3 gap-2 px-4">
              {[
                { icon: <MusicIcon size={14} />, label: "MUSIC", v: formatNumber(daily.music) },
                {
                  icon: <CoinIcon id="gram" size={14} />,
                  label: "GRAM",
                  v: formatCrypto(daily.gram),
                },
                {
                  icon: <CoinIcon id="usdt" size={14} />,
                  label: "USDT",
                  v: formatCrypto(daily.usdt),
                },
              ].map((c) => (
                <div key={c.label} className="glass-thin rounded-2xl p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] text-foreground/45">
                    {c.icon} {c.label}
                  </div>
                  <p className="mt-1 text-[13px] tracking-tight">{c.v}</p>
                  <p className="text-[9px] text-foreground/35">per day</p>
                </div>
              ))}
            </div>

            {has ? (
              <p className="m-3 flex items-center justify-center gap-1.5 rounded-2xl bg-white/10 py-3 text-xs text-foreground/70">
                <Check size={13} /> Owned — mining for you
              </p>
            ) : rewardOnly ? (
              <p className="m-3 flex items-center justify-center gap-1.5 rounded-2xl bg-white/6 py-3 text-[11px] text-foreground/55">
                <Lock size={12} /> Free when {REFERRAL_NFT_TARGET} friends join
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 p-2.5">
                <button
                  disabled={Boolean(busy) || Boolean(pending)}
                  onClick={() => payStars(nft.id, nft.name)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3 text-xs text-gray-900 transition-transform duration-200 active:scale-95 disabled:opacity-50"
                >
                  {starsBusy ? (
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                  ) : (
                    <Star size={14} className="fill-blue-500 text-blue-500" />
                  )}
                  {nft.stars} Stars
                </button>
                <button
                  disabled={Boolean(busy) || Boolean(pending)}
                  onClick={() => pay(`nft-${nft.id}`, nft.gram, nft.name, () => addNft(nft.id))}
                  className="glass-thin flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs transition-transform duration-200 active:scale-95 disabled:opacity-50"
                >
                  {gramBusy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <GramIcon size={14} />
                  )}
                  {nft.gram} GRAM
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
