import { useState } from "react";
import { ChevronRight, Wrench, Check, AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import type { ToolPart } from "@/pages/chat/chatConstants";
import { isSensitiveTool } from "@/pages/chat/hitl/sensitiveTools";
import { getHitlDecision, setHitlDecision } from "@/pages/chat/hitl/hitlStorage";
import { trackChatInteraction } from "@/pages/chat/services/trackInteraction";
import { extractSources, SourcesList } from "./SourcesList";


const SEARCH_TOOL_PATTERN = /(search|browse|fetch_url|web|serp|scrape)/i;

/**
 * Compact, collapsible card that surfaces a single tool invocation
 * (name / args / result / status). Designed to feel native to Megsy —
 * it uses the same tokens as other in-message cards (bg-muted/40,
 * border-white/10, rounded-2xl) and stays collapsed by default.
 *
 * The data comes from the SSE tool_event stream persisted onto
 * `message.toolParts`. This mirrors what assistant-ui's ToolPrimitive
 * would render, but as a plain component so we do not require the
 * external-store runtime to project tool-call parts.
 */
export function ToolCard({ part, userId }: { part: ToolPart; userId?: string | null }) {
  const [open, setOpen] = useState(false);
  const sensitive = isSensitiveTool(part.name);
  const initialDecision = sensitive ? getHitlDecision(userId, part.name) : "approved";
  const [decision, setDecision] = useState<"approved" | "denied" | null>(
    initialDecision,
  );
  const needsApproval = sensitive && decision === null && part.result !== undefined;
  const denied = decision === "denied";

  const label = prettifyName(part.name);
  const StatusIcon = needsApproval
    ? ShieldAlert
    : part.state === "running"
      ? Loader2
      : part.state === "error"
        ? AlertCircle
        : Check;
  const statusColor = needsApproval
    ? "text-amber-400"
    : part.state === "running"
      ? "text-primary"
      : part.state === "error"
        ? "text-destructive"
        : "text-emerald-500";

  return (
    <div
      className={`mt-2 mb-2 rounded-2xl border overflow-hidden text-[13px] backdrop-blur-sm ${
        needsApproval
          ? "border-amber-400/40 bg-amber-500/5 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]"
          : "border-white/10 bg-muted/40"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
        aria-expanded={open}
      >
        <Wrench className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.8} />
        <span className="font-medium text-foreground/90 truncate flex-1">{label}</span>
        {needsApproval && (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 text-[10px] font-semibold uppercase tracking-wide border border-amber-400/30 shrink-0">
            يحتاج موافقة
          </span>
        )}
        {part.target && !needsApproval && (
          <span className="text-muted-foreground text-[12px] truncate max-w-[40%]">
            {part.target}
          </span>
        )}
        <StatusIcon
          className={`w-3.5 h-3.5 shrink-0 ${statusColor} ${part.state === "running" ? "animate-spin" : ""}`}
          strokeWidth={2}
        />
        <ChevronRight
          className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          strokeWidth={1.8}
        />
      </button>
      {needsApproval && (
        <div className="px-3 py-2 border-t border-amber-400/20 bg-amber-400/5 flex items-center gap-2 text-[12px]">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2} />
          <span className="flex-1 text-amber-200/90">
            هذه الأداة حساسة. اعتمد التنفيذ لعرض النتيجة (سيُحفظ القرار تلقائياً).
          </span>
          <button
            type="button"
            onClick={() => {
              setHitlDecision(userId, part.name, "denied");
              setDecision("denied");
              trackChatInteraction("tool_denied", {
                userId,
                metadata: { tool: part.name },
              });
            }}
            className="px-2 py-1 rounded-md text-muted-foreground hover:bg-white/5"
          >
            رفض
          </button>
          <button
            type="button"
            onClick={() => {
              setHitlDecision(userId, part.name, "approved");
              setDecision("approved");
              trackChatInteraction("tool_approved", {
                userId,
                metadata: { tool: part.name },
              });
            }}
            className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
          >
            اعتماد
          </button>
        </div>
      )}

      {open && !needsApproval && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/5">
          {part.args !== undefined && (
            <details open>
              <summary className="text-[11px] uppercase tracking-wide text-muted-foreground cursor-pointer">
                Input
              </summary>
              <pre className="mt-1 text-[12px] text-foreground/80 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-2 max-h-48 overflow-auto">
                {safeStringify(part.args)}
              </pre>
            </details>
          )}
          {part.result !== undefined && !denied && (
            <details open>
              <summary className="text-[11px] uppercase tracking-wide text-muted-foreground cursor-pointer">
                Output
              </summary>
              {SEARCH_TOOL_PATTERN.test(part.name) && (
                <SourcesList sources={extractSources(part.result)} />
              )}
              <pre className="mt-1 text-[12px] text-foreground/80 whitespace-pre-wrap break-words bg-black/20 rounded-lg p-2 max-h-64 overflow-auto">
                {safeStringify(part.result)}
              </pre>
            </details>
          )}
          {denied && (
            <div className="text-[12px] text-destructive/90">
              تم رفض عرض نتيجة هذه الأداة.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function prettifyName(name: string): string {
  if (!name) return "Tool";
  return name
    .replace(/[_.]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeStringify(value: unknown): string {
  try {
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
