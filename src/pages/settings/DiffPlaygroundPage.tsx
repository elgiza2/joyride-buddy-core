/** @doc Diff playground — paste before/after, view unified or split diff. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileGlassShell, { GlassSection, GlassCard } from "@/components/profile/ProfileGlassShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DiffView from "@/components/diff/DiffView";

export default function DiffPlaygroundPage() {
  const navigate = useNavigate();
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [mode, setMode] = useState<"unified" | "split">("split");

  return (
    <ProfileGlassShell title="Diff Viewer" onBack={() => navigate("/settings")}>
      <GlassSection>
        <GlassCard>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Before</div>
              <Textarea value={before} onChange={(e) => setBefore(e.target.value)} rows={10} className="font-mono text-xs" />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">After</div>
              <Textarea value={after} onChange={(e) => setAfter(e.target.value)} rows={10} className="font-mono text-xs" />
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border/50 p-3">
            <Button size="sm" variant={mode === "split" ? "default" : "outline"} onClick={() => setMode("split")}>Split</Button>
            <Button size="sm" variant={mode === "unified" ? "default" : "outline"} onClick={() => setMode("unified")}>Unified</Button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-4">
            <DiffView before={before} after={after} mode={mode} />
          </div>
        </GlassCard>
      </GlassSection>
    </ProfileGlassShell>
  );
}
