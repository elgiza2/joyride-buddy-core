/** @doc Integrations catalog — Claude-style Connectors list with MCP merged in. */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, Loader2, Trash2, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { integrations, INTEGRATION_CATEGORIES, type Integration } from "@/lib/integrationsData";
import { loadIntegrationConnections, startIntegrationConnection, waitForConnectionRefresh, disconnectIntegration } from "@/lib/integrationBackend";
import { brandLogoSources } from "@/lib/brandLogoSources";
import ProfileGlassShell, { GlassSection } from "@/components/profile/ProfileGlassShell";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface McpRow {
  id: string;
  name: string;
  url: string;
  state: string;
  tool_names: string[];
  last_error: string | null;
  enabled: boolean;
  auth_headers: Record<string, string>;
}

const BrandLogo = ({ integration, size = 28 }: { integration: Integration; size?: number }) => {
  const [srcIdx, setSrcIdx] = useState(0);
  const sources = integration.domain ? brandLogoSources(integration.domain) : [];
  const url = sources[srcIdx];
  if (!url) {
    return (
      <span className="font-semibold text-white/80" style={{ fontSize: size * 0.5 }}>
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
      onError={() => setSrcIdx((i) => i + 1)}
    />
  );
};

async function callMcpManage(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("crawl-url", {
    body: { action: `mcp_${action}`, ...payload },
  });
  if (error) throw new Error(error.message);
  return data as { ok?: boolean; error?: string; tools?: { name: string }[]; tool_names?: string[] };
}

function parseHeaders(text: string): Record<string, string> {
  if (!text.trim()) return {};
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === "object") return obj as Record<string, string>;
  } catch { /* line parser */ }
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) {
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim();
      if (k) out[k] = v;
    }
  }
  return out;
}

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // MCP
  const [mcpRows, setMcpRows] = useState<McpRow[]>([]);
  const [discovery, setDiscovery] = useState<boolean>(() => {
    try { return localStorage.getItem("megsy_connector_discovery") !== "0"; } catch { return true; }
  });
  const [addOpen, setAddOpen] = useState(false);
  const [mcpName, setMcpName] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpHeaders, setMcpHeaders] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [snap, mcpRes] = await Promise.all([
          loadIntegrationConnections(integrations),
          supabase.from("mcp_connections").select("*").order("created_at", { ascending: false }),
        ]);
        setConnectedApps(snap.connectedApps);
        setMcpRows(((mcpRes.data ?? []) as McpRow[]));
      } catch (e) {
        console.error("[integrations] load failed", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    try { localStorage.setItem("megsy_connector_discovery", discovery ? "1" : "0"); } catch { /* noop */ }
  }, [discovery]);

  const reloadMcp = async () => {
    const { data } = await supabase.from("mcp_connections").select("*").order("created_at", { ascending: false });
    setMcpRows(((data ?? []) as McpRow[]));
  };

  const isConnected = (app: string) => !!connectedApps[app];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return integrations.filter((i) => {
      if (activeCategory !== "All" && i.category !== activeCategory) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const sortedByConnected = useMemo(() => {
    return [...filtered].sort((a, b) => Number(isConnected(b.app)) - Number(isConnected(a.app)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, connectedApps]);

  const filteredMcp = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mcpRows;
    return mcpRows.filter((r) =>
      r.name.toLowerCase().includes(q) || (r.url ?? "").toLowerCase().includes(q)
    );
  }, [mcpRows, query]);

  const handleConnect = async (integration: Integration) => {
    setConnectingId(integration.id);
    try {
      const result = await startIntegrationConnection(integration);
      if (result.mode === "local") {
        setConnectedApps((s) => ({ ...s, [integration.app]: true }));
        toast.success(`${integration.name} connected`);
        return;
      }
      toast.success(`Finish connecting ${integration.name} in the popup`);
      await waitForConnectionRefresh(async () => {
        const snap = await loadIntegrationConnections([integration]);
        const ok = !!snap.connectedApps[integration.app];
        if (ok) setConnectedApps((s) => ({ ...s, [integration.app]: true }));
        return ok;
      }, result.popup);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${integration.name} failed`);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    setConnectingId(integration.id);
    try {
      await disconnectIntegration(integration);
      setConnectedApps((s) => ({ ...s, [integration.app]: false }));
      toast.success(`${integration.name} disconnected`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Disconnect failed");
    } finally {
      setConnectingId(null);
    }
  };

  const handleAddMcp = async () => {
    if (!mcpName.trim() || !mcpUrl.trim()) {
      toast.error("Name and URL are required");
      return;
    }
    if (!/^https:\/\//i.test(mcpUrl.trim())) {
      toast.error("URL must start with https://");
      return;
    }
    const headers = parseHeaders(mcpHeaders);
    setSaving(true);
    try {
      const probe = await callMcpManage("probe", { url: mcpUrl.trim(), headers });
      const toolNames = probe.tool_names ?? probe.tools?.map((t) => t.name) ?? [];
      const state = probe.ok ? "ready" : "failed";
      const last_error = probe.ok ? null : probe.error ?? "probe failed";
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("mcp_connections").insert({
        user_id: user.id,
        name: mcpName.trim(),
        url: mcpUrl.trim(),
        transport: "http",
        auth_headers: headers,
        state,
        tool_names: toolNames,
        last_error,
      });
      if (error) throw error;
      toast.success(probe.ok ? `Connected — ${toolNames.length} tools` : `Saved but not ready: ${last_error}`);
      setAddOpen(false);
      setMcpName(""); setMcpUrl(""); setMcpHeaders("");
      reloadMcp();
    } catch (err) {
      toast.error(String((err as Error).message ?? err));
    } finally {
      setSaving(false);
    }
  };

  const handleMcpToggle = async (row: McpRow) => {
    await supabase.from("mcp_connections").update({ enabled: !row.enabled }).eq("id", row.id);
    reloadMcp();
  };

  const handleMcpDelete = async (row: McpRow) => {
    if (!confirm(`Delete "${row.name}"?`)) return;
    const { error } = await supabase.from("mcp_connections").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    reloadMcp();
  };

  const handleMcpRefresh = async (row: McpRow) => {
    try {
      const res = await callMcpManage("refresh", { id: row.id });
      if (res.ok) toast.success(`Refreshed — ${res.tools?.length ?? 0} tools`);
      else toast.error(res.error ?? "refresh failed");
      reloadMcp();
    } catch (err) {
      toast.error(String((err as Error).message ?? err));
    }
  };

  return (
    <ProfileGlassShell
      title="Connectors"
      subtitle="Connect your tools and MCP servers so Megsy can act on your behalf."
      onBack={() => navigate("/settings")}
      trailing={
        <button
          onClick={() => setAddOpen(true)}
          aria-label="Add MCP server"
          className="cn-add-btn"
        >
          <Plus className="w-[17px] h-[17px]" strokeWidth={2.2} />
        </button>
      }
    >
      <style>{css}</style>

      <GlassSection>
        <div className="cn-search">
          <Search className="w-4 h-4 opacity-60 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
          />
        </div>

        <div className="cn-discovery">
          <div className="cn-disc-ic"><Server className="w-[18px] h-[18px]" strokeWidth={1.7} /></div>
          <div className="cn-disc-body">
            <p className="cn-disc-title">Connector discovery</p>
            <p className="cn-disc-desc">Megsy will help you find available connectors in your directory.</p>
          </div>
          <Switch checked={discovery} onCheckedChange={setDiscovery} />
        </div>

        <div className="cn-cats">
          {INTEGRATION_CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn("cn-cat", active && "is-active")}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </GlassSection>

      {/* MCP servers section */}
      {(filteredMcp.length > 0 || activeCategory === "All") && (
        <GlassSection title={`MCP Servers${filteredMcp.length ? ` · ${filteredMcp.length}` : ""}`}>
          {filteredMcp.length === 0 ? (
            <button className="cn-mcp-empty" onClick={() => setAddOpen(true)}>
              <span className="cn-mcp-empty-ic"><Plus className="w-4 h-4" /></span>
              <span>
                <p>Add an MCP server</p>
                <em>Connect any Model Context Protocol endpoint (HTTPS).</em>
              </span>
            </button>
          ) : (
            <div className="cn-list">
              {filteredMcp.map((row) => (
                <div key={row.id} className="cn-card">
                  <div className="cn-card-main">
                    <div className="cn-logo cn-logo-mcp">
                      <Server className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    </div>
                    <div className="cn-body">
                      <div className="cn-title-row">
                        <span className="cn-title">{row.name}</span>
                        <span className={cn("cn-tag", row.state === "ready" ? "is-ok" : "is-warn")}>
                          {row.state === "ready" ? `${row.tool_names?.length ?? 0} tools` : row.state}
                        </span>
                      </div>
                      <p className="cn-desc">{row.url}</p>
                    </div>
                  </div>
                  <div className="cn-mcp-actions">
                    <Switch checked={row.enabled} onCheckedChange={() => handleMcpToggle(row)} />
                    <button className="cn-icon-btn" onClick={() => handleMcpRefresh(row)} aria-label="Refresh">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="cn-icon-btn cn-danger" onClick={() => handleMcpDelete(row)} aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassSection>
      )}

      <GlassSection title={isLoading ? "Loading" : `${filtered.length} connectors`}>
        {isLoading ? (
          <div className="cn-empty">
            <Loader2 className="w-4 h-4 animate-spin opacity-60" />
            <p>Loading connectors…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cn-empty">
            <p>No matches</p>
            <span>Try a different keyword or category.</span>
          </div>
        ) : (
          <div className="cn-list">
            {sortedByConnected.map((integration) => {
              const isConn = isConnected(integration.app);
              const busy = connectingId === integration.id;
              return (
                <div key={integration.id} className="cn-card">
                  <button
                    type="button"
                    className="cn-card-main"
                    onClick={() => navigate(`/settings/integrations/${integration.id}`)}
                  >
                    <div className="cn-logo">
                      <BrandLogo integration={integration} size={26} />
                    </div>
                    <div className="cn-body">
                      <div className="cn-title-row">
                        <span className="cn-title">{integration.name}</span>
                        <span className="cn-cat-tag">{integration.category}</span>
                      </div>
                      <p className="cn-desc">{integration.description}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => (isConn ? handleDisconnect(integration) : handleConnect(integration))}
                    disabled={busy}
                    className={cn("cn-connect-btn", isConn && "is-connected")}
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isConn ? "Connected" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </GlassSection>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Add MCP server</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={mcpName} onChange={(e) => setMcpName(e.target.value)} placeholder="My MCP server" />
            </div>
            <div>
              <Label>URL (HTTPS)</Label>
              <Input value={mcpUrl} onChange={(e) => setMcpUrl(e.target.value)} placeholder="https://example.com/mcp" />
            </div>
            <div>
              <Label>Auth headers (optional)</Label>
              <Textarea
                value={mcpHeaders}
                onChange={(e) => setMcpHeaders(e.target.value)}
                placeholder={`Authorization: Bearer xxx\nX-Api-Key: yyy`}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleAddMcp} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add & probe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfileGlassShell>
  );
}

const css = `
.cn-add-btn {
  width: 36px; height: 36px; border-radius: 999px;
  display: grid; place-items: center;
  background: var(--overlay-white-06); border: 1px solid var(--overlay-white-10);
  color: #f2eee7; cursor: pointer; transition: background 150ms, transform 150ms;
}
.cn-add-btn:hover { background: var(--overlay-white-10); }
.cn-add-btn:active { transform: scale(0.95); }

.cn-search {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: 16px;
  background: var(--overlay-white-04); border: 1px solid var(--overlay-white-08);
  color: #f2eee7; margin-bottom: 10px;
}
.cn-search input {
  flex: 1; background: transparent; border: 0; outline: 0;
  font: inherit; font-size: 14.5px; color: inherit;
}
.cn-search input::placeholder { color: rgba(255,255,255,0.4); }

.cn-discovery {
  display: flex; align-items: center; gap: 12px;
  padding: 14px; border-radius: 18px;
  background: var(--overlay-white-04); border: 1px solid var(--overlay-white-08);
  margin-bottom: 12px;
}
.cn-disc-ic {
  width: 34px; height: 34px; border-radius: 10px;
  display: grid; place-items: center; flex-shrink: 0;
  background: var(--overlay-white-06); color: rgba(242,238,231,0.85);
}
.cn-disc-body { flex: 1; min-width: 0; }
.cn-disc-title { margin: 0; font-size: 14px; font-weight: 600; color: #f2eee7; }
.cn-disc-desc { margin: 3px 0 0; font-size: 12.5px; line-height: 1.4; color: rgba(255,255,255,0.55); }

.cn-cats {
  display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px;
  scrollbar-width: none;
}
.cn-cats::-webkit-scrollbar { display: none; }
.cn-cat {
  flex-shrink: 0; height: 30px; padding: 0 13px; border-radius: 999px;
  background: var(--overlay-white-04); border: 1px solid var(--overlay-white-08);
  color: var(--overlay-white-70); font: inherit; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 150ms;
}
.cn-cat:hover { background: var(--overlay-white-06); color: #f2eee7; }
.cn-cat.is-active { background: #f2eee7; color: #14161a; border-color: transparent; }

.cn-list { display: flex; flex-direction: column; gap: 10px; }
.cn-card {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px; border-radius: 20px;
  background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.06);
  transition: background 150ms, border-color 150ms;
}
.cn-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.10); }

.cn-card-main {
  flex: 1; display: grid; grid-template-columns: 42px 1fr; gap: 12px; align-items: start;
  background: transparent; border: 0; text-align: left; cursor: pointer;
  color: #f2eee7; padding: 0; min-width: 0;
}
.cn-logo {
  width: 42px; height: 42px; border-radius: 12px;
  display: grid; place-items: center; flex-shrink: 0;
  background: rgba(255,255,255,0.94);
  box-shadow: 0 2px 8px -2px rgba(0,0,0,0.4);
}
.cn-logo-mcp {
  background: linear-gradient(135deg, rgba(120,140,255,0.25), rgba(80,90,200,0.18));
  color: #b8c5ff;
  border: 1px solid rgba(140,150,255,0.25);
}
.cn-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; padding-top: 1px; }
.cn-title-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.cn-title { font-size: 15.5px; font-weight: 600; color: #f2eee7; letter-spacing: -0.01em; }
.cn-cat-tag {
  font-size: 11.5px; font-weight: 500;
  color: rgba(255,255,255,0.42);
}
.cn-tag {
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  letter-spacing: 0.02em;
}
.cn-tag.is-ok { color: #7be0a8; background: rgba(52,199,89,0.14); }
.cn-tag.is-warn { color: #f5b971; background: rgba(245,158,11,0.14); }
.cn-desc {
  margin: 0; font-size: 13px; line-height: 1.4; color: rgba(255,255,255,0.55);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.cn-connect-btn {
  flex-shrink: 0; height: 34px; padding: 0 16px; border-radius: 999px;
  background: #f2eee7; color: #14161a; border: 0;
  font: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: transform 150ms, opacity 150ms;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.cn-connect-btn:active { transform: scale(0.96); }
.cn-connect-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.cn-connect-btn.is-connected {
  background: rgba(52,199,89,0.14); color: #7be0a8;
  border: 1px solid rgba(52,199,89,0.28);
}

.cn-mcp-empty {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 14px; border-radius: 18px;
  background: var(--overlay-white-03); border: 1px dashed var(--overlay-white-12);
  color: #f2eee7; text-align: left; cursor: pointer; transition: background 150ms;
}
.cn-mcp-empty:hover { background: var(--overlay-white-06); }
.cn-mcp-empty-ic {
  width: 42px; height: 42px; border-radius: 12px;
  display: grid; place-items: center; flex-shrink: 0;
  background: var(--overlay-white-06); color: rgba(242,238,231,0.85);
}
.cn-mcp-empty p { margin: 0; font-size: 14px; font-weight: 600; }
.cn-mcp-empty em { display: block; font-style: normal; margin-top: 3px; font-size: 12.5px; color: rgba(255,255,255,0.55); }

.cn-mcp-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.cn-icon-btn {
  width: 32px; height: 32px; border-radius: 10px;
  display: grid; place-items: center;
  background: var(--overlay-white-04); border: 1px solid var(--overlay-white-08);
  color: rgba(242,238,231,0.75); cursor: pointer; transition: all 150ms;
}
.cn-icon-btn:hover { background: var(--overlay-white-08); color: #f2eee7; }
.cn-icon-btn.cn-danger:hover { background: rgba(248,113,113,0.14); color: #f87171; border-color: rgba(248,113,113,0.28); }

.cn-empty { padding: 32px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.cn-empty p { margin: 0; font-size: 14.5px; font-weight: 600; color: #f2eee7; }
.cn-empty span { display: block; font-size: 12.5px; color: rgba(255,255,255,0.5); }
`;
