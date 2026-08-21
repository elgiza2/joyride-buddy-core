import { Wrench } from "lucide-react";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";

/**
 * Fallback UI لأي tool call لا يمتلك makeAssistantToolUI مسجل.
 * يحافظ على نفس styling الـ ToolCard الحالي (bg-muted/40, border-white/10,
 * rounded-2xl) حتى تبقى الرسائل متسقة بصريًا.
 */
export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  args,
  result,
  status,
}) => {
  return (
    <div className="my-2 rounded-2xl border border-white/10 bg-muted/40 p-3 text-sm">
      <div className="flex items-center gap-2 text-xs opacity-80">
        <Wrench className="h-3.5 w-3.5" />
        <span className="font-medium">{toolName}</span>
        <span className="ms-auto text-[10px] uppercase opacity-60">
          {status?.type ?? "complete"}
        </span>
      </div>
      {args && Object.keys(args as object).length > 0 && (
        <pre dir="ltr" className="mt-2 max-h-40 overflow-auto text-[11px] opacity-70">
          {JSON.stringify(args, null, 2)}
        </pre>
      )}
      {result !== undefined && result !== null && (
        <pre dir="ltr" className="mt-2 max-h-56 overflow-auto text-[11px] opacity-90">
          {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default ToolFallback;
