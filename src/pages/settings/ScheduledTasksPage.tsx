/** @doc Scheduled Tasks — local-first task scheduler (Pulse-style). */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileGlassShell, { GlassSection, GlassCard } from "@/components/profile/ProfileGlassShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  prompt: string;
  cron: string; // simple: "daily" | "weekly" | "hourly"
  createdAt: number;
  lastRun?: number;
}

const KEY = "megsy.scheduledTasks.v1";

function load(): Task[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(t: Task[]) { localStorage.setItem(KEY, JSON.stringify(t)); }

export default function ScheduledTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cron, setCron] = useState<"hourly" | "daily" | "weekly">("daily");

  useEffect(() => { setTasks(load()); }, []);

  const add = () => {
    if (!title.trim() || !prompt.trim()) return;
    const next = [...tasks, {
      id: crypto.randomUUID(),
      title: title.trim(),
      prompt: prompt.trim(),
      cron,
      createdAt: Date.now(),
    }];
    setTasks(next); save(next);
    setTitle(""); setPrompt("");
  };
  const remove = (id: string) => {
    const next = tasks.filter(t => t.id !== id);
    setTasks(next); save(next);
  };

  return (
    <ProfileGlassShell title="Scheduled Tasks" onBack={() => navigate("/settings")}>
      <GlassSection>
        <GlassCard>
          <div className="space-y-3 p-4">
            <div className="text-xs text-muted-foreground">
              مهام يومية/أسبوعية تُنفَّذ محليًا عند فتح التطبيق. مفيدة لملخّصات، بحث دوري، أو تحديثات سوق.
            </div>
            <Input placeholder="اسم المهمة" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="الـPrompt الذي سيُرسل" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <div className="flex items-center gap-2">
              {(["hourly", "daily", "weekly"] as const).map((c) => (
                <Button key={c} size="sm" variant={cron === c ? "default" : "outline"} onClick={() => setCron(c)}>
                  {c}
                </Button>
              ))}
              <div className="flex-1" />
              <Button size="sm" onClick={add}>إضافة</Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="divide-y divide-border/50">
            {tasks.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">لا مهام بعد.</div>
            )}
            {tasks.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-4">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.prompt}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{t.cron}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </GlassSection>
    </ProfileGlassShell>
  );
}
