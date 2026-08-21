import { createFileRoute } from "@tanstack/react-router";
import { INSTRUMENTS, MINERS, minerUpgradeCost, starsForCost, upgradeCost } from "@/lib/game";
import { PLANS } from "@/lib/plans";
import { NFTS } from "@/lib/nfts";

const ITEMS: Record<string, { title: string; desc: string; stars: number }> = {
  premium: { title: "Premium Pass — 30 days", desc: "2x mining, 24h storage, 5 AI tracks/day", stars: 250 },
  booster: { title: "3x Booster — 8 hours", desc: "Triple your mining rate for 8 hours", stars: 75 },
  tracks10: { title: "10 AI track pack", desc: "Extra AI generations", stars: 100 },
  coins: { title: "250,000 MUSIC bag", desc: "Instant coins for upgrades", stars: 400 },
  "gram-rig": { title: "GRAM Extractor — 5 levels", desc: "Instant 5 levels of GRAM mining", stars: 900 },
  "usdt-rig": { title: "USDT Rig — 5 levels", desc: "Instant 5 levels of USDT mining", stars: 1400 },
  mega: { title: "Seasonal Mega Bundle", desc: "Premium + week booster + 1,000,000 MUSIC", stars: 2500 },
};

/** Creates a Telegram Stars invoice link (XTR) for a shop item. */
export const Route = createFileRoute("/api/telegram/invoice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token =
          process.env["TELEGRAM_STARS_BOT_TOKEN"] ?? process.env["MUSIC_TELEGRAM_BOT_TOKEN"];
        if (!token) {
          return Response.json({ error: "TELEGRAM_STARS_BOT_TOKEN is not configured" }, { status: 503 });
        }

        const body = (await request.json()) as {
          itemId?: string;
          upgradeKind?: "instrument" | "miner";
          upgradeId?: string;
          level?: number;
          planId?: string;
          nftId?: string;
        };
        const { itemId } = body;

        let item = itemId ? ITEMS[itemId] : undefined;

        if (itemId === "plan") {
          const plan = PLANS.find((p) => p.id === body.planId);
          if (plan) {
            item = {
              title: `${plan.name} membership — lifetime`,
              desc: `${plan.aiTracks} AI songs a day, ${plan.perks.length} studio perks, forever`,
              stars: plan.stars,
            };
          }
        } else if (itemId === "nft") {
          const nft = NFTS.find((x) => x.id === body.nftId);
          if (nft) {
            item = {
              title: nft.name,
              desc: `Music NFT — mines ${nft.gramPerDay} GRAM and ${nft.usdtPerDay} USDT a day, forever`,
              stars: nft.stars,
            };
          }
        }

        if (itemId === "upgrade") {
          const level = Math.max(0, Math.floor(body.level ?? 0));
          if (body.upgradeKind === "instrument") {
            const inst = INSTRUMENTS.find((i) => i.id === body.upgradeId);
            if (inst) {
              const cost = upgradeCost(inst, level);
              item = {
                title: `${inst.name} — level ${level + 1}`,
                desc: "Instant instrument upgrade in your Music AI studio",
                stars: starsForCost(cost),
              };
            }
          } else if (body.upgradeKind === "miner") {
            const miner = MINERS.find((m) => m.id === body.upgradeId);
            if (miner) {
              const cost = minerUpgradeCost(miner, level);
              item = {
                title: `${miner.name} — level ${level + 1}`,
                desc: "Instant crypto rig upgrade in your Music AI studio",
                stars: starsForCost(cost),
              };
            }
          }
        }
        if (!item) return Response.json({ error: "Unknown item" }, { status: 400 });

        const res = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            description: item.desc,
            payload: `music-ai:${itemId}:${Date.now()}`,
            currency: "XTR",
            prices: [{ label: item.title, amount: item.stars }],
          }),
        });

        const data = (await res.json()) as { ok: boolean; result?: string; description?: string };
        if (!data.ok || !data.result) {
          return Response.json({ error: data.description ?? "Telegram error" }, { status: 502 });
        }
        return Response.json({ link: data.result });
      },
    },
  },
});
