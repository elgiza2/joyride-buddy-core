/** @doc Full-page integration detail: connect, disconnect, or manage a single app. Glass redesign. */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { integrations, type Integration } from "@/lib/integrationsData";
import {
  disconnectIntegration,
  loadIntegrationConnections,
  startIntegrationConnection,
  waitForConnectionRefresh,
} from "@/lib/integrationBackend";
import { getLongDescription } from "@/lib/integrationLongDescription";
import ProfileGlassShell, {
  GlassSection,
  GlassCard,
  GlassPrimaryButton,
} from "@/components/profile/ProfileGlassShell";
import { brandLogoSources } from "@/lib/brandLogoSources";

const SUPABASE_FUNCTIONS_URL = "https://ltgampdtawuefwwayncx.supabase.co/functions/v1";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Z2FtcGR0YXd1ZWZ3d2F5bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njk5ODAsImV4cCI6MjA4ODM0NTk4MH0.5ZOzuxCrm-TO4zzRDJ68LrCLH3f0itiznUxhbEupvGg";

async function invokeIntegrationStatus(functionName: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || data?.message || `${functionName} failed`);
    return data;
  } finally {
    window.clearTimeout(timeout);
  }
}


function AppLogo({ integration, size = 56 }: { integration: Integration; size?: number }) {
  const [idx, setIdx] = useState(0);
  const sources = integration.domain ? brandLogoSources(integration.domain) : [];
  const url = sources[idx];
  if (!url) {
    return (
      <span className="font-semibold text-foreground/70" style={{ fontSize: size * 0.4 }}>
        {integration.name.charAt(0)}
      </span>
    );
  }
  return (
    <img decoding="async"
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

export default function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const integration = useMemo(() => integrations.find((i) => i.id === id), [id]);

  const [connected, setConnected] = useState(false);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    if (!integration) return;
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integration?.id]);

  const loadStatus = async () => {
    if (!integration) return;
    setLoadingStatus(true);
    const timeoutId = window.setTimeout(() => {
      setLoadingStatus(false);
    }, 9_000);
    try {
      if (integration.type === "oauth" && integration.app === "github") {
        const data = await invokeIntegrationStatus("github-push", { action: "status" });
        setConnected(!!data?.connected);
        setMeta(data?.account ?? (data?.account_name ? { account_name: data.account_name } : null));
        return;
      }
      const snapshot = await loadIntegrationConnections([integration]);
      setConnected(!!snapshot.connectedApps[integration.app]);
      setMeta(snapshot.appMeta[integration.app] ?? null);
    } catch (error) {
      console.error("[integration-detail] status failed", error);
      setConnected(false);
      setMeta(null);
    } finally {
      window.clearTimeout(timeoutId);
      setLoadingStatus(false);
    }
  };

  const handleConnect = async () => {
    if (!integration) return;
    setLoading(true);
    try {
      const result = await startIntegrationConnection(integration);
      if (result.mode === "local") {
        setConnected(true);
        setMeta((prev: any) => prev ?? { account_name: integration.name });
        setLoadingStatus(false);
        void loadStatus();
        toast.success(`${integration.name} connected`);
        return;
      }
      toast.success(`Finish connecting ${integration.name} in the popup`);
      await waitForConnectionRefresh(async () => {
        if (integration.type === "oauth" && integration.app === "github") {
          const data = await invokeIntegrationStatus("github-push", { action: "status" }).catch(() => null);
          const ok = !!data?.connected;
          setConnected(ok);
          setMeta(data?.account ?? (data?.account_name ? { account_name: data.account_name } : null));
          return ok;
        }
        const snapshot = await loadIntegrationConnections([integration]);
        const ok = !!snapshot.connectedApps[integration.app];
        setConnected(ok);
        setMeta(snapshot.appMeta[integration.app] ?? null);
        return ok;
      }, result.popup);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${integration.name} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integration) return;
    setLoading(true);
    try {
      await disconnectIntegration(integration);
      await loadStatus();
      toast.success(`${integration.name} disconnected`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Disconnect failed");
    } finally {
      setLoading(false);
    }
  };


  if (!integration) {
    return (
      <ProfileGlassShell
        title="Integration not found"
        subtitle="This integration does not exist or has been removed."
        onBack={() => navigate("/settings/integrations")}
      >
        <GlassSection>
          <GlassPrimaryButton onClick={() => navigate("/settings/integrations")}>
            Back to integrations
          </GlassPrimaryButton>
        </GlassSection>
      </ProfileGlassShell>
    );
  }

  const longDesc = getLongDescription(integration);
  const highlights = [
    { icon: Shield, label: "Secure connection", desc: "Tokens are stored on the server and never exposed to the browser." },
    { icon: Zap, label: "Instant actions", desc: `Megsy can trigger ${integration.name} actions directly from the chat.` },
  ];

  return (
    <ProfileGlassShell
      title={integration.name}
      onBack={() => navigate("/settings/integrations")}
    >
      <style>{css}</style>

      <GlassSection>
        <div className="idp-hero-row">
          <div className={`idp-logo ${connected ? "is-connected" : ""}`}>
            <AppLogo integration={integration} size={40} />
            {connected && <span className="idp-logo-dot" aria-hidden />}
          </div>
          <div className="idp-hero-text">
            <h2 className="idp-hero-title">{integration.name}</h2>
            <p className="idp-hero-desc">{integration.description}</p>
          </div>
          <button
            onClick={connected ? handleDisconnect : handleConnect}
            disabled={loading || loadingStatus}
            className={`idp-pill ${connected ? "is-connected" : ""}`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : connected ? "Connected" : "Connect"}
          </button>
        </div>
      </GlassSection>

      <GlassSection>
        <p className="idp-about-lead">{longDesc.intro}</p>
      </GlassSection>

      {longDesc.uses.length > 0 && (
        <GlassSection title={`Tools · ${longDesc.uses.length}`}>
          <div className="idp-chips">
            {longDesc.uses.map((use) => (
              <span key={use} className="idp-chip">{use}</span>
            ))}
          </div>
        </GlassSection>
      )}

      <GlassSection title="Details">
        <div className="idp-details">
          <div className="idp-detail-row">
            <p className="idp-detail-label">Author</p>
            <p className="idp-detail-value">{integration.name}</p>
          </div>
          {integration.domain && (
            <div className="idp-detail-row">
              <p className="idp-detail-label">Connector URL</p>
              <p className="idp-detail-value idp-mono">https://{integration.domain}</p>
            </div>
          )}
          {integration.domain && (
            <div className="idp-detail-row">
              <p className="idp-detail-label">More info</p>
              <div className="idp-detail-links">
                <a href={`https://${integration.domain}`} target="_blank" rel="noreferrer" className="idp-link">Documentation</a>
                <a href={`https://${integration.domain}`} target="_blank" rel="noreferrer" className="idp-link">Support</a>
                <a href={`https://${integration.domain}`} target="_blank" rel="noreferrer" className="idp-link">Privacy policy</a>
              </div>
            </div>
          )}
        </div>
      </GlassSection>

      <GlassSection title="Built-in safeguards">
        <GlassCard>
          {highlights.map((h, i) => (
            <div key={h.label} className={`idp-safe ${i > 0 ? "has-divider" : ""}`}>
              <span className="idp-safe-ic">
                <h.icon className="w-[18px] h-[18px]" strokeWidth={1.6} />
              </span>
              <div className="idp-safe-body">
                <p className="idp-safe-label">{h.label}</p>
                <p className="idp-safe-desc">{h.desc}</p>
              </div>
            </div>
          ))}
        </GlassCard>
      </GlassSection>
    </ProfileGlassShell>
  );
}

const css = `
.idp-hero-row {
  display: grid; grid-template-columns: 52px 1fr auto; gap: 14px; align-items: center;
  padding: 16px; border-radius: 20px;
  background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.07);
}
.idp-logo {
  position: relative;
  width: 52px; height: 52px; border-radius: 14px;
  display: grid; place-items: center; flex-shrink: 0;
  background: rgba(255,255,255,0.94);
  box-shadow: 0 4px 14px -6px rgba(0,0,0,0.5);
}
.idp-logo-dot {
  position: absolute; top: -2px; right: -2px;
  width: 12px; height: 12px; border-radius: 999px;
  background: #34c759; box-shadow: 0 0 0 3px #0a0a0b;
}
.idp-hero-text { min-width: 0; }
.idp-hero-title { margin: 0; font-size: 17px; font-weight: 600; color: #f5f2ea; letter-spacing: -0.01em; }
.idp-hero-desc { margin: 3px 0 0; font-size: 13px; line-height: 1.4; color: rgba(255,255,255,0.55); }
.idp-pill {
  flex-shrink: 0; height: 34px; padding: 0 18px; border-radius: 999px;
  background: #f2eee7; color: #14161a; border: 0;
  font: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: transform 150ms, opacity 150ms;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.idp-pill:active { transform: scale(0.96); }
.idp-pill:disabled { opacity: 0.6; cursor: not-allowed; }
.idp-pill.is-connected {
  background: rgba(52,199,89,0.14); color: #7be0a8;
  border: 1px solid rgba(52,199,89,0.28);
}

.idp-about-lead {
  margin: 0; padding: 2px 4px; font-size: 14px; line-height: 1.6;
  color: rgba(242,238,231,0.78);
}

.idp-chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 2px; }
.idp-chip {
  font-size: 12.5px; padding: 6px 12px; border-radius: 999px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(242,238,231,0.85); white-space: nowrap;
}

.idp-details {
  display: flex; flex-direction: column; gap: 16px;
  padding: 18px; border-radius: 18px;
  background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
}
.idp-detail-row { display: flex; flex-direction: column; gap: 4px; }
.idp-detail-label {
  margin: 0; font-size: 11px; font-weight: 600;
  color: rgba(201,168,76,0.85); letter-spacing: 0.12em; text-transform: uppercase;
}
.idp-detail-value { margin: 0; font-size: 13.5px; color: rgba(242,238,231,0.85); word-break: break-all; }
.idp-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
.idp-detail-links { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
.idp-link {
  font-size: 13.5px; color: #c9a84c; text-decoration: underline;
  text-decoration-color: rgba(201,168,76,0.35); text-underline-offset: 3px;
}
.idp-link:hover { text-decoration-color: #c9a84c; }

.idp-safe {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; position: relative;
}
.idp-safe.has-divider::before {
  content: ""; position: absolute; top: 0; left: 18px; right: 18px; height: 1px;
  background: rgba(255,255,255,0.06);
}
.idp-safe-ic {
  width: 36px; height: 36px; border-radius: 12px;
  display: grid; place-items: center;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(242,238,231,0.8);
}
.idp-safe-body { min-width: 0; flex: 1; }
.idp-safe-label { margin: 0; font-size: 13.5px; font-weight: 600; color: #f2eee7; }
.idp-safe-desc { margin: 4px 0 0; font-size: 12.5px; line-height: 1.5; color: rgba(255,255,255,0.55); }
`;

