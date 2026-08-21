import { Copy, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { VinylDisc } from "@/components/VinylDisc";
import { formatNumber, REFERRAL_NFT_ID, REFERRAL_NFT_TARGET } from "@/lib/game";
import { nftById } from "@/lib/nfts";

const REWARD_NFT = nftById(REFERRAL_NFT_ID)!;

const TIERS = [
  { label: "Friend joins", reward: 1000 },
  { label: "Friend reaches level 5", reward: 5000 },
  { label: "Friend buys Premium", reward: 25000 },
];

export function ReferralPanel() {
  const { state } = useGame();
  const link = `https://t.me/Mosuclbot?start=${state.refCode}`;
  const owned = (state.nfts ?? []).includes(REFERRAL_NFT_ID);

  return (
    <div className="space-y-3">
      <section className="liquid-glass animate-fade-up delay-1 rounded-2xl p-5 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700">
          <Users size={20} strokeWidth={2} />
        </div>
        <h2 className="mt-3 text-lg tracking-tight">Invite friends, earn together</h2>
        <p className="mt-1 text-xs text-foreground/60">
          Get 10% of every friend's mining and 2.5% of their friends, for life.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="glass-thin rounded-xl p-3">
            <p className="text-[10px] text-foreground/60">Friends</p>
            <p className="text-xl tracking-tight">{state.referrals}</p>
          </div>
          <div className="glass-thin rounded-xl p-3">
            <p className="text-[10px] text-foreground/60">Mining bonus</p>
            <p className="text-xl tracking-tight">+{state.referrals * 10}%</p>
          </div>
        </div>
      </section>

      <section className="liquid-glass animate-fade-up delay-2 rounded-2xl p-4">
        <p className="text-xs text-foreground/60">Your invite link</p>
        <p className="glass-thin mt-2 truncate rounded-xl px-3 py-2 text-xs">{link}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(link);
              toast.success("Link copied");
            }}
            className="liquid-glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Copy size={14} strokeWidth={2} /> Copy
          </button>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
              "Join me on Music AI and mine the MUSIC coin",
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm text-gray-900 transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Send size={14} strokeWidth={2} /> Share
          </a>
        </div>
      </section>

      {/* Free NFT milestone */}
      <section className="liquid-glass animate-fade-up delay-3 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <VinylDisc src={REWARD_NFT.audioUrl} cover={REWARD_NFT.coverUrl} title={REWARD_NFT.name} tone={REWARD_NFT.tone} size={88} />
          <div className="min-w-0 flex-1">
            <p className="text-sm tracking-tight">Invite {REFERRAL_NFT_TARGET} friends → free NFT</p>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground/55">
              "{REWARD_NFT.name}" unlocks GRAM and USDT mining forever and keeps producing every day.
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-600 transition-[width] duration-700"
                style={{
                  width: `${Math.min(100, (state.referrals / REFERRAL_NFT_TARGET) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[10px] text-foreground/45">
              {owned
                ? "Unlocked — it is mining for you"
                : `${Math.min(state.referrals, REFERRAL_NFT_TARGET)} / ${REFERRAL_NFT_TARGET} friends`}
            </p>
          </div>
        </div>
      </section>

      <section className="liquid-glass animate-fade-up delay-3 space-y-2 rounded-2xl p-4">
        <h3 className="text-sm">Referral rewards</h3>
        {TIERS.map((t) => (
          <div key={t.label} className="flex items-center justify-between text-xs text-foreground/80">
            <span>{t.label}</span>
            <span>+{formatNumber(t.reward)} MUSIC</span>
          </div>
        ))}
      </section>
    </div>
  );
}
