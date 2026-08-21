/** @doc HITL Approvals — inbox of pending sensitive tool calls awaiting user decision. */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Check, X, RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProfileGlassShell, { GlassSection, GlassCard } from "@/components/profile/ProfileGlassShell";

interface Approval {
  id: string;
  tool_name: string;
  decision: string;
  created_at: string;
  updated_at: string;
}

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    let q = supabase.from("hitl_tool_approvals")
      .select("id, tool_name, decision, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter === "pending") q = q.eq("decision", "pending");
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data as Approval[]) ?? []);
    setLoading(false);
  }, [navigate, filter]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, approve: boolean) => {
    setBusy(id);
    try {
      const { error } = await supabase.from("hitl_tool_approvals")
        .update({ decision: approve ? "approved" : "denied", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success(approve ? "Approved" : "Denied");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally { setBusy(null); }
  };

  return (
    <ProfileGlassShell title="Approvals" onBack={() => navigate("/settings")}>
      <GlassSection>
        <GlassCard>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Sensitive tool approvals</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>Pending</Button>
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
              <Button aria-label="Refresh approvals" variant="ghost" size="icon" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </GlassCard>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <GlassCard>
            <div className="p-8 text-center text-sm text-muted-foreground">
              No {filter === "pending" ? "pending" : ""} approvals.
            </div>
          </GlassCard>
        ) : rows.map((r) => (
          <GlassCard key={r.id}>
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm font-semibold">{r.tool_name}</code>
                  <Badge variant={r.decision === "pending" ? "default" : r.decision === "approved" ? "secondary" : "destructive"}>
                    {r.decision}
                  </Badge>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              {r.decision === "pending" && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => decide(r.id, false)} disabled={busy === r.id}>
                    <X className="mr-1 h-3 w-3" /> Deny
                  </Button>
                  <Button size="sm" onClick={() => decide(r.id, true)} disabled={busy === r.id}>
                    <Check className="mr-1 h-3 w-3" /> Approve
                  </Button>
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </GlassSection>
    </ProfileGlassShell>
  );
}
