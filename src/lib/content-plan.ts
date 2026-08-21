/**
 * 90-day channel content plan for Music AI.
 * Each day = one post: caption + image prompt + CTA button label.
 * Rotates through 6 themes so the channel never feels repetitive.
 */

export type PlanPost = {
  day: number;
  theme: string;
  title: string;
  caption: string;
  imagePrompt: string;
  cta: string;
};

const THEMES = [
  {
    theme: "Mining",
    title: (d: number) => `Studio session #${d}`,
    caption: (d: number) =>
      `*Day ${d} — the studio never sleeps*\n\nYour instruments keep mining $MUSIC while you are away, but storage fills up in 8 hours.\n\nCollect today's output, upgrade one instrument, and watch your hourly rate climb.\n\n_Tap below and collect before the buffer overflows._`,
    imagePrompt:
      "minimal futuristic music studio, glowing mixing console, soft blue light, clean iOS style product render, no text",
    cta: "Collect now",
  },
  {
    theme: "AI Studio",
    title: (d: number) => `AI track of the day #${d}`,
    caption: (d: number) =>
      `*AI track of the day*\n\nDescribe a mood — the AI writes the chords, melody and rhythm, and the app plays the real track back to you.\n\nEvery generated track adds a 24h mining bonus on top of your base rate.\n\n_Day ${d}: try "midnight lo-fi rain" and hear what comes out._`,
    imagePrompt:
      "abstract sound waves forming a neural network, deep blue and white, clean minimal poster, high detail, no text",
    cta: "Generate a track",
  },
  {
    theme: "GRAM mining",
    title: (d: number) => `GRAM extractor report #${d}`,
    caption: (d: number) =>
      `*GRAM is flowing*\n\nThe GRAM Extractor turns studio output into real TON-network GRAM, every single hour.\n\nEach rig level multiplies the payout by 1.4x, and Premium doubles it again.\n\n_Day ${d} — unlock or upgrade your rig in the Studio tab._`,
    imagePrompt:
      "glowing crystal gem floating over a dark chrome machine, cinematic lighting, clean product shot, no text",
    cta: "Open the Studio",
  },
  {
    theme: "USDT mining",
    title: (d: number) => `Stable payout #${d}`,
    caption: (d: number) =>
      `*Stable output, every hour*\n\nThe USDT Rig pays in the one coin that never moves. No charts, no stress — just steady accumulation.\n\nMinimum withdrawal is 5 USDT, and Premium doubles the rate.\n\n_Day ${d}: check how close you are._`,
    imagePrompt:
      "stack of glowing digital coins on a clean white pedestal, soft studio light, minimal 3d render, no text",
    cta: "Check my balance",
  },
  {
    theme: "Referral",
    title: (d: number) => `Bring the band #${d}`,
    caption: (d: number) =>
      `*Your friends mine for you*\n\nEvery invite pays you an instant MUSIC bonus plus a permanent cut of what they mine.\n\nFive friends is already a noticeable jump in your hourly rate.\n\n_Day ${d} — share your link, it takes ten seconds._`,
    imagePrompt:
      "three abstract glowing spheres connected by light lines, dark clean background, minimal 3d, no text",
    cta: "Get my invite link",
  },
  {
    theme: "Offer",
    title: (d: number) => `Limited drop #${d}`,
    caption: (d: number) =>
      `*Today's drop*\n\nPremium Pass: 2x on every coin you mine, 24h storage and daily AI tracks.\n\nPay with Telegram Stars or GRAM — the pass activates instantly.\n\n_Day ${d}: the bundles are the best value in the shop._`,
    imagePrompt:
      "premium black card with subtle gold edge floating in soft light, luxury minimal product render, no text",
    cta: "Open the shop",
  },
];

export const PLAN_LENGTH = 90;

export function getPost(dayIndex: number): PlanPost {
  const day = (dayIndex % PLAN_LENGTH) + 1;
  const t = THEMES[dayIndex % THEMES.length]!;
  return {
    day,
    theme: t.theme,
    title: t.title(day),
    caption: t.caption(day),
    imagePrompt: t.imagePrompt,
    cta: t.cta,
  };
}
