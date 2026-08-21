/** @doc Profile editor — full name, nickname, AI instructions. Autosaves. */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSmartBack } from "@/hooks/useSmartBack";
import { Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeErrorMessage } from "@/lib/sanitizeError";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubShell, SubSection, SubCard, DangerCallout } from "@/components/settings/SubShell";

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [instructions, setInstructions] = useState("");

  const savedRef = useRef({ fullName: "", nickname: "", instructions: "" });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Load data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const [profileRes, persRes] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("ai_personalization").select("call_name, custom_instructions").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;

      const initialFull =
        (profileRes.data as any)?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "";
      const initialNick = (persRes.data as any)?.call_name || initialFull;
      const initialInstr = (persRes.data as any)?.custom_instructions || "";

      setFullName(initialFull);
      setNickname(initialNick);
      setInstructions(initialInstr);
      savedRef.current = {
        fullName: initialFull,
        nickname: initialNick,
        instructions: initialInstr,
      };
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (loading || !userId) return;
    const dirtyName = fullName.trim() !== savedRef.current.fullName.trim();
    const dirtyNick = nickname !== savedRef.current.nickname;
    const dirtyInstr = instructions !== savedRef.current.instructions;
    if (!dirtyName && !dirtyNick && !dirtyInstr) return;

    setSaveState("saving");
    const timer = setTimeout(async () => {
      try {
        const tasks: Promise<any>[] = [];
        if (dirtyName && fullName.trim()) {
          tasks.push(
            Promise.resolve(
              supabase.rpc("update_profile_safe", {
                p_user_id: userId,
                p_display_name: fullName.trim(),
              }),
            ),
          );
          tasks.push(supabase.auth.updateUser({ data: { full_name: fullName.trim() } }));
        }
        if (dirtyNick || dirtyInstr) {
          tasks.push(
            Promise.resolve(
              supabase.from("ai_personalization").upsert(
                {
                  user_id: userId,
                  call_name: nickname.trim() || null,
                  custom_instructions: instructions.trim() || null,
                },
                { onConflict: "user_id" },
              ),
            ),
          );
        }
        const results = await Promise.all(tasks);
        const err = results.find((r: any) => r?.error)?.error;
        if (err) throw err;

        savedRef.current = { fullName, nickname, instructions };
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1400);
      } catch (err: any) {
        setSaveState("idle");
        toast.error(sanitizeErrorMessage(err, "Failed to save"));
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [fullName, nickname, instructions, loading, userId]);

  const goBack = useSmartBack("/settings");

  const openDelete = () => setConfirmOpen(true);
  const confirmDelete = () => {
    setConfirmOpen(false);
    navigate("/settings/delete-account");
  };

  const statusIcon =
    saveState === "saving" ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : saveState === "saved" ? (
      <Check className="w-3.5 h-3.5" />
    ) : null;

  // ============================== MOBILE ==============================
  if (isMobile) {
    return (
      <div className="pep-root">
        <style>{pepCss}</style>

        {/* Topbar */}
        <header className="pep-topbar">
          <button className="pep-icon-btn" aria-label="Back" onClick={goBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="pep-title">Profile</h1>
          <button className="pep-icon-btn" aria-label="Done" onClick={goBack}>
            {statusIcon || (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>
        </header>

        <main className="pep-main">
          {/* Names group */}
          <section className="pep-card">
            <div className="pep-row">
              <label htmlFor="pep-full" className="pep-row-label">Full name</label>
              <input
                id="pep-full"
                className="pep-row-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div className="pep-divider" />
            <div className="pep-row">
              <label htmlFor="pep-nick" className="pep-row-label">Nickname</label>
              <input
                id="pep-nick"
                className="pep-row-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname"
                autoComplete="nickname"
              />
            </div>
          </section>
          <p className="pep-hint">Megsy calls you by your nickname in chat.</p>

          {/* Instructions */}
          <h2 className="pep-section-title">Instructions</h2>
          <section className="pep-card pep-card-tight">
            <textarea
              className="pep-textarea"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="How you'd like Megsy to respond"
              rows={4}
            />
          </section>
          <p className="pep-hint">
            Your instructions will apply to all conversations.
          </p>

          {/* Delete account */}
          <button className="pep-danger" onClick={openDelete} type="button">
            <Trash2 className="w-[18px] h-[18px]" />
            <span>Delete account</span>
          </button>

          <div className="pep-spacer" />
        </main>

        {/* Confirm dialog */}
        {confirmOpen && (
          <div className="pep-modal-scrim" onClick={() => setConfirmOpen(false)}>
            <div
              className="pep-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pep-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="pep-modal-title" className="pep-modal-title">Delete account</h3>
              <p className="pep-modal-body">Are you sure you want to delete your account?</p>
              <div className="pep-modal-actions">
                <button className="pep-modal-btn" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="pep-modal-btn pep-modal-btn-danger" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================== DESKTOP ==============================
  return (
    <SubShell
      title="Profile"
      subtitle="Changes are saved automatically."
      backTo="/settings"
      action={
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {saveState === "saving" && (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>)}
          {saveState === "saved" && (<><Check className="w-3.5 h-3.5 text-primary" /> Saved</>)}
        </span>
      }
    >
      <SubSection title="Names" description="How Megsy addresses you.">
        <SubCard>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80 font-medium">
                Full name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="mt-2 w-full px-3.5 py-2.5 rounded-lg bg-background/60 border border-border/70 text-[14px] text-foreground outline-none focus:border-foreground/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80 font-medium">
                Nickname
              </label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname"
                className="mt-2 w-full px-3.5 py-2.5 rounded-lg bg-background/60 border border-border/70 text-[14px] text-foreground outline-none focus:border-foreground/40 transition-colors"
              />
              <p className="mt-2 text-[12px] text-muted-foreground">
                Megsy calls you by your nickname in chat.
              </p>
            </div>
          </div>
        </SubCard>
      </SubSection>

      <SubSection title="Instructions" description="Custom guidance applied to every conversation.">
        <SubCard>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="How you'd like Megsy to respond"
            rows={5}
            className="w-full px-3.5 py-2.5 rounded-lg bg-background/60 border border-border/70 text-[14px] text-foreground outline-none focus:border-foreground/40 transition-colors resize-y"
          />
        </SubCard>
      </SubSection>

      <SubSection title="Danger zone" description="Irreversible actions.">
        <DangerCallout
          title="Delete account"
          description="Permanently remove your account and all associated data."
          action={
            <button
              onClick={() => navigate("/settings/delete-account")}
              className="px-4 py-2 rounded-lg text-[13px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
            >
              Delete account
            </button>
          }
        />
      </SubSection>
    </SubShell>
  );
};

const pepCss = `
.pep-root {
  min-height: 100dvh;
  background: #000;
  color: #ede4d8;
  font-family: "Neue Haas Unica", "Helvetica Now Display", -apple-system, "SF Pro Display", Inter, "Segoe UI", Roboto, sans-serif;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pep-topbar {
  position: sticky; top: 0; z-index: 5;
  display: grid; grid-template-columns: 44px 1fr 44px;
  align-items: center;
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 14px 12px;
  background: linear-gradient(to bottom, #000 82%, transparent);
}
.pep-title {
  margin: 0;
  text-align: center;
  font-size: 17px; font-weight: 600;
  letter-spacing: -0.01em;
  color: #ede4d8;
}
.pep-icon-btn {
  width: 44px; height: 44px;
  display: inline-grid; place-items: center;
  border-radius: 22px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: #ede4d8;
  cursor: pointer;
  transition: transform 160ms ease;
}
.pep-icon-btn:active { transform: scale(0.94); }

.pep-main { padding: 8px 16px 24px; }
.pep-section-title {
  margin: 22px 4px 10px;
  font-size: 13px; font-weight: 500;
  color: rgba(235,220,205,0.55);
  letter-spacing: -0.005em;
}

.pep-card {
  background: #0d0d0d;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px;
  overflow: hidden;
}
.pep-card-tight { padding: 4px; }


.pep-row {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px;
  min-height: 56px;
}
.pep-row-label {
  font-size: 15.5px; font-weight: 400;
  color: rgba(235,220,205,0.55);
  flex-shrink: 0;
}
.pep-root .pep-row-input {
  flex: 1;
  background-color: #0d0d0d !important;
  background-image: none !important;
  border: 0 !important; outline: none;
  color: #ede4d8 !important;
  font: inherit;
  font-size: 15.5px; font-weight: 500;
  text-align: right;
  min-width: 0;
  -webkit-appearance: none;
  appearance: none;
  color-scheme: dark;
  box-shadow: none !important;
  caret-color: #ede4d8;
}
.pep-root .pep-row-input::placeholder { color: rgba(235,220,205,0.28) !important; }
.pep-root .pep-row-input:-webkit-autofill,
.pep-root .pep-row-input:-webkit-autofill:hover,
.pep-root .pep-row-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #0d0d0d inset;
  -webkit-text-fill-color: #ede4d8;
  caret-color: #ede4d8;
}
.pep-divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin-left: 18px;
}
.pep-hint {
  margin: 10px 6px 0;
  font-size: 13px;
  color: rgba(235,220,205,0.5);
  line-height: 1.45;
}

/* Scope under .pep-root so these rules beat the mobile theme's global
   body.ms-theme textarea selector and keep the textarea the same dark
   surface as the card. */
.pep-root .pep-textarea {
  width: 100%;
  min-height: 92px;
  background-color: #0d0d0d !important;
  background-image: none !important;
  border: 0; outline: none;
  padding: 14px 16px;
  color: #ede4d8;
  font: inherit;
  font-size: 15.5px; font-weight: 400;
  resize: none;
  -webkit-appearance: none;
  appearance: none;
  color-scheme: dark;
  box-shadow: none;
}
.pep-root .pep-textarea::placeholder { color: rgba(235,220,205,0.35); }
.pep-root .pep-textarea:-webkit-autofill,
.pep-root .pep-textarea:-webkit-autofill:hover,
.pep-root .pep-textarea:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #0d0d0d inset;
  -webkit-text-fill-color: #ede4d8;
  caret-color: #ede4d8;
}

.pep-danger {
  margin-top: 22px;
  width: 100%;
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px;
  background: rgba(255,90,90,0.06);
  border: 1px solid rgba(255,90,90,0.12);
  border-radius: 18px;
  color: #f87171;
  font: inherit;
  font-size: 15.5px; font-weight: 500;
  cursor: pointer;
  transition: transform 160ms ease, background-color 160ms ease;
}
.pep-danger:active { transform: scale(0.99); background: rgba(255,90,90,0.10); }

.pep-spacer { height: 32px; }

/* Confirm modal */
.pep-modal-scrim {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  display: grid; place-items: center;
  padding: 24px;
  animation: pep-fade 200ms ease-out both;
}
.pep-modal {
  width: 100%; max-width: 340px;
  background: rgba(20,20,20,0.55);
  backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 22px;
  padding: 22px 22px 14px;
  box-shadow: 0 24px 60px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06);
  animation: pep-pop 220ms cubic-bezier(0.16,1,0.3,1) both;
}
.pep-modal-title {
  margin: 0 0 6px;
  font-size: 17px; font-weight: 600;
  color: #ede4d8;
}
.pep-modal-body {
  margin: 0 0 18px;
  font-size: 14.5px; line-height: 1.4;
  color: rgba(235,220,205,0.65);
}
.pep-modal-actions {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.pep-modal-btn {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: #ede4d8;
  font: inherit;
  font-size: 15px; font-weight: 500;
  cursor: pointer;
  transition: transform 160ms ease, background-color 160ms ease;
}
.pep-modal-btn:active { transform: scale(0.97); }
.pep-modal-btn-danger {
  color: #f87171;
  background: rgba(255,90,90,0.08);
  border-color: rgba(255,90,90,0.16);
}

@keyframes pep-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pep-pop {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
`;

export default ProfileEditPage;
