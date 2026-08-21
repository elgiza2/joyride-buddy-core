import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INSTRUMENTS,
  AD_MILESTONES,
  FOREVER,
  MINERS,
  REFERRAL_NFT_ID,
  REFERRAL_NFT_TARGET,
  STORAGE_KEY,
  WELCOME_NFT_ID,
  cycleDone,
  initialState,
  minerPending,
  pending,
  todayStamp,
  type GameState,
  type MinerId,
  type Track,
} from "@/lib/game";

type Ctx = {
  state: GameState;
  now: number;
  ready: boolean;
  collect: () => { music: number; gram: number; usdt: number };
  upgrade: (id: string) => boolean;
  upgradeMiner: (id: MinerId) => boolean;
  claimTask: (id: string, reward: number) => void;
  addTrack: (t: Track) => void;
  grant: (amount: number) => void;
  buy: (kind: "premium" | "booster" | "coins" | "gram" | "usdt", amount?: number) => void;
  addReferral: () => void;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  withdraw: (id: MinerId) => boolean;
  payWithGram: (amount: number) => boolean;
  unlockMiner: (id: MinerId) => void;
  watchedAd: () => void;
  claimAdMilestone: (id: string) => boolean;
  addNft: (id: string) => void;
  activateSubscription: (planId: string) => void;
  reset: () => void;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => initialState());
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...initialState(), ...(JSON.parse(raw) as GameState) };
        /* Everyone owns the free welcome record. */
        if (!(parsed.nfts ?? []).includes(WELCOME_NFT_ID)) {
          parsed.nfts = [...(parsed.nfts ?? []), WELCOME_NFT_ID];
        }
        if (parsed.referrals >= REFERRAL_NFT_TARGET && !parsed.nfts.includes(REFERRAL_NFT_ID)) {
          parsed.nfts = [...parsed.nfts, REFERRAL_NFT_ID];
        }
        const today = todayStamp();
        if (parsed.dayStamp !== today) {
          const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
          parsed.streak = parsed.dayStamp === yesterday ? parsed.streak + 1 : 1;
          parsed.dayStamp = today;
          parsed.collectsToday = 0;
          parsed.claimedTasks = parsed.claimedTasks.filter((t) => !t.startsWith("daily-"));
        }
        setState(parsed);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const collect = useCallback(() => {
    let gained = { music: 0, gram: 0, usdt: 0 };
    setState((s) => {
      if (!cycleDone(s)) return s;
      const music = pending(s);
      const gram = minerPending(s, MINERS[0]!);
      const usdt = minerPending(s, MINERS[1]!);
      if (music <= 0 && gram <= 0 && usdt <= 0) return s;
      gained = { music, gram, usdt };
      return {
        ...s,
        balance: s.balance + music,
        gram: s.gram + gram,
        usdt: s.usdt + usdt,
        lastCollectAt: Date.now(),
        collectsToday: s.collectsToday + 1,
      };
    });
    return gained;
  }, []);

  const upgrade = useCallback((id: string) => {
    let ok = false;
    setState((s) => {
      if (!INSTRUMENTS.some((i) => i.id === id)) return s;
      const level = s.levels[id] ?? 0;
      ok = true;
      return {
        ...s,
        levels: { ...s.levels, [id]: level + 1 },
      };
    });
    return ok;
  }, []);

  const upgradeMiner = useCallback((_id: MinerId) => {
    setState((s) => ({ ...s, bonusLevels: (s.bonusLevels ?? 0) + 1 }));
    return true;
  }, []);

  const claimTask = useCallback((id: string, reward: number) => {
    setState((s) =>
      s.claimedTasks.includes(id)
        ? s
        : { ...s, balance: s.balance + reward, claimedTasks: [...s.claimedTasks, id] },
    );
  }, []);

  const addTrack = useCallback((t: Track) => {
    setState((s) => ({ ...s, tracks: [t, ...s.tracks].slice(0, 30) }));
  }, []);

  const grant = useCallback((amount: number) => {
    setState((s) => ({ ...s, balance: s.balance + amount }));
  }, []);

  const buy = useCallback((kind: "premium" | "booster" | "coins" | "gram" | "usdt", amount = 0) => {
    setState((s) => {
      if (kind === "premium")
        return {
          ...s,
          premiumUntil: Math.max(s.premiumUntil, Date.now()) + 30 * 86_400_000,
          minersUnlocked: { gram: true, usdt: true },
        };
      if (kind === "booster")
        return { ...s, boosterUntil: Math.max(s.boosterUntil, Date.now()) + 8 * 3_600_000 };
      if (kind === "gram" || kind === "usdt")
        return {
          ...s,
          bonusLevels: (s.bonusLevels ?? 0) + amount,
          minersUnlocked: { ...s.minersUnlocked, [kind]: true },
        };
      return { ...s, balance: s.balance + amount };
    });
  }, []);

  const addReferral = useCallback(() => {
    setState((s) => {
      const referrals = s.referrals + 1;
      const nfts =
        referrals >= REFERRAL_NFT_TARGET && !(s.nfts ?? []).includes(REFERRAL_NFT_ID)
          ? [...(s.nfts ?? []), REFERRAL_NFT_ID]
          : s.nfts;
      return { ...s, referrals, balance: s.balance + 1000, nfts };
    });
  }, []);

  const connectWallet = useCallback((address: string) => {
    setState((s) => ({ ...s, walletAddress: address.trim() }));
  }, []);

  const disconnectWallet = useCallback(() => {
    setState((s) => ({ ...s, walletAddress: null }));
  }, []);

  const withdraw = useCallback((id: MinerId) => {
    let ok = false;
    setState((s) => {
      const miner = MINERS.find((m) => m.id === id);
      if (!miner || !s.walletAddress) return s;
      const balance = id === "gram" ? s.gram : s.usdt;
      if (balance < miner.minWithdraw) return s;
      ok = true;
      return id === "gram" ? { ...s, gram: 0 } : { ...s, usdt: 0 };
    });
    return ok;
  }, []);

  const payWithGram = useCallback((amount: number) => {
    let ok = false;
    setState((s) => {
      if (s.gram < amount) return s;
      ok = true;
      return { ...s, gram: s.gram - amount };
    });
    return ok;
  }, []);

  const unlockMiner = useCallback((id: MinerId) => {
    setState((s) => ({ ...s, minersUnlocked: { ...s.minersUnlocked, [id]: true } }));
  }, []);

  const watchedAd = useCallback(() => {
    setState((s) => ({ ...s, adsWatched: (s.adsWatched ?? 0) + 1 }));
  }, []);

  const claimAdMilestone = useCallback((id: string) => {
    let ok = false;
    setState((s) => {
      const m = AD_MILESTONES.find((x) => x.id === id);
      if (!m || (s.adsWatched ?? 0) < m.ads || s.adRewardsClaimed.includes(id)) return s;
      ok = true;
      return { ...s, usdt: s.usdt + m.usdt, adRewardsClaimed: [...s.adRewardsClaimed, id] };
    });
    return ok;
  }, []);

  const addNft = useCallback((id: string) => {
    setState((s) => ((s.nfts ?? []).includes(id) ? s : { ...s, nfts: [...(s.nfts ?? []), id] }));
  }, []);

  /** Subscriptions are one-off and last forever. */
  const activateSubscription = useCallback((planId: string) => {
    setState((s) => ({ ...s, planId, planUntil: FOREVER }));
  }, []);

  const reset = useCallback(() => setState(initialState()), []);

  const value = useMemo(
    () => ({
      state,
      now,
      ready,
      collect,
      upgrade,
      upgradeMiner,
      claimTask,
      addTrack,
      grant,
      buy,
      addReferral,
      connectWallet,
      disconnectWallet,
      withdraw,
      payWithGram,
      unlockMiner,
      watchedAd,
      claimAdMilestone,
      addNft,
      activateSubscription,
      reset,
    }),
    [
      state,
      now,
      ready,
      collect,
      upgrade,
      upgradeMiner,
      claimTask,
      addTrack,
      grant,
      buy,
      addReferral,
      connectWallet,
      disconnectWallet,
      withdraw,
      payWithGram,
      unlockMiner,
      watchedAd,
      claimAdMilestone,
      addNft,
      activateSubscription,
      reset,
    ],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
