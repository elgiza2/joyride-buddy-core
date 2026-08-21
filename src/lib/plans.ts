export type PlanId = "starter" | "pro" | "elite";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** AI songs the member can generate per day. */
  aiTracks: number;
  /** Everything the membership includes, in plain language. */
  perks: string[];
  stars: number; // one-time Telegram Stars price
  gram: number; // one-time GRAM price
  highlight?: boolean;
  badge?: string;
};

/**
 * Memberships are a creator pass — they unlock studio features.
 * They never change mining: only Music NFTs mine coins.
 */
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For your first songs",
    aiTracks: 3,
    perks: [
      "3 AI songs every day",
      "Save your songs forever",
      "No ads inside the studio",
      "Starter badge on your profile",
    ],
    stars: 250,
    gram: 1.2,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For everyday creators",
    aiTracks: 10,
    perks: [
      "10 AI songs every day",
      "Voice-to-song with your own vocals",
      "HD cover art for every track",
      "Faster withdrawal review",
      "Pro badge on your profile",
    ],
    stars: 650,
    gram: 3.2,
    highlight: true,
    badge: "Most popular",
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "Everything, unlimited feel",
    aiTracks: 30,
    perks: [
      "30 AI songs every day",
      "Longest tracks and studio-grade quality",
      "Early access to every new NFT drop",
      "Priority support from the team",
      "Elite badge on your profile",
    ],
    stars: 1500,
    gram: 7.4,
    badge: "Best value",
  },
];

export function planById(id: string | null | undefined) {
  return PLANS.find((p) => p.id === id) ?? null;
}
