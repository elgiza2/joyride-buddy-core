/** @doc Agents & Skills Marketplace — browse system skills + install to your library. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfileGlassShell, { GlassSection, GlassCard } from "@/components/profile/ProfileGlassShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Download, Search } from "lucide-react";

interface SystemSkill {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  icon: string | null;
  category?: string | null;
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SystemSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("system_skills")
        .select("id,name,description,instructions,icon")
        .eq("is_active", true)
        .order("display_order");
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const install = async (s: SystemSkill) => {
    setInstalling(s.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in"); return; }
      const { error } = await supabase.from("skills").insert({
        user_id: user.id,
        name: s.name,
        description: s.description ?? "",
        instructions: s.instructions ?? "",
        icon: s.icon,
        is_enabled: true,
      } as any);
      if (error) throw error;
      toast.success(`Installed: ${s.name}`);
    } catch (e: any) {
      toast.error(e.message || "Install failed");
    } finally {
      setInstalling(null);
    }
  };

  const filtered = items.filter((s) =>
    !q.trim() || (s.name + " " + (s.description || "")).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <ProfileGlassShell title="Marketplace" onBack={() => navigate("/settings")}>
      <GlassSection>
        <GlassCard>
          <div className="flex items-center gap-2 p-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مهارة أو وكيل..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="divide-y divide-border/50">
            {loading && (
              <div className="p-6 text-center text-sm text-muted-foreground">جارِ التحميل...</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">لا نتائج.</div>
            )}
            {filtered.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-4">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.name}</div>
                  {s.description && (
                    <div className="line-clamp-2 text-xs text-muted-foreground">{s.description}</div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={installing === s.id}
                  onClick={() => install(s)}
                >
                  <Download className="mr-1 h-3 w-3" />
                  {installing === s.id ? "..." : "تثبيت"}
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </GlassSection>
    </ProfileGlassShell>
  );
}
