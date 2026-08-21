import type { LucideIcon } from "lucide-react";
import { Crown, DollarSign, Gem, Rocket, Sparkles, Zap } from "lucide-react";

/** Project TON wallet that receives every on-chain payment. */
export const TON_WALLET = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj";

export type ShopItemId =
  "premium" | "booster" | "tracks10" | "coins" | "gram-rig" | "usdt-rig" | "mega";

export type ShopCategory = "miners" | "boosts" | "bundles";

export type ShopItem = {
  id: ShopItemId;
  category: ShopCategory;
  title: string;
  desc: string;
  /** Short bullet list explaining exactly what the buyer receives. */
  perks: string[];
  stars: number;
  ton: number; // priced in GRAM (TON network coin)
  icon: LucideIcon;
  badge?: string;
  highlight?: boolean;
};

export const SHOP_CATEGORIES: { id: ShopCategory; label: string; hint: string }[] = [
  { id: "miners", label: "Miners", hint: "Unlock GRAM & USDT mining — the only way to earn them" },
  { id: "boosts", label: "Boosts", hint: "Multiply what your studio produces every hour" },
  { id: "bundles", label: "Bundles", hint: "Everything at once, at the lowest price per item" },
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "gram-rig",
    category: "miners",
    title: "GRAM Miner",
    desc: "Turns on GRAM mining on your account.",
    perks: ["Unlocks GRAM mining", "+5 rig levels instantly", "Withdrawable from 1 GRAM"],
    stars: 900,
    ton: 4.2,
    icon: Gem,
    badge: "Unlock",
    highlight: true,
  },
  {
    id: "usdt-rig",
    category: "miners",
    title: "USDT Miner",
    desc: "Turns on stablecoin mining on your account.",
    perks: ["Unlocks USDT mining", "+5 rig levels instantly", "Withdrawable from 5 USDT"],
    stars: 1400,
    ton: 6.5,
    icon: DollarSign,
    badge: "Unlock",
  },
  {
    id: "premium",
    category: "boosts",
    title: "Premium — 30 days",
    desc: "The full studio, doubled, for a month.",
    perks: ["2x on all three coins", "Unlocks GRAM + USDT mining", "24h storage · 5 AI tracks/day"],
    stars: 250,
    ton: 1.2,
    icon: Crown,
    badge: "Best value",
    highlight: true,
  },
  {
    id: "booster",
    category: "boosts",
    title: "3x Booster — 8 hours",
    desc: "A short, powerful burst of output.",
    perks: ["3x MUSIC per hour", "1.5x GRAM & USDT", "Stacks with Premium"],
    stars: 75,
    ton: 0.4,
    icon: Zap,
  },
  {
    id: "tracks10",
    category: "boosts",
    title: "10 AI tracks",
    desc: "Extra generations beyond your daily limit.",
    perks: ["10 AI track generations", "Each track adds a mining bonus", "Never expires"],
    stars: 100,
    ton: 0.5,
    icon: Sparkles,
  },
  {
    id: "coins",
    category: "bundles",
    title: "250,000 MUSIC",
    desc: "A bag of in-app coins.",
    perks: ["250,000 MUSIC instantly", "Spend it anywhere in the app"],
    stars: 400,
    ton: 1.9,
    icon: Rocket,
  },
  {
    id: "mega",
    category: "bundles",
    title: "Mega Bundle",
    desc: "Everything a new studio needs, in one purchase.",
    perks: [
      "Premium 30 days + 3x Booster",
      "GRAM & USDT mining unlocked",
      "1,000,000 MUSIC + 3 rig levels",
    ],
    stars: 2500,
    ton: 11.5,
    icon: Gem,
    badge: "Save 40%",
    highlight: true,
  },
];

/** Short unique memo the wallet sends as a transfer comment so we can match it. */
export function makeMemo(itemId: ShopItemId) {
  return `MA-${itemId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function tonkeeperLink(amountTon: number, memo: string) {
  const nano = Math.round(amountTon * 1e9);
  return `https://app.tonkeeper.com/transfer/${TON_WALLET}?amount=${nano}&text=${encodeURIComponent(memo)}`;
}

/**
 * Builds the base64 BOC of a simple text-comment message body so TON Connect
 * can send the transfer automatically — the user never types a comment.
 */
export function commentPayload(text: string) {
  const body = new TextEncoder().encode(text);
  const data = new Uint8Array(4 + body.length); // op = 0x00000000 (text comment)
  data.set(body, 4);

  const cell = new Uint8Array(2 + data.length);
  cell[0] = 0; // no refs, ordinary cell
  cell[1] = data.length * 2; // all bytes are complete
  cell.set(data, 2);

  // header: magic, flags/size=1, off_bytes=1, cells=1, roots=1, absent=0
  const full = new Uint8Array([
    0xb5,
    0xee,
    0x9c,
    0x72,
    0x01,
    0x01,
    0x01,
    0x01,
    0x00,
    cell.length,
    0x00,
    ...cell,
  ]);

  let bin = "";
  for (const b of full) bin += String.fromCharCode(b);
  return btoa(bin);
}

type TelegramWebApp = {
  openLink?: (url: string, opts?: { try_instant_view?: boolean }) => void;
  openTelegramLink?: (url: string) => void;
  openInvoice?: (url: string, cb: (status: string) => void) => void;
  initData?: string;
  initDataUnsafe?: { user?: { id: number; username?: string; first_name?: string } };
  HapticFeedback?: {
    notificationOccurred?: (t: "success" | "error" | "warning") => void;
    impactOccurred?: (t: "light" | "medium" | "heavy") => void;
  };
  BackButton?: {
    show?: () => void;
    hide?: () => void;
    onClick?: (cb: () => void) => void;
    offClick?: (cb: () => void) => void;
  };
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  safeAreaInset?: { top?: number; bottom?: number };
  contentSafeAreaInset?: { top?: number; bottom?: number };
};

export function telegram(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp ?? null;
}

export function openExternal(url: string) {
  const tg = telegram();
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}
