import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const musicWebhookTelegram = async (method: string, payload: Record<string, unknown>) => {
  const value = Deno.env.get("TELEGRAM_BOT_TOKEN_MUSIC");
  if (!value) throw new Error("TELEGRAM_BOT_TOKEN_MUSIC is not configured");
  const response = await fetch(`https://api.telegram.org/bot${value}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await response.json();
};

const aiJson = (data: unknown, status = 200) => json(data, status);
const COMPOSE_SYSTEM = `You are a songwriter and composer inside the Music AI app. Return JSON only with title, genre, mood, bpm, key, chords, melody, lyrics, hook, description. Write real lyrics in the same language as the brief. Use 4-8 chords, 8-32 MIDI notes between 55 and 88 (0 is rest), bpm 70-150, and 8-14 lyric lines.`;

async function composeTrack(prompt: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return aiJson({ error: "LOVABLE_API_KEY is not configured in Supabase" }, 503);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-pro-preview", messages: [{ role: "system", content: COMPOSE_SYSTEM }, { role: "user", content: prompt }] }),
  });
  if (!res.ok) return aiJson({ error: await res.text() }, res.status);
  const raw = String((await res.json())?.choices?.[0]?.message?.content ?? "");
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return aiJson({ error: "Could not compose the song" }, 502);
  try {
    const c = JSON.parse(match[0]);
    const lyrics = (Array.isArray(c.lyrics) ? c.lyrics : []).slice(0, 16).map((x: unknown) => String(x).slice(0, 120)).filter(Boolean);
    return aiJson({ title: String(c.title ?? "Untitled").slice(0, 60), genre: String(c.genre ?? "Lo-Fi").slice(0, 40), mood: String(c.mood ?? "calm").slice(0, 40), bpm: Math.min(180, Math.max(60, Number(c.bpm) || 90)), key: String(c.key ?? "A minor").slice(0, 20), chords: (Array.isArray(c.chords) ? c.chords : ["Am", "F", "C", "G"]).slice(0, 8).map((x: unknown) => String(x).slice(0, 8)), melody: (Array.isArray(c.melody) ? c.melody : [69, 72, 76, 74]).slice(0, 32).map((x: unknown) => { const n = Number(x) || 0; return n === 0 ? 0 : Math.min(96, Math.max(48, Math.round(n))); }), lyrics, hook: String(c.hook ?? lyrics[0] ?? "").slice(0, 120), description: String(c.description ?? "").slice(0, 160) });
  } catch { return aiJson({ error: "Could not read the song" }, 502); }
}

async function lovableCover(prompt: string): Promise<string | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash-image", modalities: ["image", "text"], messages: [{ role: "user", content: `${prompt}, clean modern album cover, rich gradient lighting, no text, no watermark` }] }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
  } catch { return null; }
}

async function coverImage(prompt: string) {
  const keys: { id: string; api_key: string; calls: number }[] = [];
  const { data } = await supabase.from("music_deepai_keys").select("id,api_key,calls").eq("active", true).order("calls", { ascending: true }).limit(20);
  keys.push(...((data ?? []) as { id: string; api_key: string; calls: number }[]));
  const { data: shared } = await supabase.from("api_keys").select("id,api_key").in("service", ["deapi", "deepai"]).eq("is_active", true).limit(20);
  for (const row of (shared ?? []) as { id: string; api_key: string }[]) if (!keys.some((x) => x.api_key === row.api_key)) keys.push({ id: row.id, api_key: row.api_key, calls: 0 });
  const fallback = Deno.env.get("DEAPI_API_KEY") ?? Deno.env.get("DEEPAI_API_KEY");
  if (fallback && !keys.some((x) => x.api_key === fallback)) keys.push({ id: "env", api_key: fallback, calls: 0 });
  for (const row of keys) {
    try {
      const form = new FormData(); form.set("text", `album cover artwork for a song about ${prompt}, clean modern album cover, rich gradient lighting, no text, no watermark`);
      const res = await fetch("https://api.deepai.org/api/text2img", { method: "POST", headers: { "api-key": row.api_key }, body: form });
      const body = await res.text();
      if (!res.ok) continue;
      const url = (JSON.parse(body) as { output_url?: string }).output_url;
      if (url) return aiJson({ url });
    } catch { /* try next key */ }
  }
  const generated = await lovableCover(prompt);
  if (generated) return aiJson({ url: generated });
  return aiJson({ error: keys.length ? "All DeAPI/DeepAI keys failed and image fallback is unavailable" : "No DeAPI/DeepAI key configured in Supabase" }, 502);
}

async function vocals(data: any) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const text = (Array.isArray(data.lyrics) ? data.lyrics : []).join("\\n").slice(0, 1800);
  if (!text.trim()) return aiJson({ error: "No lyrics" }, 400);
  if (!key) return aiJson({ error: "LOVABLE_API_KEY is not configured in Supabase" }, 503);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "openai/gpt-4o-mini-tts", input: text, voice: "alloy", response_format: "mp3", instructions: `Sing these lyrics musically with a ${(data.mood ?? "warm")} vocal performance.` }) });
  if (!res.ok || !res.body) return aiJson({ error: await res.text().catch(() => "Vocal generation failed") }, res.status || 502);
  return new Response(res.body, { headers: { ...cors, "content-type": "audio/mpeg", "cache-control": "no-store" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const path = new URL(req.url).pathname.split("/").pop() ?? "";
  try {
    if (path === "prices" && req.method === "GET") {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network,tether&vs_currencies=usd&include_24hr_change=true");
      if (!r.ok) return json({ prices: null, error: `Market data unavailable (${r.status})` });
      const b = await r.json();
      const ton = { usd: Number(b["the-open-network"]?.usd ?? 0), change24h: Number(b["the-open-network"]?.usd_24h_change ?? 0) };
      const usdt = { usd: Number(b.tether?.usd ?? 0), change24h: Number(b.tether?.usd_24h_change ?? 0) };
      return json({ prices: { gram: ton, ton, usdt }, error: null });
    }
    if (path === "compose" && req.method === "POST") {
      const { prompt } = await req.json().catch(() => ({}));
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 400) return aiJson({ error: "Invalid description" }, 400);
      return await composeTrack(prompt.trim());
    }
    if (path === "cover" && req.method === "POST") {
      const { prompt } = await req.json().catch(() => ({}));
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 400) return aiJson({ error: "Invalid description" }, 400);
      return await coverImage(prompt.trim());
    }
    if (path === "vocals" && req.method === "POST") return await vocals(await req.json().catch(() => ({})));
    if (path === "tonconnect-manifest" && req.method === "GET") {
      const site = Deno.env.get("MUSIC_APP_URL") ?? "https://joyride-buddy-core5555-elgiza2s-projects.vercel.app";
      return json({ url: site, name: "MUSIC", iconUrl: `${site}/assets/music-wallet-icon.png` });
    }
    const body = await req.json().catch(() => ({}));
    if (path === "music-api" && req.method === "POST") {
      if (body?.task === "setup") {
        const me = await musicWebhookTelegram("getMe", {});
        const hook = await musicWebhookTelegram("setWebhook", {
          url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/music-api`,
          allowed_updates: ["message", "pre_checkout_query", "callback_query"],
        });
        const info = await musicWebhookTelegram("getWebhookInfo", {});
        return json({ me: me?.result, hook, info: info?.result });
      }
      const starsToken = Deno.env.get("Sooo") ?? Deno.env.get("TELEGRAM_STARS_BOT_TOKEN");
      const starsTelegram = async (method: string, payload: Record<string, unknown>) => {
        if (!starsToken) throw new Error("Stars bot secret is not configured in Supabase");
        const response = await fetch(`https://api.telegram.org/bot${starsToken}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        return await response.json();
      };
      if (body?.task === "stars_setup") {
        const me = await starsTelegram("getMe", {});
        const hook = await starsTelegram("setWebhook", { url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/music-api`, allowed_updates: ["message", "pre_checkout_query"] });
        const info = await starsTelegram("getWebhookInfo", {});
        return json({ me: me?.result, hook, info: info?.result });
      }
      if (body?.pre_checkout_query) {
        const result = await starsTelegram("answerPreCheckoutQuery", { pre_checkout_query_id: body.pre_checkout_query.id, ok: true });
        return json({ ok: Boolean(result?.ok), type: "pre_checkout" });
      }
      if (body?.message?.successful_payment) {
        const payment = body.message.successful_payment;
        const payload = String(payment.invoice_payload ?? "");
        await supabase.from("star_payments").update({ status: "paid", meta: { source: "music", telegram_payment_charge_id: payment.telegram_payment_charge_id ?? null } }).eq("payload", payload);
        await starsTelegram("sendMessage", { chat_id: body.message.chat.id, text: `Payment received successfully.\\nOrder: ${payload || "music-ai"}` });
        return json({ ok: true, type: "successful_payment" });
      }
      if (body?.message?.text === "/start") {
        await musicWebhookTelegram("sendMessage", {
          chat_id: body.message.chat.id,
          text: "Welcome to Music AI. You can complete Stars purchases from the app.",
        });
        return json({ ok: true, type: "start" });
      }
      return json({ ok: true, type: "ignored" });
    }
    if (path === "tasks" && req.method === "POST") return await tasks(body);
    if (path === "telegram-invoice" && req.method === "POST") return await invoice(body);
    if (path === "ton-verify" && req.method === "POST") return await tonVerify(body);
    return json({ error: "Not found" }, 404);
  } catch (e) { console.error(e); return json({ error: e instanceof Error ? e.message : "Internal error" }, 500); }
});

async function tasks(data: any) {
  if (typeof data.playerKey !== "string" || data.playerKey.length < 1 || data.playerKey.length > 64) return json({ error: "Invalid request" }, 400);
  if (data.action === "list") {
    const [{ data: rows }, { data: done }] = await Promise.all([
      supabase.from("music_tasks").select("id,title,image_url,link_url,reward,verify").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("music_task_completions").select("task_id").eq("player_key", data.playerKey),
    ]);
    const completed = new Set((done ?? []).map((x: any) => x.task_id));
    return json({ tasks: (rows ?? []).filter((x: any) => !completed.has(x.id)).map((x: any) => ({ id: x.id, title: x.title, imageUrl: x.image_url ?? null, linkUrl: x.link_url ?? null, reward: Number(x.reward ?? 0), verify: x.verify ?? "link" })) });
  }
  if (data.action === "complete") {
    if (typeof data.taskId !== "string") return json({ ok: false, error: "Invalid task" }, 400);
    const { data: task } = await supabase.from("music_tasks").select("id,reward,verify").eq("id", data.taskId).eq("is_active", true).maybeSingle();
    if (!task) return json({ ok: false, error: "Task not found" });
    if (task.verify === "telegram_member") {
      if (!data.telegramId) return json({ ok: false, error: "Open the app inside Telegram" });
      const token = Deno.env.get("TELEGRAM_BOT_TOKEN_MUSIC");
      if (!token) return json({ ok: false, error: "Telegram bot secret is not configured" }, 503);
      const r = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: -1003503918946, user_id: data.telegramId }) });
      const b = await r.json(); const status = b.result?.status;
      if (!b.ok || !status || ["left", "kicked"].includes(status)) return json({ ok: false, error: "Join the channel first, then tap Check" });
    }
    const { error } = await supabase.from("music_task_completions").insert({ player_key: data.playerKey, task_id: data.taskId });
    if (error && !error.message.includes("duplicate")) return json({ ok: false, error: "Could not save your progress" });
    return json({ ok: true, reward: Number(task.reward ?? 0) });
  }
  if (data.action === "request") {
    await supabase.from("music_task_requests").insert({ player_key: data.playerKey, tg_username: data.username ?? null, amount_gram: 10, status: "paid", tx_hash: data.txHash ?? null });
    return json({ ok: true, admin: "eIgiza" });
  }
  return json({ error: "Invalid action" }, 400);
}

const ITEMS: Record<string, { title: string; desc: string; stars: number }> = { premium: { title: "Premium Pass — 30 days", desc: "2x mining, 24h storage, 5 AI tracks/day", stars: 250 }, booster: { title: "3x Booster — 8 hours", desc: "Triple your mining rate for 8 hours", stars: 75 }, tracks10: { title: "10 AI track pack", desc: "Extra AI generations", stars: 100 }, coins: { title: "250,000 MUSIC bag", desc: "Instant coins for upgrades", stars: 400 }, "gram-rig": { title: "GRAM Extractor — 5 levels", desc: "Instant 5 levels of GRAM mining", stars: 900 }, "usdt-rig": { title: "USDT Rig — 5 levels", desc: "Instant 5 levels of USDT mining", stars: 1400 }, mega: { title: "Seasonal Mega Bundle", desc: "Premium + week booster + 1,000,000 MUSIC", stars: 2500 } };
async function invoice(data: any) {
  const token = Deno.env.get("Sooo");
  if (!token) return json({ error: "stars secret is not configured" }, 503);
  const planItems: Record<string, { title: string; desc: string; stars: number }> = {
    starter: { title: "Starter Membership", desc: "3 AI songs every day and creator perks", stars: 250 },
    pro: { title: "Pro Membership", desc: "10 AI songs every day and creator perks", stars: 650 },
    elite: { title: "Elite Membership", desc: "30 AI songs every day and creator perks", stars: 1500 },
  };
  const requestedItem = data.itemId === "plan" ? data.planId : data.itemId;
  const item = data.itemId === "plan" ? planItems[requestedItem] : ITEMS[requestedItem];
  if (!item) return json({ error: "Unknown item" }, 400);
  const productKey = data.itemId === "plan" ? `plan:${requestedItem}` : `music:${data.itemId}`;
  const payload = `music-ai:${productKey}:${crypto.randomUUID()}`;
  const { error: paymentError } = await supabase.from("star_payments").insert({
    profile_id: null,
    telegram_id: typeof data.telegramId === "number" ? data.telegramId : null,
    product: productKey,
    stars: item.stars,
    payload,
    status: "pending",
    meta: { source: "music", itemId: data.itemId, planId: data.planId ?? null },
  });
  if (paymentError) return json({ error: paymentError.message }, 500);
  const r = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: item.title, description: item.desc, payload, currency: "XTR", prices: [{ label: item.title, amount: item.stars }] }),
  });
  const b = await r.json();
  return b.ok && b.result ? json({ link: b.result, payload }) : json({ error: b.description ?? "Telegram error" }, 502);
}
async function tonVerify(data: any) { if (typeof data.memo !== "string" || typeof data.minTon !== "number") return json({ paid: false, error: "Invalid request" }, 400); const wallet = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj"; const key = Deno.env.get("TONCENTER_API_KEY"); const r = await fetch(`https://toncenter.com/api/v3/transactions?account=${wallet}&limit=40&sort=desc`, { headers: key ? { "X-API-Key": key } : {} }); if (!r.ok) return json({ paid: false, error: `TON explorer error ${r.status}` }); const b = await r.json(); const match = (b.transactions ?? []).find((t: any) => t.in_msg?.message_content?.decoded?.comment === data.memo && Number(t.in_msg?.value ?? 0) >= data.minTon * 1e9 * 0.98); return json({ paid: Boolean(match), hash: match?.hash ?? null }); }
