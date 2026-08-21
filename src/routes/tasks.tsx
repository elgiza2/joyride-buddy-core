import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Flame, Loader2, Play, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { useGramPay } from "@/hooks/useGramPay";
import { AD_MILESTONES, formatNumber } from "@/lib/game";
import { showRewardedAd } from "@/lib/adsgram";
import { ReferralPanel } from "@/components/ReferralPanel";
import { CoinIcon, GramIcon } from "@/components/CoinIcon";
import { telegram } from "@/lib/payments";
import {
  completeTask,
  createTaskRequest,
  listTasks,
  TASK_ADMIN_USERNAME,
  TASK_LISTING_GRAM,
  type PublicTask,
} from "@/lib/tasks.functions";
import joinChannel from "@/assets/tasks/join-channel.jpg";
import { TelegramLogo } from "@/components/TelegramLogo";
import { readCache, writeCache } from "@/lib/ui-cache";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks & Invite | Music AI" },
      {
        name: "description",
        content: "Complete tasks, watch ads and invite friends to earn free MUSIC and USDT.",
      },
      { property: "og:title", content: "Tasks & Invite | Music AI" },
      { property: "og:description", content: "Tasks, rewarded ads and referral rewards." },
    ],
  }),
  component: TasksPage,
});

function player() {
  const user = telegram()?.initDataUnsafe?.user;
  return {
    key: user?.id ? `tg:${user.id}` : "guest",
    id: user?.id ?? null,
    username: user?.username ?? null,
  };
}

function TasksPage() {
  const [tab, setTab] = useState<"tasks" | "invite">("tasks");

  return (
    <div className="space-y-3">
      <div className="liquid-glass animate-fade-up grid grid-cols-2 gap-1 rounded-2xl p-1.5">
        {(["tasks", "invite"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2 text-xs capitalize transition-transform duration-200 active:scale-95 ${
              tab === t ? "bg-white text-gray-900" : "text-foreground/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "tasks" ? <TasksTab /> : <ReferralPanel />}
    </div>
  );
}

function AdsSection() {
  const { state, watchedAd, claimAdMilestone } = useGame();
  const [loading, setLoading] = useState(false);
  const watched = state.adsWatched ?? 0;

  const watch = async () => {
    setLoading(true);
    try {
      const done = await showRewardedAd();
      if (!done) {
        toast("Ad skipped", { description: "Watch the full ad to get credit." });
        return;
      }
      watchedAd();
      toast.success(`Ad ${watched + 1} watched`);
    } catch {
      toast.error("No ads available right now", { description: "Try again in a moment." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="animate-fade-up delay-1 space-y-2">
      <h2 className="px-1 text-sm text-foreground/70">Watch &amp; earn</h2>

      <div className="liquid-glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm">Ads watched</p>
          <p className="text-lg tracking-tight">{watched}</p>
        </div>
        <button
          onClick={watch}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm text-gray-900 transition-transform duration-200 active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          Watch an ad
        </button>
      </div>

      {AD_MILESTONES.map((m) => {
        const claimed = state.adRewardsClaimed.includes(m.id);
        const ready = watched >= m.ads;
        const pct = Math.min(100, (watched / m.ads) * 100);
        return (
          <div key={m.id} className="liquid-glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <CoinIcon id="usdt" size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">Watch {m.ads} ads</p>
                <p className="text-[11px] text-foreground/60">
                  Reward ${m.usdt} in USDT · {Math.min(watched, m.ads)}/{m.ads}
                </p>
              </div>
              <button
                disabled={!ready || claimed}
                onClick={() => {
                  if (claimAdMilestone(m.id)) toast.success(`+$${m.usdt} USDT added`);
                }}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs transition-transform duration-200 active:scale-95 ${
                  claimed || !ready ? "glass-thin text-foreground/50" : "bg-white text-gray-900"
                }`}
              >
                {claimed ? "Done" : ready ? "Claim" : `$${m.usdt}`}
              </button>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-700 transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** Pay 10 GRAM to get your own task listed — the admin contact appears after payment. */
function AddTaskCard() {
  const { pay, pending } = useGramPay();
  const request = createTaskRequest;
  const [admin, setAdmin] = useState<string | null>(null);

  const start = () => {
    const p = player();
    pay("task-listing", TASK_LISTING_GRAM, "Task listing", async () => {
      try {
        const res = await request({
          data: { playerKey: p.key, username: p.username ?? undefined },
        });
        setAdmin(res.admin);
        toast.success("Payment received", { description: "Message the admin to set up your task." });
      } catch {
        toast.error("Saved payment, but the contact could not load");
      }
    });
  };

  return (
    <section className="liquid-glass animate-fade-up delay-2 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Plus size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm">Add your task here</p>
          <p className="text-[11px] text-foreground/55">
            List your channel or app for everyone — {TASK_LISTING_GRAM} GRAM one-off fee.
          </p>
        </div>
      </div>

      {admin ? (
        <a
          href={`https://t.me/${admin}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm text-gray-900 transition-transform duration-200 active:scale-95"
        >
          <Send size={15} /> Message @{admin}
        </a>
      ) : (
        <button
          onClick={start}
          disabled={pending === "task-listing"}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm text-gray-900 transition-transform duration-200 active:scale-95 disabled:opacity-60"
        >
          {pending === "task-listing" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <GramIcon size={15} />
          )}
          Pay {TASK_LISTING_GRAM} GRAM
        </button>
      )}
    </section>
  );
}

function TasksTab() {
  const { state, claimTask } = useGame();
  const fetchTasks = listTasks;
  const finish = completeTask;
  const [tasks, setTasks] = useState<PublicTask[]>(() => readCache<PublicTask[]>("tasks") ?? []);
  const [loading, setLoading] = useState(() => (readCache<PublicTask[]>("tasks") ? false : true));
  const [busy, setBusy] = useState<string | null>(null);
  const [opened, setOpened] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const rows = await fetchTasks({ data: { playerKey: player().key } });
      setTasks(rows);
      writeCache("tasks", rows);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [fetchTasks]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (t: PublicTask) => {
    const p = player();
    if (t.linkUrl && !opened[t.id]) {
      const tg = telegram();
      if (tg?.openTelegramLink && t.linkUrl.includes("t.me")) tg.openTelegramLink(t.linkUrl);
      else window.open(t.linkUrl, "_blank");
      setOpened((o) => ({ ...o, [t.id]: true }));
      return;
    }

    setBusy(t.id);
    try {
      const res = await finish({
        data: { playerKey: p.key, taskId: t.id, telegramId: p.id ?? undefined },
      });
      if (!res.ok) {
        toast.error(res.error ?? "Could not verify this task");
        return;
      }
      if (res.reward) claimTask(t.id, res.reward);
      setTasks((list) => list.filter((x) => x.id !== t.id));
      toast.success(`+${formatNumber(res.reward ?? 0)} MUSIC`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="liquid-glass animate-fade-up delay-1 rounded-2xl p-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <Flame size={18} strokeWidth={2} className="text-blue-500" />
          <p className="text-3xl tracking-tight">{state.streak}</p>
        </div>
        <p className="mt-1 text-[11px] text-foreground/60">
          Day streak — every consecutive day adds 10% to your check-in reward
        </p>
      </section>

      <AdsSection />

      <section className="animate-fade-up delay-2 space-y-2">
        <h2 className="px-1 text-sm text-foreground/70">Tasks</h2>

        {loading ? (
          <div className="liquid-glass flex items-center justify-center rounded-2xl py-8">
            <Loader2 size={18} className="animate-spin text-foreground/50" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="liquid-glass rounded-2xl py-6 text-center text-[11px] text-foreground/50">
            No tasks right now — new ones arrive regularly.
          </p>
        ) : (
          tasks.map((t) => {
            const needsCheck = Boolean(t.linkUrl) && opened[t.id];
            return (
              <div key={t.id} className="liquid-glass flex items-center gap-3 rounded-2xl p-3">
                {t.imageUrl ? (
                  <img
                    src={t.imageUrl}
                    alt=""
                    width={112}
                    height={112}
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : t.linkUrl?.includes("t.me") ? (
                  <TelegramLogo size={40} />
                ) : (
                  <img
                    src={joinChannel}
                    alt=""
                    width={112}
                    height={112}
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{t.title}</p>
                  <p className="text-[11px] text-foreground/60">
                    +{formatNumber(t.reward)} MUSIC
                  </p>
                </div>
                <button
                  disabled={busy === t.id}
                  onClick={() => act(t)}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs text-gray-900 transition-transform duration-200 active:scale-95 disabled:opacity-60"
                >
                  {busy === t.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : needsCheck ? (
                    <Check size={13} strokeWidth={2} />
                  ) : (
                    <ExternalLink size={13} strokeWidth={2} />
                  )}
                  {needsCheck ? "Check" : "Go"}
                </button>
              </div>
            );
          })
        )}
      </section>

      <AddTaskCard />
    </div>
  );
}
