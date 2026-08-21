/** @doc DiffView — side-by-side / unified diff renderer using jsdiff. */
import { useMemo } from "react";
import { diffLines } from "diff";

interface DiffViewProps {
  before: string;
  after: string;
  mode?: "unified" | "split";
  filename?: string;
}

export default function DiffView({ before, after, mode = "unified", filename }: DiffViewProps) {
  const parts = useMemo(() => diffLines(before ?? "", after ?? ""), [before, after]);

  if (mode === "split") {
    const beforeLines: { text: string; type: "same" | "del" | "empty" }[] = [];
    const afterLines: { text: string; type: "same" | "add" | "empty" }[] = [];
    for (const p of parts) {
      const lines = p.value.replace(/\n$/, "").split("\n");
      if (p.added) {
        for (const l of lines) { afterLines.push({ text: l, type: "add" }); beforeLines.push({ text: "", type: "empty" }); }
      } else if (p.removed) {
        for (const l of lines) { beforeLines.push({ text: l, type: "del" }); afterLines.push({ text: "", type: "empty" }); }
      } else {
        for (const l of lines) { beforeLines.push({ text: l, type: "same" }); afterLines.push({ text: l, type: "same" }); }
      }
    }
    return (
      <div className="overflow-hidden rounded-md border border-border/60">
        {filename && (
          <div className="border-b border-border/60 bg-muted/40 px-3 py-1.5 font-mono text-xs">{filename}</div>
        )}
        <div className="grid grid-cols-2 divide-x divide-border/60">
          <pre className="max-h-[70vh] overflow-auto p-2 font-mono text-[11px] leading-snug">
            {beforeLines.map((l, i) => (
              <div key={i} className={
                l.type === "del" ? "bg-red-500/15 text-red-500" :
                l.type === "empty" ? "bg-muted/20" : ""
              }>
                <span className="pr-2 opacity-40">{l.type === "del" ? "-" : " "}</span>{l.text || " "}
              </div>
            ))}
          </pre>
          <pre className="max-h-[70vh] overflow-auto p-2 font-mono text-[11px] leading-snug">
            {afterLines.map((l, i) => (
              <div key={i} className={
                l.type === "add" ? "bg-emerald-500/15 text-emerald-500" :
                l.type === "empty" ? "bg-muted/20" : ""
              }>
                <span className="pr-2 opacity-40">{l.type === "add" ? "+" : " "}</span>{l.text || " "}
              </div>
            ))}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border/60">
      {filename && (
        <div className="border-b border-border/60 bg-muted/40 px-3 py-1.5 font-mono text-xs">{filename}</div>
      )}
      <pre className="max-h-[70vh] overflow-auto p-2 font-mono text-[11px] leading-snug">
        {parts.map((p, i) => {
          const cls = p.added
            ? "bg-emerald-500/15 text-emerald-500"
            : p.removed
              ? "bg-red-500/15 text-red-500"
              : "";
          const prefix = p.added ? "+" : p.removed ? "-" : " ";
          return p.value.replace(/\n$/, "").split("\n").map((line, j) => (
            <div key={`${i}-${j}`} className={cls}>
              <span className="pr-2 opacity-40">{prefix}</span>{line || " "}
            </div>
          ));
        })}
      </pre>
    </div>
  );
}
