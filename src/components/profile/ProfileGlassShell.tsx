/** @doc Unified mobile shell for settings sub-pages — Noir & Gold, editorial. */
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

type ShellProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
  children: ReactNode;
};

const ProfileGlassShell = ({ title, subtitle, onBack, trailing, children }: ShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const back =
    onBack ??
    (() => {
      const parts = location.pathname.split("/").filter(Boolean);
      if (parts.length > 1) {
        navigate("/" + parts.slice(0, -1).join("/"));
      } else {
        navigate("/settings");
      }
    });

  return (
    <div className="ng-root">
      <style>{ngCss}</style>
      <div className="ng-bg" aria-hidden />
      <div className="ng-bg-glow" aria-hidden />

      <div className="ng-screen">
        <div className="ng-topbar ng-a1">
          <button onClick={back} aria-label="Back" className="ng-back">
            <ArrowLeft className="w-[17px] h-[17px]" strokeWidth={2.2} />
          </button>
          <div className="ng-topbar-trail">{trailing}</div>
        </div>

        <header className="ng-hero ng-a2">
          <h1 className="ng-hero-title">{title}</h1>
          {subtitle && <p className="ng-hero-sub">{subtitle}</p>}
        </header>

        <div className="ng-content">{children}</div>
        <div className="ng-bottom-spacer" />
      </div>
    </div>
  );
};

/* ---------- Building blocks (API compatible) ---------- */

export const GlassSection = ({
  title,
  children,
}: {
  title?: string;
  index?: string;
  children: ReactNode;
}) => (
  <section className="ng-section">
    {title && <h2 className="ng-section-title">{title}</h2>}
    {children}
  </section>
);

export const GlassCard = ({
  children,
  selected = false,
  className = "",
}: {
  children: ReactNode;
  selected?: boolean;
  className?: string;
}) => (
  <div className={`ng-card ${selected ? "ng-card-selected" : ""} ${className}`}>
    {children}
  </div>
);

type RowProps = {
  index?: string;
  icon?: ReactNode;
  label: string;
  hint?: string;
  trailing?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
};

export const GlassRow = ({ icon, label, hint, trailing, danger, onClick }: RowProps) => (
  <button onClick={onClick} className={`ng-row ${danger ? "ng-row-danger" : ""}`} type="button">
    {icon && <span className="ng-row-icon">{icon}</span>}
    <span className="ng-row-body">
      <span className="ng-row-label">{label}</span>
      {hint && <span className="ng-row-hint">{hint}</span>}
    </span>
    {trailing !== undefined ? (
      <span className="ng-row-trailing">{trailing}</span>
    ) : (
      <span className="ng-row-arrow" aria-hidden>›</span>
    )}
  </button>
);

export const GlassField = ({
  label,
  hint,
  ...rest
}: { label?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) => (
  <label className="ng-field">
    {label && <span className="ng-field-label">{label}</span>}
    <input {...rest} className="ng-input" />
    {hint && <span className="ng-field-hint">{hint}</span>}
  </label>
);

export const GlassPrimaryButton = ({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...rest} className={`ng-btn ng-btn-primary ${rest.className ?? ""}`}>
    {children}
  </button>
);

export const GlassSecondaryButton = ({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...rest} className={`ng-btn ng-btn-secondary ${rest.className ?? ""}`}>
    {children}
  </button>
);

/* ---------- CSS (Noir & Gold, editorial) ---------- */

const ngCss = `
.ng-root {
  position: relative;
  min-height: 100dvh;
  color: #f5f2ea;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: flex; justify-content: center;
  isolation: isolate;
  overflow-x: hidden;
  background: #0a0a0b;
}
.ng-bg {
  position: fixed; inset: 0;
  z-index: -2;
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(201, 168, 76, 0.10) 0%, transparent 55%),
    radial-gradient(90% 50% at 0% 100%, rgba(201, 168, 76, 0.04) 0%, transparent 60%),
    linear-gradient(180deg, #0b0b0d 0%, #08080a 60%, #060607 100%);
}
.ng-bg-glow {
  position: fixed; inset: 0;
  z-index: -1;
  background:
    radial-gradient(60% 40% at 100% 0%, rgba(255, 220, 150, 0.05), transparent 60%);
  pointer-events: none;
}

.ng-screen {
  position: relative;
  width: 100%; max-width: 440px;
  min-height: 100dvh;
  padding: max(env(safe-area-inset-top, 0px), 14px) 20px 0;
}

/* --- Top bar --- */
.ng-topbar {
  position: sticky;
  top: max(env(safe-area-inset-top, 0px), 8px);
  z-index: 30;
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0;
  margin-bottom: 8px;
}
.ng-back {
  width: 38px; height: 38px; padding: 0;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #f5f2ea;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 160ms ease;
  backdrop-filter: blur(12px);
}
.ng-back:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
.ng-back:active { transform: scale(0.94); }
.ng-topbar-trail { display: flex; align-items: center; gap: 8px; }

/* --- Hero --- */
.ng-hero {
  position: relative;
  padding: 18px 2px 24px;
  z-index: 1;
  display: flex; flex-direction: column; align-items: flex-start;
  gap: 8px;
}
.ng-hero-title {
  margin: 0;
  font-size: 30px; font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.1;
  color: #faf7ee;
  background: linear-gradient(180deg, #faf7ee 0%, #d8d2c1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ng-hero-sub {
  margin: 0;
  font-size: 14px; line-height: 1.55;
  color: rgba(245, 242, 234, 0.55);
  font-weight: 400;
  max-width: 56ch;
  letter-spacing: -0.005em;
}

.ng-content { display: flex; flex-direction: column; gap: 26px; padding-top: 4px; }

/* --- Sections --- */
.ng-section { display: flex; flex-direction: column; gap: 10px; }
.ng-section-title {
  margin: 0 4px 6px;
  font-size: 10.5px; font-weight: 600;
  color: rgba(201, 168, 76, 0.9);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

/* --- Card --- */
.ng-card {
  position: relative;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px;
  overflow: hidden;
  transition: border-color 200ms ease, background 200ms ease;
}
.ng-card:hover { border-color: rgba(255,255,255,0.11); }
.ng-card-selected {
  background: rgba(201, 168, 76, 0.06);
  border-color: rgba(201, 168, 76, 0.35);
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.08);
}
.ng-card-pad { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
.ng-actions { display: flex; gap: 10px; padding-top: 4px; }
.ng-actions > * { flex: 1; }

/* --- Rows --- */
.ng-row {
  width: 100%;
  display: flex; align-items: center; gap: 14px;
  padding: 15px 18px;
  background: transparent;
  border: 0;
  color: #f5f2ea;
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: background-color 160ms ease;
  position: relative;
}
.ng-row + .ng-row::before {
  content: "";
  position: absolute; top: 0; left: 60px; right: 18px;
  height: 1px; background: rgba(255,255,255,0.05);
}
.ng-row:hover { background: rgba(255,255,255,0.03); }
.ng-row:active { background: rgba(255,255,255,0.06); }

.ng-row-icon {
  width: 34px; height: 34px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #e8dfc6;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
}
.ng-row-icon > svg { width: 17px; height: 17px; stroke-width: 1.8; }
.ng-row-icon img { width: 20px; height: 20px; object-fit: contain; display: block; }

.ng-row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ng-row-label {
  font-size: 14.5px; font-weight: 500;
  color: #f5f2ea;
  letter-spacing: -0.005em;
}
.ng-row-hint {
  font-size: 12.5px;
  color: rgba(245,242,234,0.5);
  line-height: 1.4;
}
.ng-row-trailing {
  font-size: 13px;
  color: rgba(245,242,234,0.55);
  flex-shrink: 0; max-width: 55%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: flex; align-items: center; gap: 6px;
}
.ng-row-arrow {
  font-size: 20px; color: rgba(245,242,234,0.35);
  flex-shrink: 0; line-height: 1;
  transition: transform 180ms ease, color 180ms ease;
  font-weight: 300;
}
.ng-row:hover .ng-row-arrow { transform: translateX(2px); color: rgba(201,168,76,0.75); }
.ng-row-danger .ng-row-label,
.ng-row-danger .ng-row-icon { color: #fda4af; }
.ng-row-danger .ng-row-icon { background: rgba(244,63,94,0.08); border-color: rgba(244,63,94,0.22); }
.ng-row-danger .ng-row-arrow { color: rgba(253,164,175,0.6); }

/* --- Fields --- */
.ng-field {
  display: flex; flex-direction: column; gap: 7px;
  padding: 0;
}
.ng-field-label {
  padding-left: 2px;
  font-size: 12px; font-weight: 500;
  color: rgba(245,242,234,0.65);
  letter-spacing: 0.01em;
}
.ng-input {
  width: 100%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 12px;
  padding: 12px 14px;
  color: #f5f2ea;
  font: inherit;
  font-size: 14.5px;
  outline: none;
  transition: border-color 160ms ease, background 160ms ease;
}
.ng-input:focus {
  border-color: rgba(201,168,76,0.55);
  background: rgba(255,255,255,0.05);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.10);
}
.ng-input::placeholder { color: rgba(245,242,234,0.32); }
.ng-field-hint {
  padding-left: 2px;
  font-size: 12px; color: rgba(245,242,234,0.5);
  line-height: 1.5;
}

/* --- Buttons --- */
.ng-btn {
  height: 46px;
  border: 0; padding: 0 22px;
  border-radius: 12px;
  font: inherit;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, opacity 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex; align-items: center; justify-content: center;
  letter-spacing: 0.005em;
  -webkit-tap-highlight-color: transparent;
}
.ng-btn:active { transform: scale(0.98); }
.ng-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ng-btn-primary {
  background: linear-gradient(180deg, #d4b04d 0%, #b8912e 100%);
  color: #1a1408;
  box-shadow: 0 6px 16px -6px rgba(201,168,76,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
}
.ng-btn-primary:hover { filter: brightness(1.06); }
.ng-btn-secondary {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #f5f2ea;
}
.ng-btn-secondary:hover { background: rgba(255,255,255,0.08); }

.ng-bottom-spacer { height: calc(env(safe-area-inset-bottom, 0px) + 56px); }

/* --- Animations (staggered fade-up) --- */
@keyframes ng-rise {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ng-a1 { animation: ng-rise 0.45s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
.ng-a2 { animation: ng-rise 0.45s cubic-bezier(0.22,1,0.36,1) 0.14s both; }
.ng-content > *:nth-child(1) { animation: ng-rise 0.45s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
.ng-content > *:nth-child(2) { animation: ng-rise 0.45s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
.ng-content > *:nth-child(3) { animation: ng-rise 0.45s cubic-bezier(0.22,1,0.36,1) 0.34s both; }
.ng-content > *:nth-child(4) { animation: ng-rise 0.45s cubic-bezier(0.22,1,0.36,1) 0.40s both; }
.ng-content > *:nth-child(5) { animation: ng-rise 0.45s cubic-bezier(0.22,1,0.36,1) 0.46s both; }
.ng-content > *:nth-child(6) { animation: ng-rise 0.45s cubic-bezier(0.22,1,0.36,1) 0.52s both; }

@media (prefers-reduced-motion: reduce) {
  .ng-a1,.ng-a2,.ng-content > * { animation: none !important; }
}

/* Keep legacy pgs-* classnames working */
.pgs-anim-drop1,.pgs-anim-drop2,.pgs-anim-rise1,.pgs-anim-rise2,.pgs-anim-rise3,.pgs-anim-rise4,.pgs-anim-rise5 {
  animation: ng-rise 0.5s cubic-bezier(0.22,1,0.36,1) both;
}
.pgs-anim-drop1 { animation-delay: 0.08s; }
.pgs-anim-drop2 { animation-delay: 0.14s; }
.pgs-anim-rise1 { animation-delay: 0.20s; }
.pgs-anim-rise2 { animation-delay: 0.26s; }
.pgs-anim-rise3 { animation-delay: 0.32s; }
.pgs-anim-rise4 { animation-delay: 0.38s; }
.pgs-anim-rise5 { animation-delay: 0.44s; }

/* Backwards-compat aliases so legacy pages that still reference .liquid-glass keep working */
.liquid-glass, .liquid-glass-selected { border-radius: 18px; }
`;

export default ProfileGlassShell;
