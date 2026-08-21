export type InstrumentId =
  "lofi-pad" | "synth" | "drum-machine" | "grand-piano" | "neural-mixer" | "quantum-sampler";

export type Instrument = {
  id: InstrumentId;
  name: string;
  icon: string;
  desc: string;
  baseRate: number; // MUSIC per hour at level 1
  baseCost: number;
};

export const INSTRUMENTS: Instrument[] = [
  {
    id: "lofi-pad",
    name: "Lo-Fi Pad",
    icon: "AudioWaveform",
    desc: "Studio foundation. Steady, quiet income.",
    baseRate: 10,
    baseCost: 100,
  },
  {
    id: "synth",
    name: "Synthesizer",
    icon: "SlidersHorizontal",
    desc: "Electric waves that lift production.",
    baseRate: 26,
    baseCost: 450,
  },
  {
    id: "drum-machine",
    name: "Drum Machine",
    icon: "Drum",
    desc: "Faster rhythm means faster mining.",
    baseRate: 60,
    baseCost: 1800,
  },
  {
    id: "grand-piano",
    name: "Grand Piano",
    icon: "Piano",
    desc: "A premium piece with high yield.",
    baseRate: 145,
    baseCost: 7200,
  },
  {
    id: "neural-mixer",
    name: "Neural Mixer",
    icon: "Brain",
    desc: "AI balances every frequency for you.",
    baseRate: 340,
    baseCost: 26000,
  },
  {
    id: "quantum-sampler",
    name: "Quantum Sampler",
    icon: "Orbit",
    desc: "The most powerful rig in the studio.",
    baseRate: 820,
    baseCost: 95000,
  },
];

export const COST_GROWTH = 1.6;
export const RATE_GROWTH = 1.5;
export const BASE_STORAGE_HOURS = 6;
export const PREMIUM_STORAGE_HOURS = 24;

export function upgradeCost(inst: Instrument, level: number) {
  return Math.round(inst.baseCost * Math.pow(COST_GROWTH, level));
}

export function instrumentRate(inst: Instrument, level: number) {
  if (level <= 0) return 0;
  return inst.baseRate * Math.pow(RATE_GROWTH, level - 1);
}

export type TaskDef = {
  id: string;
  title: string;
  reward: number;
  kind: "daily" | "social" | "achievement";
  cta?: string;
  url?: string;
};

export const TASKS: TaskDef[] = [
  { id: "daily-checkin", title: "Daily check-in", reward: 250, kind: "daily" },
  { id: "daily-collect", title: "Collect earnings 3 times today", reward: 400, kind: "daily" },
  { id: "daily-upgrade", title: "Upgrade any instrument today", reward: 600, kind: "daily" },
  { id: "daily-track", title: "Generate an AI track", reward: 750, kind: "daily" },
  {
    id: "join-channel",
    title: "Join the Music AI channel",
    reward: 2000,
    kind: "social",
    cta: "Join",
    url: "https://t.me/",
  },
  {
    id: "follow-x",
    title: "Follow us on X",
    reward: 1500,
    kind: "social",
    cta: "Follow",
    url: "https://x.com/",
  },
  { id: "invite-1", title: "Invite your first friend", reward: 3000, kind: "achievement" },
  { id: "invite-5", title: "Invite 5 friends", reward: 12000, kind: "achievement" },
  { id: "level-10", title: "Reach level 10 on any instrument", reward: 20000, kind: "achievement" },
];

export type Track = {
  id: string;
  title: string;
  genre: string;
  mood: string;
  coverUrl: string | null;
  audioUrl: string | null;
  audioKey?: string;
  composition?: {
    bpm: number;
    key: string;
    chords: string[];
    melody: number[];
    description: string;
    lyrics?: string[];
    hook?: string;
  };
  bonusPct: number;
  createdAt: number;
  expiresAt: number;
};

import { NFTS, nftById } from "@/lib/nfts";
import { planById } from "@/lib/plans";

export type GameState = {
  balance: number;
  gram: number;
  usdt: number;
  minerLevels: Record<string, number>;
  levels: Record<string, number>;
  lastCollectAt: number;
  collectsToday: number;
  dayStamp: string;
  streak: number;
  claimedTasks: string[];
  tracks: Track[];
  premiumUntil: number;
  boosterUntil: number;
  referrals: number;
  refCode: string;
  walletAddress: string | null;
  bonusLevels: number;
  /** Crypto miners only run after a paid unlock. */
  minersUnlocked: { gram: boolean; usdt: boolean };
  /** Adsgram ads watched (for the ad milestones in Tasks). */
  adsWatched: number;
  /** USDT already paid out from the ad milestones. */
  adRewardsClaimed: string[];
  /** Owned Music NFT ids — permanent rigs. */
  nfts: string[];
  /** Lifetime subscription (planUntil is a far-future timestamp). */
  planId: string | null;
  planUntil: number;
};

export const STORAGE_KEY = "music-ai-state-v1";

/** Subscriptions never expire — this is the "forever" timestamp. */
export const FOREVER = 4_102_444_800_000; // 2100-01-01

export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function makeRefCode() {
  return "MUS" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function initialState(): GameState {
  return {
    balance: 0,
    gram: 0,
    usdt: 0,
    minerLevels: {},
    levels: {},
    lastCollectAt: Date.now(),
    collectsToday: 0,
    dayStamp: todayStamp(),
    streak: 0,
    claimedTasks: [],
    tracks: [],
    premiumUntil: 0,
    boosterUntil: 0,
    referrals: 0,
    refCode: makeRefCode(),
    walletAddress: null,
    bonusLevels: 0,
    minersUnlocked: { gram: false, usdt: false },
    adsWatched: 0,
    adRewardsClaimed: [],
    nfts: [WELCOME_NFT_ID],
    planId: null,
    planUntil: 0,
  };
}

/** The subscription plan currently active, if any. */
export function activePlan(s: GameState) {
  return s.planUntil > Date.now() ? planById(s.planId) : null;
}

export function isPremium(s: GameState) {
  return s.premiumUntil > Date.now() || activePlan(s) !== null;
}

/** The NFT everyone receives for free on first launch. */
export const WELCOME_NFT_ID = "welcome-nft";
/** Free NFT unlocked after inviting 5 friends. */
export const REFERRAL_NFT_ID = "friends-nft";
export const REFERRAL_NFT_TARGET = 5;

/** Owned NFTs, strongest first. */
export function ownedNfts(s: GameState) {
  return NFTS.filter((n) => (s.nfts ?? []).includes(n.id)).sort(
    (a, b) => b.usdtPerDay * 1e6 + b.musicPerDay - (a.usdtPerDay * 1e6 + a.musicPerDay),
  );
}

/** The strongest NFT the user owns — featured on the home screen. */
export function bestNft(s: GameState) {
  return ownedNfts(s)[0] ?? null;
}

/** MUSIC per hour produced by the owned record collection. */
export function nftMusicPerHour(s: GameState) {
  return ownedNfts(s).reduce((sum, n) => sum + n.musicPerDay, 0) / 24;
}

/** Crypto per hour produced by the owned record collection. */
export function nftCryptoPerHour(s: GameState, id: MinerId) {
  return (
    ownedNfts(s).reduce((sum, n) => sum + (id === "gram" ? n.gramPerDay : n.usdtPerDay), 0) / 24
  );
}

/** MUSIC per hour granted by each upgrade level. */
export const MUSIC_PER_POWER = 25;

export function baseRatePerHour(s: GameState) {
  const instruments = INSTRUMENTS.reduce(
    (sum, i) => sum + instrumentRate(i, s.levels[i.id] ?? 0),
    0,
  );
  return instruments + rigLevel(s) * MUSIC_PER_POWER + nftMusicPerHour(s);
}

export function activeTrack(s: GameState): Track | null {
  const now = Date.now();
  return s.tracks.find((t) => t.expiresAt > now) ?? null;
}

export function multiplier(s: GameState) {
  let m = 1;
  if (s.premiumUntil > Date.now()) m *= 2;

  if (s.boosterUntil > Date.now()) m *= 3;
  const t = activeTrack(s);
  if (t) m *= 1 + t.bonusPct / 100;
  m *= 1 + s.referrals * 0.1;
  return m;
}

export function ratePerHour(s: GameState) {
  return baseRatePerHour(s) * multiplier(s);
}

export function storageHours(s: GameState) {
  return isPremium(s) ? PREMIUM_STORAGE_HOURS : BASE_STORAGE_HOURS;
}

/** AI generations allowed per day. */
export function aiTracksPerDay(s: GameState) {
  return activePlan(s)?.aiTracks ?? (isPremium(s) ? 5 : 1);
}

export function pending(s: GameState, now = Date.now()) {
  const hours = Math.min((now - s.lastCollectAt) / 3_600_000, storageHours(s));
  return Math.max(0, hours * ratePerHour(s));
}

export function fillPct(s: GameState, now = Date.now()) {
  const hours = (now - s.lastCollectAt) / 3_600_000;
  return Math.min(100, (hours / storageHours(s)) * 100);
}

/** Earnings can only be collected once the full mining cycle has finished. */
export function cycleDone(s: GameState, now = Date.now()) {
  return fillPct(s, now) >= 100;
}

/** Milliseconds left before the current mining cycle completes. */
export function msLeft(s: GameState, now = Date.now()) {
  return Math.max(0, s.lastCollectAt + storageHours(s) * 3_600_000 - now);
}

export function formatDuration(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/* ---------------- Crypto miners: GRAM & USDT ---------------- */

export type MinerId = "gram" | "usdt";

export type Miner = {
  id: MinerId;
  name: string;
  symbol: string;
  desc: string;
  icon: string;
  baseRate: number; // coins per hour at level 1
  baseCost: number; // MUSIC cost for level 1
  minWithdraw: number;
};

export const MINERS: Miner[] = [
  {
    id: "gram",
    name: "GRAM Extractor",
    symbol: "GRAM",
    desc: "Mines GRAM, the TON network coin, straight into your wallet.",
    icon: "Gem",
    baseRate: 0.0025,
    baseCost: 250_000,
    minWithdraw: 1,
  },
  {
    id: "usdt",
    name: "USDT Rig",
    symbol: "USDT",
    desc: "Converts studio output into stable USDT every hour.",
    icon: "DollarSign",
    baseRate: 0.0009,
    baseCost: 600_000,
    minWithdraw: 5,
  },
];

export const MINER_COST_GROWTH = 1.75;
export const MINER_RATE_GROWTH = 1.45;

export function minerUpgradeCost(m: Miner, level: number) {
  return Math.round(m.baseCost * Math.pow(MINER_COST_GROWTH, level));
}

/** Total upgrade levels across the whole studio — every upgrade feeds all three coins. */
export function rigLevel(s: GameState) {
  const inst = INSTRUMENTS.reduce((sum, i) => sum + (s.levels[i.id] ?? 0), 0);
  return inst + (s.bonusLevels ?? 0);
}

export function minerUnlocked(s: GameState, id: MinerId) {
  if (s.minersUnlocked?.[id]) return true;
  return ownedNfts(s).some((n) => n.unlocks.includes(id));
}

/** Crypto boost from a temporary booster. Membership plans never touch mining. */
export function cryptoBoost(s: GameState) {
  return s.boosterUntil > Date.now() ? 1.25 : 1;
}

/** Coins this NFT alone produces per day, for the three record counters. */
export function nftDaily(s: GameState, nftId: string) {
  const n = nftById(nftId);
  if (!n) return { music: 0, gram: 0, usdt: 0 };
  const boost = cryptoBoost(s);
  return {
    music: n.musicPerDay * multiplier(s),
    gram: n.gramPerDay * boost,
    usdt: n.usdtPerDay * boost,
  };
}

export function minerRate(s: GameState, m: Miner) {
  if (!minerUnlocked(s, m.id)) return 0;
  return nftCryptoPerHour(s, m.id) * cryptoBoost(s);
}

export function minerPending(s: GameState, m: Miner, now = Date.now()) {
  const hours = Math.min((now - s.lastCollectAt) / 3_600_000, storageHours(s));
  return Math.max(0, hours * minerRate(s, m));
}

export function formatCrypto(n: number) {
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
}

export function formatNumber(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toFixed(n < 100 ? 2 : 0);
}

/* ---------------- Alternative payment pricing ---------------- */

/** GRAM price for a MUSIC-denominated upgrade cost. */
export function gramForCost(musicCost: number) {
  return Math.max(0.05, Math.round((musicCost / 400_000) * 100) / 100);
}

/** Telegram Stars price for a MUSIC-denominated upgrade cost. */
export function starsForCost(musicCost: number) {
  return Math.max(15, Math.ceil(musicCost / 1500));
}

/* ---------------- Adsgram reward milestones ---------------- */

export type AdMilestone = { id: string; ads: number; usdt: number };

export const AD_MILESTONES: AdMilestone[] = [
  { id: "ads-500", ads: 500, usdt: 5 },
  { id: "ads-1000", ads: 1000, usdt: 12.5 },
];
