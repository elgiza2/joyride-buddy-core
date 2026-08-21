/** @doc Settings page for creating, viewing and revoking API keys. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Key, ShieldAlert, Trash2 } from "lucide-react";

/**
 * Bring-Your-Own-Key settings page (BYOK).
 * Stores user-provided keys locally in the browser so requests can be
 * signed with them from client-side integrations. Values NEVER leave the
 * device until a matching edge-function opt-in is added.
 */
type Provider = "openai" | "anthropic" | "dashscope" | "openrouter" | "groq" | "google";

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  { id: "openai", label: "OpenAI", hint: "sk-..." },
  { id: "anthropic", label: "Anthropic (Claude)", hint: "sk-ant-..." },
  { id: "dashscope", label: "Alibaba DashScope (Qwen)", hint: "sk-..." },
  { id: "openrouter", label: "OpenRouter", hint: "sk-or-..." },
  { id: "groq", label: "Groq", hint: "gsk_..." },
  { id: "google", label: "Google (Gemini)", hint: "AIza..." },
];

const KEY_PREFIX = "megsy.byok.v1.";

function readKey(p: Provider): string {
  try { return localStorage.getItem(KEY_PREFIX + p) || ""; } catch { return ""; }
}
function writeKey(p: Provider, v: string) {
  try {
    if (v) localStorage.setItem(KEY_PREFIX + p, v);
    else localStorage.removeItem(KEY_PREFIX + p);
    window.dispatchEvent(new CustomEvent("megsy:byok-updated", { detail: { provider: p } }));
  } catch {}
}

export default function ApiKeysPage() {
  const [values, setValues] = useState<Record<Provider, string>>(() => {
    const out: any = {};
    for (const p of PROVIDERS) out[p.id] = readKey(p.id);
    return out;
  });
  const [reveal, setReveal] = useState<Record<Provider, boolean>>({} as any);

  useEffect(() => {
    document.title = "API Keys · Megsy";
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/settings" className="rounded-full p-2 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Key className="h-5 w-5" /> مفاتيح API الخاصة بك</h1>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <div className="font-medium">تنبيه أمني</div>
          <div className="mt-1 text-amber-100/90">المفاتيح تُخزَّن محلياً في المتصفح فقط. لا ترسلها لأي جهة، ولا تستخدم هذه الميزة على جهاز مشترك. Megsy لن ترى مفاتيحك.</div>
        </div>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{p.label}</span>
              {values[p.id] && (
                <button onClick={() => { writeKey(p.id, ""); setValues((v) => ({ ...v, [p.id]: "" })); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="حذف المفتاح">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type={reveal[p.id] ? "text" : "password"}
                value={values[p.id]}
                onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                onBlur={(e) => writeKey(p.id, e.target.value.trim())}
                placeholder={p.hint}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setReveal((r) => ({ ...r, [p.id]: !r[p.id] }))}
                className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              >
                {reveal[p.id] ? "إخفاء" : "إظهار"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
