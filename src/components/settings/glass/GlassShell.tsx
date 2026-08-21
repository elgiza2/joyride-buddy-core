/** @doc Unified glass design primitives for settings pages — Noir & Gold. */
import { ReactNode, MouseEventHandler } from "react";
import { useNavigate } from "react-router-dom";
import { m as motion, type HTMLMotionProps } from "framer-motion";
import { ChevronRight, ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Page ---------- */

export function GlassPage({
  title,
  back = "/settings",
  right,
  children,
}: {
  title: string;
  back?: string | (() => void);
  right?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof back === "function") back();
    else navigate(back);
  };
  return (
    <div className="relative min-h-[100dvh] overflow-visible safe-bottom" style={{ background: "#0a0a0b", color: "#f5f2ea" }}>
      {/* Ambient noir + gold gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(201,168,76,0.10) 0%, transparent 55%), radial-gradient(90% 50% at 0% 100%, rgba(201,168,76,0.04) 0%, transparent 60%), linear-gradient(180deg, #0b0b0d 0%, #08080a 60%, #060607 100%)",
        }}
      />
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{
          background: "rgba(10,10,11,0.72)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between gap-2 py-3 safe-top">
          <button
            onClick={handleBack}
            className="grid h-10 w-10 place-items-center rounded-xl active:scale-95 transition"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f5f2ea",
            }}
            aria-label="Back"
          >
            <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.2} />
          </button>
          <h1
            className="text-[15.5px] font-semibold tracking-tight truncate"
            style={{ color: "#faf7ee", letterSpacing: "-0.01em" }}
          >
            {title}
          </h1>
          <div className="w-10 flex justify-end">{right}</div>
        </div>
      </header>
      <div className="relative z-[1] max-w-lg mx-auto px-4 pt-5 pb-14 space-y-6">{children}</div>
    </div>
  );
}

/* ---------- Sections ---------- */

const ease = [0.22, 1, 0.36, 1] as const;
export const glassStagger = (i: number): HTMLMotionProps<"div"> => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: 0.04 + i * 0.05, ease },
});

export function GlassSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="px-1 mb-2 text-[10.5px] font-semibold uppercase"
      style={{
        letterSpacing: "0.14em",
        color: "rgba(201, 168, 76, 0.9)",
      }}
    >
      {children}
    </p>
  );
}

export function GlassCard({
  children,
  className,
  strong,
  padded,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={cn("relative rounded-2xl overflow-hidden", padded && "p-4", className)}
      style={{
        background: strong ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${strong ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function GlassList({ children }: { children: ReactNode }) {
  return (
    <GlassCard>
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        {(Array.isArray(children) ? children : [children]).map((c, i) => (
          <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
            {c}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ---------- Row ---------- */

export type GlassRowTone =
  | "default"
  | "primary"
  | "amber"
  | "emerald"
  | "rose"
  | "sky"
  | "violet"
  | "pink";

const TONE_STYLE: Record<GlassRowTone, { bg: string; ring: string; fg: string }> = {
  default: { bg: "rgba(255,255,255,0.05)", ring: "rgba(255,255,255,0.10)", fg: "#e8dfc6" },
  primary: { bg: "rgba(201,168,76,0.12)", ring: "rgba(201,168,76,0.30)", fg: "#e6c56a" },
  amber:   { bg: "rgba(245,158,11,0.12)", ring: "rgba(245,158,11,0.30)", fg: "#fbbf24" },
  emerald: { bg: "rgba(16,185,129,0.12)", ring: "rgba(16,185,129,0.30)", fg: "#34d399" },
  rose:    { bg: "rgba(244,63,94,0.12)",  ring: "rgba(244,63,94,0.30)",  fg: "#fb7185" },
  sky:     { bg: "rgba(14,165,233,0.12)", ring: "rgba(14,165,233,0.30)", fg: "#38bdf8" },
  violet:  { bg: "rgba(139,92,246,0.12)", ring: "rgba(139,92,246,0.30)", fg: "#a78bfa" },
  pink:    { bg: "rgba(236,72,153,0.12)", ring: "rgba(236,72,153,0.30)", fg: "#f472b6" },
};

export function GlassRow({
  icon: Icon,
  tone = "default",
  label,
  desc,
  trailing,
  onClick,
  destructive,
  disabled,
}: {
  icon?: LucideIcon;
  tone?: GlassRowTone;
  label: ReactNode;
  desc?: ReactNode;
  trailing?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const t = TONE_STYLE[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3.5 py-3.5 px-4 text-left transition",
        "hover:bg-white/[0.02] active:bg-white/[0.05]",
        disabled && "opacity-60",
      )}
    >
      {Icon && (
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
          style={{
            background: t.bg,
            border: `1px solid ${t.ring}`,
          }}
        >
          <Icon className="h-[16px] w-[16px]" style={{ color: t.fg }} strokeWidth={1.8} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="text-[14.5px] font-medium"
          style={{
            color: destructive ? "#fb7185" : "#f5f2ea",
            letterSpacing: "-0.005em",
          }}
        >
          {label}
        </p>
        {desc && (
          <p
            className="mt-0.5 text-[12.5px] truncate"
            style={{ color: "rgba(245,242,234,0.5)" }}
          >
            {desc}
          </p>
        )}
      </div>
      {trailing !== undefined ? (
        <span style={{ color: "rgba(245,242,234,0.6)" }}>{trailing}</span>
      ) : onClick ? (
        <ChevronRight
          className="h-4 w-4 shrink-0"
          style={{ color: "rgba(245,242,234,0.35)" }}
        />
      ) : null}
    </button>
  );
}

/* ---------- Hero ---------- */

export function GlassHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  tone = "primary",
  cta,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  tone?: GlassRowTone;
  cta?: ReactNode;
}) {
  const t = TONE_STYLE[tone];
  return (
    <motion.div {...glassStagger(0)}>
      <GlassCard strong>
        <div className="p-5 flex items-start gap-4">
          {Icon && (
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-sm"
              style={{ background: t.bg, border: `1px solid ${t.ring}` }}
            >
              <Icon className="h-5 w-5" style={{ color: t.fg }} strokeWidth={1.8} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p
                className="text-[10.5px] font-semibold uppercase"
                style={{ letterSpacing: "0.14em", color: "rgba(201,168,76,0.9)" }}
              >
                {eyebrow}
              </p>
            )}
            <h2
              className="mt-0.5 text-[20px] font-semibold tracking-tight leading-tight"
              style={{ color: "#faf7ee", letterSpacing: "-0.02em" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ color: "rgba(245,242,234,0.55)" }}
              >
                {subtitle}
              </p>
            )}
            {cta && <div className="mt-3">{cta}</div>}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ---------- Primary action button ---------- */

export function GlassButton({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "w-full h-11 rounded-xl text-[14px] font-semibold transition active:scale-[0.99] disabled:opacity-60 inline-flex items-center justify-center";
  const style: React.CSSProperties =
    variant === "primary"
      ? {
          background: "linear-gradient(180deg, #d4b04d 0%, #b8912e 100%)",
          color: "#1a1408",
          boxShadow: "0 6px 16px -6px rgba(201,168,76,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
        }
      : variant === "danger"
      ? {
          background: "rgba(244,63,94,0.10)",
          border: "1px solid rgba(244,63,94,0.30)",
          color: "#fb7185",
        }
      : {
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#f5f2ea",
        };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(base, className)} style={style}>
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

/* ---------- Section wrapper with motion + label ---------- */

export function GlassSection({
  label,
  index = 1,
  children,
}: {
  label?: ReactNode;
  index?: number;
  children: ReactNode;
}) {
  return (
    <motion.section {...glassStagger(index)}>
      {label && <GlassSectionLabel>{label}</GlassSectionLabel>}
      {children}
    </motion.section>
  );
}
