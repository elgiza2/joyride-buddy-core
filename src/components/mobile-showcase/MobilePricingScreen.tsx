/** @doc Mobile /pricing — clean single-screen redesign.
 *  Menu button → hero with Megsy logo → colored model marquee →
 *  Max/Pro toggle → real Pro/Max vs Free comparison → Monthly/Yearly cards →
 *  Fixed subscribe button. No scroll: everything fits within 100dvh.
 */
import { useEffect, useMemo, useState } from "react";

function useIsLightTheme() {
  const [light, setLight] = useState(
    typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "light",
  );
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setLight(el.getAttribute("data-theme") === "light");
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    update();
    return () => obs.disconnect();
  }, []);
  return light;
}
import { Check, Minus } from "lucide-react";
import { MobileSidebarButton } from "@/components/shared/MobileSidebarButton";
import { BrandIcon } from "@/components/chat/media/BrandIcon";
import { useUserLang } from "@/lib/authI18n";
import { type PlanTier } from "@/data/pricingData";
import megsyLogo from "@/assets/megsy-project-logo.png";

interface Props {
  isYearly: boolean;
  onToggleYearly: (yearly: boolean) => void;
  onSubscribe: (tier: PlanTier) => void;
  loadingTier?: PlanTier | null;
  onMenuClick?: () => void;
}

const MODELS = [
  { name: "Claude Opus 4.8", brand: "claude" },
  { name: "GPT-5.5", brand: "openai" },
  { name: "Gemini 3.5", brand: "gemini" },
  { name: "Qwen 3 Max", brand: "qwen" },
  { name: "Grok 4", brand: "grok" },
  { name: "Seedance Pro", brand: "seedance" },
  { name: "Sora 2", brand: "sora" },
  { name: "Flux Pro", brand: "flux" },
];

interface FeatureRow {
  title: string;
  value: "yes" | "limited" | "no";
  note?: string;
  freeValue: "yes" | "limited" | "no";
  freeNote?: string;
}

export default function MobilePricingScreen({
  isYearly,
  onToggleYearly,
  onSubscribe,
  loadingTier,
  onMenuClick,
}: Props) {
  const lang = useUserLang();
  const isAr = lang === "ar";
  const [plan, setPlan] = useState<"pro" | "max">("pro");

  // ---------- Feature matrix ----------
  // Everything is Unlimited on paid plans EXCEPT paid image/video generation:
  //  · Premium images (Flux Pro · GPT Image · Imagen) → Pro: credits, Max: UNLIMITED
  //  · Premium videos (Sora · Seedance · Kling)      → Pro: 240 MC, Max: 500 MC
  // Feature rows written like ChatGPT-Plus / Claude-Pro / Perplexity-Pro:
  // one concept per line, short label, quantitative value on the right.
  // Sourced from src/data/pricingData.ts + src/data/siteKnowledge.md.
  // Feature rows — single line, benefit-first, real quotas from siteKnowledge.
  // Style inspired by ChatGPT-Plus / Claude-Pro / Perplexity-Pro / Cursor:
  // short label on the left, quantitative value chip on the right.
  const proFeatures: FeatureRow[] = isAr
    ? [
        { title: "محادثة · النماذج الرائدة",     value: "yes", note: "∞",  freeValue: "limited", freeNote: "محدود" },
        { title: "بحث معمّق",                     value: "yes", note: "∞",  freeValue: "limited", freeNote: "٣/يوم" },
        { title: "Megsy Coder",                    value: "yes", note: "∞",  freeValue: "no" },
        { title: "مستندات وعروض",                 value: "yes", note: "∞",  freeValue: "limited", freeNote: "٣/يوم" },
        { title: "تعليم · مهارات · MCP",          value: "yes", note: "∞",     freeValue: "yes" },
        { title: "صور احترافية",                  value: "yes", note: "٢٤٠/شهر",   freeValue: "no" },
        { title: "فيديو سينمائي",                 value: "yes", note: "٢٤٠/شهر",   freeValue: "no" },
        { title: "أولوية وتكاملات",               value: "yes", note: "∞",     freeValue: "limited", freeNote: "قياسي" },
      ]
    : [
        { title: "Chat · flagship models",         value: "yes", note: "∞", freeValue: "limited", freeNote: "Lite" },
        { title: "Deep Research",                  value: "yes", note: "∞", freeValue: "limited", freeNote: "3/day" },
        { title: "Megsy Coder",                    value: "yes", note: "∞", freeValue: "no" },
        { title: "Docs & Slides",                  value: "yes", note: "∞", freeValue: "limited", freeNote: "3/day" },
        { title: "Study · Skills · MCP",           value: "yes", note: "∞",  freeValue: "yes" },
        { title: "Pro images",                     value: "yes", note: "240 / mo",  freeValue: "no" },
        { title: "Cinematic video",                value: "yes", note: "240 / mo",  freeValue: "no" },
        { title: "Priority & integrations",        value: "yes", note: "∞",  freeValue: "limited", freeNote: "Standard" },
      ];

  const maxFeatures: FeatureRow[] = isAr
    ? [
        { title: "محادثة · النماذج الرائدة",     value: "yes", note: "∞",  freeValue: "limited", freeNote: "محدود" },
        { title: "بحث معمّق",                     value: "yes", note: "∞",  freeValue: "limited", freeNote: "٣/يوم" },
        { title: "Megsy Coder",                    value: "yes", note: "∞",  freeValue: "no" },
        { title: "مستندات وعروض",                 value: "yes", note: "∞",  freeValue: "limited", freeNote: "٣/يوم" },
        { title: "تعليم · مهارات · MCP",          value: "yes", note: "∞",     freeValue: "yes" },
        { title: "صور احترافية",                  value: "yes", note: "∞",  freeValue: "no" },
        { title: "فيديو سينمائي",                 value: "yes", note: "٥٠٠/شهر",   freeValue: "no" },
        { title: "أولوية ×٣ وتكاملات",            value: "yes", note: "×٣ أسرع",   freeValue: "limited", freeNote: "قياسي" },
      ]
    : [
        { title: "Chat · flagship models",         value: "yes", note: "∞", freeValue: "limited", freeNote: "Lite" },
        { title: "Deep Research",                  value: "yes", note: "∞", freeValue: "limited", freeNote: "3/day" },
        { title: "Megsy Coder",                    value: "yes", note: "∞", freeValue: "no" },
        { title: "Docs & Slides",                  value: "yes", note: "∞", freeValue: "limited", freeNote: "3/day" },
        { title: "Study · Skills · MCP",           value: "yes", note: "∞",  freeValue: "yes" },
        { title: "Pro images",                     value: "yes", note: "∞", freeValue: "no" },
        { title: "Cinematic video",                value: "yes", note: "500 / mo",  freeValue: "no" },
        { title: "3× priority & integrations",     value: "yes", note: "3× faster", freeValue: "limited", freeNote: "Standard" },
      ];

  const features = plan === "pro" ? proFeatures : maxFeatures;

  const t = useMemo(
    () =>
      isAr
        ? {
            heroA: "منصة",
            heroB: "ذكاء واحدة.",
            heroC: "إمكانيات لا نهائية.",
            max: "Max",
            pro: "Pro",
            free: "Free",
            monthly: "شهرياً",
            yearly: "سنوياً",
            month: "شهر",
            year: "سنة",
            subscribe: (p: string) => `اشترك في ${p}`,
          }
        : {
            heroA: "One AI Platform.",
            heroB: "Infinity",
            heroC: "possibilities.",
            max: "Max",
            pro: "Pro",
            free: "Free",
            monthly: "Monthly",
            yearly: "Yearly",
            month: "mo",
            year: "yr",
            subscribe: (p: string) => `Get ${p}`,
          },
    [isAr],
  );

  // ---------- Pricing (USD) ----------
  // Pro  monthly: $7  (was $25, -72%)  · Pro  yearly: $149 (was $298, -50%)
  // Max  monthly: $39 (was $78, -50%)  · Max  yearly: $299 (was $598, -50%)
  type PriceBlock = { price: string; strike: string; discount: string };
  const priceMap: Record<"pro" | "max", { monthly: PriceBlock; yearly: PriceBlock }> = {
    pro: {
      monthly: { price: "5", strike: "20", discount: "-75%" },
      yearly: { price: "149", strike: "298", discount: "-50%" },

    },
    max: {
      monthly: { price: "39", strike: "78", discount: "-50%" },
      yearly: { price: "299", strike: "598", discount: "-50%" },
    },
  };
  const currentPrices = priceMap[plan];

  const activeTier: PlanTier = plan === "pro" ? "pro" : "elite";
  const isLoading = loadingTier === activeTier;

  const isLight = useIsLightTheme();
  const c = isLight
    ? {
        bg: "radial-gradient(120% 60% at 50% 0%, #f5f5f7 0%, #ffffff 55%, #ffffff 100%)",
        text: "#0a0a0a",
        textMuted: "#4b5563",
        textFaint: "#6b7280",
        subtle: "rgba(0,0,0,0.05)",
        border: "rgba(0,0,0,0.08)",
        divider: "rgba(0,0,0,0.07)",
        rowDivider: "rgba(0,0,0,0.07)",
        toggleBg: "rgba(0,0,0,0.06)",
        toggleActiveBg: "#0e0e0e",
        toggleActiveText: "#ffffff",
        toggleIdleText: "#0a0a0a",
        cardBg: "rgba(0,0,0,0.03)",
        selectedBg: "rgba(0,0,0,0.05)",
        selectedBorder: "rgba(0,0,0,0.55)",
        marqueeEdge: "#ffffff",
        ctaBg: "#0e0e0e",
        ctaText: "#ffffff",
        logoFilter: "brightness(0) saturate(100%)",
        heroItalic: "#525252",
      }
    : {
        bg: "radial-gradient(120% 60% at 50% 0%, #0b0b0b 0%, #000 55%, #000 100%)",
        text: "#ffffff",
        textMuted: "#a3a3a3",
        textFaint: "#737373",
        subtle: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.08)",
        divider: "rgba(255,255,255,0.07)",
        rowDivider: "rgba(255,255,255,0.07)",
        toggleBg: "rgba(255,255,255,0.08)",
        toggleActiveBg: "#ffffff",
        toggleActiveText: "#0e0e0e",
        toggleIdleText: "#f5f5f5",
        cardBg: "rgba(255,255,255,0.04)",
        selectedBg: "rgba(255,255,255,0.07)",
        selectedBorder: "rgba(255,255,255,0.55)",
        marqueeEdge: "#000000",
        ctaBg: "#ffffff",
        ctaText: "#000000",
        logoFilter: "brightness(0) invert(1) saturate(100%)",
        heroItalic: "#d4d4d4",
      };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden"
      style={{
        background: c.bg,
        color: c.text,
        fontFamily: 'Inter, -apple-system, "SF Pro Text", system-ui, sans-serif',
      }}
    >
      {/* Top bar — only menu button */}
      <header
        className="flex items-center px-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)", paddingBottom: 4 }}
      >
        <MobileSidebarButton
          onClick={() => onMenuClick?.()}
          ariaLabel={isAr ? "القائمة" : "Menu"}
          className={isLight ? "!text-black" : "!text-white"}
        />
      </header>

      {/* Hero copy with Megsy logo */}
      <div className="px-6 pt-8 text-center">
        <h1
          className="mx-auto font-normal leading-[1.02]"
          style={{
            color: c.text,
            fontFamily: '"Instrument Serif", "Fraunces", Georgia, serif',
            fontSize: "clamp(28px, 7.6vw, 38px)",
            letterSpacing: "-0.015em",
          }}
        >
          <span className="inline-flex items-center gap-2 whitespace-nowrap align-baseline">
            <img loading="lazy" decoding="async"
              src={megsyLogo}
              alt="Megsy"
              className="inline-block h-[0.92em] w-auto -translate-y-[2px] select-none"
              style={{
                filter: c.logoFilter,
              }}
              draggable={false}
            />
            <span>{t.heroA}</span>
          </span>
          <br />
          <span className="italic" style={{ color: c.heroItalic }}>{t.heroB}</span>{" "}
          <span>{t.heroC}</span>
        </h1>
      </div>

      {/* Models marquee */}
      <div className="relative mt-6 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 start-0 z-10 w-10"
          style={{ background: `linear-gradient(to right, ${c.marqueeEdge}, transparent)` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 end-0 z-10 w-10"
          style={{ background: `linear-gradient(to left, ${c.marqueeEdge}, transparent)` }}
        />
        <div
          className="flex w-max items-center gap-6 whitespace-nowrap px-6"
          style={{ animation: "pricing-marquee 22s linear infinite" }}
        >
          {[...MODELS, ...MODELS].map((m, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: c.textMuted }}>
              <BrandIcon name={m.brand} size={16} variant="color" />
              <span>{m.name}</span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes pricing-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* Max / Pro toggle */}
      <div className="mt-6 flex justify-center">
        <div
          className="relative flex items-center rounded-full p-1"
          style={{ background: c.toggleBg }}
        >
          <button
            type="button"
            onClick={() => setPlan("max")}
            className="relative z-10 h-8 min-w-[64px] rounded-full px-4 text-[13px] font-medium transition-colors"
            style={{
              background: plan === "max" ? c.toggleActiveBg : "transparent",
              color: plan === "max" ? c.toggleActiveText : c.toggleIdleText,
            }}
          >
            {t.max}
          </button>
          <button
            type="button"
            onClick={() => setPlan("pro")}
            className="relative z-10 h-8 min-w-[64px] rounded-full px-4 text-[13px] font-medium transition-colors"
            style={{
              background: plan === "pro" ? c.toggleActiveBg : "transparent",
              color: plan === "pro" ? c.toggleActiveText : c.toggleIdleText,
            }}
          >
            {t.pro}
          </button>
        </div>
      </div>

      {/* Comparison card — no icons, real features */}
      <div className="mx-4 mt-6 flex-1 min-h-0">
        <div
          className="h-full rounded-[20px] px-3.5 py-2.5"
          style={{
            background: c.cardBg,
            border: `1px solid ${c.border}`,
          }}
        >
          <div
            key={plan}
            className="pricing-plan-switch"
            style={{ animation: "pricing-plan-in 360ms cubic-bezier(0.22,1,0.36,1) both" }}
          >
            {/* Header row */}
            <div className="grid grid-cols-[minmax(0,1fr)_84px_66px] items-center pb-1.5 text-[11px] font-semibold uppercase tracking-wide">
              <span style={{ color: c.textMuted }}>{isAr ? "المميزات" : "Features"}</span>
              <span className="text-center text-teal-500 dark:text-teal-300">{plan === "pro" ? t.pro : t.max}</span>
              <span className="text-center" style={{ color: c.textFaint }}>{t.free}</span>
            </div>
            <div className="h-px w-full" style={{ background: c.rowDivider }} />
            <ul>
              {features.map((f, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_84px_66px] items-center gap-2 py-[6px]"
                  style={{
                    borderTop: i === 0 ? "none" : `1px solid ${c.rowDivider}`,
                    opacity: 0,
                    animation: "pricing-row-in 360ms cubic-bezier(0.22,1,0.36,1) forwards",
                    animationDelay: `${60 + i * 35}ms`,
                  }}
                >
                  <div className="min-w-0">
                    <span className="block truncate whitespace-nowrap text-[12.5px] font-medium leading-tight" style={{ color: c.text }}>
                      {f.title}
                    </span>
                  </div>
                  <span className="flex justify-center">
                    {f.note ? (
                      <span className="whitespace-nowrap text-[11px] font-semibold" style={{ color: isLight ? "#0d9488" : "#5eead4" }}>
                        {f.note}
                      </span>
                    ) : f.value === "yes" ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: isLight ? "rgba(13,148,136,0.15)" : "rgba(45,212,191,0.15)" }}>
                        <Check className="h-3.5 w-3.5" style={{ color: isLight ? "#0d9488" : "#5eead4" }} strokeWidth={2.6} />
                      </span>
                    ) : (
                      <Minus className="h-4 w-4" style={{ color: c.textFaint }} strokeWidth={2.2} />
                    )}
                  </span>
                  <span className="flex justify-center">
                    {f.freeValue === "yes" ? (
                      <Check className="h-4 w-4" style={{ color: c.textMuted }} strokeWidth={2.2} />
                    ) : f.freeValue === "limited" ? (
                      <span className="whitespace-nowrap text-[10.5px] font-medium" style={{ color: c.textMuted }}>
                        {f.freeNote}
                      </span>
                    ) : (
                      <Minus className="h-4 w-4" style={{ color: c.textFaint }} strokeWidth={2.2} />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <style>{`
            @keyframes pricing-plan-in {
              from { opacity: 0; transform: translateY(6px) scale(0.985); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes pricing-row-in {
              from { opacity: 0; transform: translateX(${isAr ? "8px" : "-8px"}); }
              to   { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </div>
      </div>

      {/* Billing cards */}
      <div className="px-4 pt-6">
        <div className="relative grid grid-cols-2 gap-2.5">
          {/* Animated selection background */}
          <div
            className="pointer-events-none absolute inset-y-0 rounded-[16px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              insetInlineStart: isYearly ? 0 : "calc(50% + 5px)",
              width: "calc(50% - 5px)",
              background: c.selectedBg,
              border: `1px solid ${c.selectedBorder}`,
            }}
          />

          {/* Yearly */}
          <button
            type="button"
            onClick={() => onToggleYearly(true)}
            className="relative rounded-[16px] p-3 text-start transition-colors duration-300"
            style={{
              background: "transparent",
              border: "1px solid transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium" style={{ color: c.textMuted }}>{t.yearly}</span>
              <span
                className="rounded-full px-1.5 py-[1px] text-[10px] font-semibold transition-transform duration-300"
                style={{ background: isLight ? "rgba(13,148,136,0.15)" : "rgba(45,212,191,0.18)", color: isLight ? "#0d9488" : "#5eead4" }}
              >
                {currentPrices.yearly.discount}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5 tabular-nums overflow-hidden" dir="ltr">
              <span
                key={currentPrices.yearly.price + plan}
                className="text-[15px] font-semibold animate-fade-in"
                style={{ color: c.text }}
              >
                ${currentPrices.yearly.price}
              </span>
              <span className="text-[11px]" style={{ color: c.textMuted }}>/{t.year}</span>
            </div>
            <div className="mt-0.5 text-[11px] line-through tabular-nums" dir="ltr" style={{ color: c.textFaint }}>
              ${currentPrices.yearly.strike}/{t.year}
            </div>
          </button>

          {/* Monthly */}
          <button
            type="button"
            onClick={() => onToggleYearly(false)}
            className="relative rounded-[16px] p-3 text-start transition-colors duration-300"
            style={{
              background: "transparent",
              border: "1px solid transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium" style={{ color: c.textMuted }}>{t.monthly}</span>
              <span
                className="rounded-full px-1.5 py-[1px] text-[10px] font-semibold transition-transform duration-300"
                style={{ background: isLight ? "rgba(13,148,136,0.15)" : "rgba(45,212,191,0.18)", color: isLight ? "#0d9488" : "#5eead4" }}
              >
                {currentPrices.monthly.discount}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5 tabular-nums overflow-hidden" dir="ltr">
              <span
                key={currentPrices.monthly.price + plan}
                className="text-[15px] font-semibold animate-fade-in"
                style={{ color: c.text }}
              >
                ${currentPrices.monthly.price}
              </span>
              <span className="text-[11px]" style={{ color: c.textMuted }}>/{t.month}</span>
            </div>
            <div className="mt-0.5 text-[11px] line-through tabular-nums" dir="ltr" style={{ color: c.textFaint }}>
              ${currentPrices.monthly.strike}/{t.month}
            </div>
          </button>
        </div>
      </div>

      {/* Fixed subscribe button */}
      <div
        className="px-4 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      >
        <button
          key={plan}
          type="button"
          onClick={() => onSubscribe(activeTier)}
          disabled={isLoading}
          className="flex h-[54px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition active:scale-[0.99] disabled:opacity-60"
          style={{ background: c.ctaBg, color: c.ctaText }}
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          ) : (
            <span style={{ color: c.ctaText }}>
              {t.subscribe(plan === "pro" ? t.pro : t.max)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
