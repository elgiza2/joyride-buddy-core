/**
 * UpgradePlanButton — premium emerald payment CTA for Megsy.
 *
 * Two-plan model (Pro + Max only):
 *   free  → "Get Pro"          (احصل على برو)
 *   pro   → "Upgrade to Max"   (الترقية إلى ماكس)
 *   max   → hidden             (already at top tier)
 *
 * Design spec:
 *   - Glassmorphism dark base: semi-transparent black (rgba(0,0,0,0.65)).
 *   - Clean emerald border (#50C878) as the single accent.
 *   - Hollow emerald star with no background wrapper, sitting directly on the button.
 *   - Soft emerald glow around the button, intensifying on hover.
 *   - Smooth transitions, premium finish, RTL/AR ready, reduced-motion safe.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MegsyStar from "@/components/files/MegsyStar";
import { useCredits } from "@/hooks/useCredits";
import { prefetchRoute } from "@/hooks/usePrefetchRoute";
import { useUserLang } from "@/lib/authI18n";
import { cn } from "@/lib/utils";

const EMERALD = "#50C878";
const EMERALD_GLOW = "rgba(80, 200, 120, 0.55)";
const EMERALD_GLOW_SOFT = "rgba(80, 200, 120, 0.22)";

type Tier = "free" | "pro" | "max";

interface TierMeta {
  target: Tier | null;
  labelEn: string;
  labelAr: string;
  shortEn: string;
  shortAr: string;
}

const TIER_MAP: Record<Tier, TierMeta> = {
  free: {
    target: "pro",
    labelEn: "Upgrade to Pro",
    labelAr: "الترقية إلى برو",
    shortEn: "Get Pro",
    shortAr: "احصل على برو",
  },
  pro: {
    target: "max",
    labelEn: "Upgrade to Max",
    labelAr: "الترقية إلى ماكس",
    shortEn: "Upgrade to Max",
    shortAr: "الترقية إلى ماكس",
  },
  max: {
    target: null,
    labelEn: "",
    labelAr: "",
    shortEn: "",
    shortAr: "",
  },
};

function normalizePlan(plan: string | null | undefined): Tier {
  const p = (plan || "free").toString().toLowerCase();
  if (p.includes("max") || p.includes("elite") || p.includes("business") || p.includes("enterprise")) return "max";
  if (p.includes("pro") || p.includes("plus") || p.includes("starter")) return "pro";
  return "free";
}

function formatCredits(n: number | null): string {
  if (n == null) return "";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

export interface UpgradePlanButtonProps {
  /** "full" shows label + credits chip; "compact" is icon+short label (mobile). */
  variant?: "full" | "compact";
  className?: string;
  hideCredits?: boolean;
}

export function UpgradePlanButton({ variant = "full", className, hideCredits = false }: UpgradePlanButtonProps) {
  const navigate = useNavigate();
  const lang = useUserLang();
  const { plan, credits, loading } = useCredits();

  const tier = useMemo(() => normalizePlan(plan), [plan]);
  const meta = TIER_MAP[tier];

  const prefetch = () => {
    void prefetchRoute("/pricing");
  };

  if (!meta.target || loading) return null;

  const isAr = lang === "ar" || lang === "ar-eg" || lang === "he" || lang === "fa";
  const label = isAr ? meta.labelAr : meta.labelEn;
  const shortLabel = variant === "compact" ? (isAr ? meta.shortAr : meta.shortEn) : label;

  return (
    <button
      type="button"
      dir={isAr ? "rtl" : "ltr"}
      aria-label={label}
      onPointerDown={prefetch}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onClick={() => {
        prefetch();
        navigate("/pricing");
      }}
      className={cn(
        "upgrade-plan-btn group relative inline-flex items-center gap-2 shrink-0",
        "h-9 rounded-full font-semibold select-none",
        "text-[12.5px] leading-none tracking-[-0.01em] text-white",
        "transition-all duration-250 ease-out",
        "hover:-translate-y-[1px] hover:shadow-[0_0_24px_-4px_rgba(80,200,120,0.55)]",
        "active:translate-y-0 active:scale-[0.985]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        variant === "compact" ? "px-3" : "ps-1.5 pe-3.5",
        className,
      )}
      style={{
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        border: `1px solid ${EMERALD}`,
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.04) inset,
          0 0 18px -4px ${EMERALD_GLOW_SOFT},
          0 6px 18px -6px rgba(0,0,0,0.45)
        `,
      }}
    >
      {/* Soft emerald ambient halo behind the button */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-85"
        style={{ background: `radial-gradient(closest-side, ${EMERALD_GLOW_SOFT}, transparent 70%)`, zIndex: -1 }}
      />

      {/* Subtle inner sheen sweep */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span
          className="absolute inset-y-0 -inset-x-2 block"
          style={{
            background: "linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.14) 50%, transparent 62%)",
            transform: "translateX(-120%)",
            animation: "upg-shimmer 4.5s ease-in-out infinite",
          }}
        />
      </span>

      {/* Star icon — hollow outline, emerald, no wrapper */}
      <MegsyStar
        size={14}
        static
        outline
        strokeWidth={6.5}
        className="relative z-10 transition-transform duration-200 group-hover:scale-105"
        style={{ color: EMERALD }}
      />

      {/* Label */}
      <span className="relative z-10 whitespace-nowrap">{shortLabel}</span>

      {/* Credits chip (full variant only) */}
      {variant === "full" && !hideCredits && credits != null && (
        <span
          className="relative z-10 ms-0.5 inline-flex items-center rounded-full px-1.5 py-[2.5px] text-[10.5px] font-semibold tabular-nums text-white/85"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
          aria-label={isAr ? "الرصيد" : "credits"}
        >
          {formatCredits(credits)} MC
        </span>
      )}

      <style>{`
        @keyframes upg-shimmer {
          0%   { transform: translateX(-120%); }
          50%  { transform: translateX(240%); }
          100% { transform: translateX(240%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .upgrade-plan-btn *[style*="upg-shimmer"] { animation: none !important; }
        }
      `}</style>
    </button>
  );
}

export default UpgradePlanButton;
