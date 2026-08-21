import { memo } from "react";
import { X, Code2, Image as ImageIcon, Video, Music, Microscope, Presentation, FileText, GraduationCap } from "lucide-react";
import type { AgentDef } from "@/lib/agentRegistry";

type ChipId =
  | "code"
  | "images"
  | "video"
  | "music"
  | "deep-research"
  | "slides"
  | "docs"
  | "learning";

const MODES: Record<ChipId, { label: string; color: string; Icon: React.ElementType }> = {
  code: { label: "Coder", color: "var(--mode-code)", Icon: Code2 },
  images: { label: "Images", color: "hsl(var(--brand-mint))", Icon: ImageIcon },
  video: { label: "Videos", color: "var(--mode-video)", Icon: Video },
  music: { label: "Music", color: "hsl(var(--brand-blush))", Icon: Music },
  "deep-research": { label: "Deep Research", color: "hsl(var(--brand-blush))", Icon: Microscope },
  slides: { label: "Slides", color: "var(--mode-slides)", Icon: Presentation },
  docs: { label: "Docs", color: "var(--mode-docs)", Icon: FileText },
  learning: { label: "Learning", color: "var(--mode-learning)", Icon: GraduationCap },
};

interface ActiveServicePillProps {
  chatMode: string;
  selectedAgent: AgentDef | null;
  onClear: () => void;
}

/**
 * Ultra-minimal active-mode indicator: colored dot + label + tiny X.
 * No background, no border — reads as a small inline label inside the composer.
 */
function ActiveServicePillImpl({
  chatMode,
  selectedAgent,
  onClear,
}: ActiveServicePillProps) {
  const id: ChipId | null =
    selectedAgent?.id === "docs"
      ? "docs"
      : (MODES[chatMode as ChipId] ? (chatMode as ChipId) : null);
  if (!id) return null;
  const { label, color, Icon } = MODES[id];

  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/70">
      <Icon size={11} strokeWidth={2.4} style={{ color }} />
      <span className="leading-none tracking-wide uppercase text-[10px]">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
      >
        <X size={10} strokeWidth={2.6} />
      </button>
    </div>
  );
}

export const ActiveServicePill = memo(ActiveServicePillImpl);

export default ActiveServicePill;
