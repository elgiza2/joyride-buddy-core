import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { AudioLines, CircleCheckBig, Disc3, Gem, Wallet } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { BoomerangVideoBg } from "@/components/BoomerangVideoBg";
import { telegram } from "@/lib/payments";

const NAV = [
  { to: "/", label: "Mine", icon: Gem },
  { to: "/studio", label: "NFTs", icon: Disc3 },
  { to: "/ai", label: "AI", icon: AudioLines },
  { to: "/tasks", label: "Tasks", icon: CircleCheckBig },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  /* Telegram chrome: full screen + safe-area vars + native Back button. */
  useEffect(() => {
    const tg = telegram();
    if (!tg) return;
    const safe = (fn?: () => void) => {
      try {
        fn?.();
      } catch {
        /* older Telegram clients don't support every method */
      }
    };
    safe(() => tg.ready?.());
    safe(() => tg.expand?.());
    safe(() => tg.requestFullscreen?.());
    safe(() => tg.disableVerticalSwipes?.());
    safe(() => tg.setHeaderColor?.("#000000"));
    safe(() => tg.setBackgroundColor?.("#000000"));

    const syncInsets = () => {
      const root = document.documentElement;
      const top = tg.safeAreaInset?.top ?? 0;
      const contentTop = tg.contentSafeAreaInset?.top ?? 0;
      const bottom = tg.safeAreaInset?.bottom ?? 0;
      root.style.setProperty("--tg-safe-area-inset-top", `${top}px`);
      root.style.setProperty("--tg-content-safe-area-inset-top", `${contentTop}px`);
      root.style.setProperty("--tg-safe-area-inset-bottom", `${bottom}px`);
    };
    syncInsets();
    tg.onEvent?.("safeAreaChanged", syncInsets);
    tg.onEvent?.("contentSafeAreaChanged", syncInsets);
    tg.onEvent?.("fullscreenChanged", syncInsets);
    tg.onEvent?.("viewportChanged", syncInsets);
    return () => {
      tg.offEvent?.("safeAreaChanged", syncInsets);
      tg.offEvent?.("contentSafeAreaChanged", syncInsets);
      tg.offEvent?.("fullscreenChanged", syncInsets);
      tg.offEvent?.("viewportChanged", syncInsets);
    };
  }, []);

  useEffect(() => {
    const tg = telegram();
    const back = tg?.BackButton;
    if (!back) return;
    const goBack = () => {
      if (window.history.length > 1) router.history.back();
      else router.navigate({ to: "/" });
    };
    if (pathname === "/") {
      back.hide?.();
      return;
    }
    back.onClick?.(goBack);
    back.show?.();
    return () => {
      back.offClick?.(goBack);
      back.hide?.();
    };
  }, [pathname, router]);

  return (
    <div className="relative min-h-screen w-full">
      <BoomerangVideoBg />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col">
        {/* Safe area so the Telegram header controls never overlap the content. */}
        <div aria-hidden className="tg-safe-top shrink-0" />

        {/* No remount key here: remounting on every path change caused the
            annoying "flash of refresh" between tabs. */}
        <main className="flex-1 px-4 pb-32 pt-2">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4"
          style={{
            paddingBottom:
              "calc(1rem + var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))",
          }}
        >
          <div className="liquid-glass relative flex items-center rounded-[26px] p-1.5">
            {/* Sliding iOS-style highlight */}
            <span
              aria-hidden
              className="tab-pill pointer-events-none absolute inset-y-1.5 left-1.5 rounded-[20px] bg-white/14 ring-1 ring-white/20"
              style={{
                width: `calc((100% - 0.75rem) / ${NAV.length})`,
                transform: `translateX(calc(${Math.max(
                  0,
                  NAV.findIndex((n) => n.to === pathname),
                )} * 100%))`,
                opacity: NAV.some((n) => n.to === pathname) ? 1 : 0,
              }}
            />
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => telegram()?.HapticFeedback?.impactOccurred?.("light")}
                  className={`relative z-10 flex flex-1 flex-col items-center gap-1 rounded-[20px] px-1 py-2 text-[10px] tracking-tight transition-transform duration-200 active:scale-90 ${
                    active ? "text-foreground" : "text-foreground/45"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.3 : 1.7}
                    className={`transition-transform duration-300 ${active ? "-translate-y-px scale-110" : ""}`}
                  />
                  <span className={active ? "opacity-100" : "opacity-80"}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
