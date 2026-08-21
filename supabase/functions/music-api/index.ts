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
const isMusicAdmin = (userId: unknown) => {
  if (typeof userId !== "number") return false;
  const ids = (Deno.env.get("MUSIC_TELEGRAM_ADMIN_IDS") ?? Deno.env.get("TELEGRAM_ADMIN_IDS") ?? "").split(/[\s,]+/).filter(Boolean);
  return ids.includes(String(userId));
};
async function musicAdminPanel() {
  const count = async (table: string, filter?: (q: any) => any) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (filter) q = filter(q);
    const result = await q;
    return result.count ?? 0;
  };
  const [activeTasks, completions, pendingPayments, activeKeys] = await Promise.all([
    count("music_tasks", (q) => q.eq("is_active", true)),
    count("music_task_completions"),
    count("star_payments", (q) => q.eq("status", "pending")),
    count("api_keys", (q) => q.eq("service", "deapi").eq("is_active", true)),
  ]);
  return `*Music AI — Admin Panel*\n\nActive tasks: ${activeTasks}\nTask completions: ${completions}\nPending Stars payments: ${pendingPayments}\nActive deAPI keys: ${activeKeys}`;
}
async function saveAdminDraft(telegramId: number, draft: Record<string, unknown>) {
  await supabase.from("music_task_drafts").upsert({ telegram_id: telegramId, draft, updated_at: new Date().toISOString() }, { onConflict: "telegram_id" });
}
async function getAdminDraft(telegramId: number) {
  const { data } = await supabase.from("music_task_drafts").select("draft").eq("telegram_id", telegramId).maybeSingle();
  return (data?.draft ?? null) as Record<string, unknown> | null;
}
async function clearAdminDraft(telegramId: number) {
  await supabase.from("music_task_drafts").delete().eq("telegram_id", telegramId);
}
async function saveTelegramPhoto(message: any, telegramId: number): Promise<string | null> {
  const photo = Array.isArray(message?.photo) ? message.photo.at(-1) : null;
  if (!photo?.file_id) return null;
  const fileInfo = await musicWebhookTelegram("getFile", { file_id: photo.file_id });
  const filePath = fileInfo?.result?.file_path;
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN_MUSIC");
  if (!filePath || !token) return null;
  const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!fileRes.ok) return null;
  const bytes = new Uint8Array(await fileRes.arrayBuffer());
  const storagePath = `music-tasks/${telegramId}-${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("user-images").upload(storagePath, bytes, { contentType: "image/jpeg", upsert: false });
  if (error) return null;
  return supabase.storage.from("user-images").getPublicUrl(storagePath).data.publicUrl;
}
async function adminHelpText() {
  return "*Admin commands*\\n\\n/addtask\\nSend: `Title | Link | Reward | verify`\\nExample: `Join Music channel | https://t.me/muscox | 100 | link`\\n\\n/addkey\\nSend: `/addkey YOUR_DEAPI_KEY | optional label`\\n\\nYour key is stored in Supabase and never shown back.";
}
async function fetchTimeout(input: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(input, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
}
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
  for (let attempt = 0; attempt < 1; attempt += 1) {
    try {
      const res = await fetchTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash-image", modalities: ["image", "text"], messages: [{ role: "user", content: `${prompt}, clean modern album cover, rich gradient lighting, no text, no watermark` }] }),
      }, 10000);
      if (!res.ok) continue;
      const body = await res.json();
      const url = body?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (typeof url === "string" && url.length > 20) return url;
    } catch { /* retry once */ }
  }
  return null;
}

async function deapiImage(prompt: string, apiKey: string): Promise<string | null> {
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json", "Content-Type": "application/json" };
  const modelsRes = await fetchTimeout("https://api.deapi.ai/api/v2/models?limit=50&filter[inference_types]=txt2img", { headers }, 8000).catch(() => null);
  if (!modelsRes) return null;
  if (!modelsRes.ok) return null;
  const modelsBody = await modelsRes.json();
  const model = modelsBody?.data?.find((x: any) => Array.isArray(x.inference_types) && x.inference_types.includes("txt2img"));
  if (!model?.slug) return null;
  const limits = model.info?.limits ?? {};
  const fit = (value: number, min: number | undefined, max: number | undefined, step: number | undefined) => {
    let v = Math.max(min ?? value, Math.min(max ?? value, value));
    if (step) v = Math.max(min ?? step, Math.floor(v / step) * step);
    return v;
  };
  const width = fit(768, limits.min_width, limits.max_width, limits.resolution_step);
  const height = fit(768, limits.min_height, limits.max_height, limits.resolution_step);
  const steps = fit(Number(model.info?.defaults?.steps ?? 4), limits.min_steps, limits.max_steps, undefined);
  const createRes = await fetchTimeout("https://api.deapi.ai/api/v2/images/generations", {
    method: "POST", headers, body: JSON.stringify({ model: model.slug, prompt: `${prompt}, clean modern album cover, rich gradient lighting, no text, no watermark`, width, height, steps, seed: Math.floor(Math.random() * 1000000000) }),
  }, 12000).catch(() => null);
  if (!createRes) return null;
  if (!createRes.ok) return null;
  const created = await createRes.json();
  const requestId = created?.data?.request_id;
  if (!requestId) return null;
  for (let i = 0; i < 5; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const resultRes = await fetchTimeout(`https://api.deapi.ai/api/v2/result/${requestId}`, { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } }, 1000).catch(() => null);
    if (!resultRes) continue;
    if (!resultRes.ok) continue;
    const result = await resultRes.json();
    const data = result?.data;
    if (data?.status === "failed") return null;
    if (data?.status === "completed" && typeof data.result_url === "string") return data.result_url;
  }
  return null;
}

async function coverImage(prompt: string) {
  const keys: { id: string; api_key: string; calls: number }[] = [];
  const { data } = await supabase.from("music_deepai_keys").select("id,api_key,calls").eq("active", true).order("calls", { ascending: true }).limit(20);
  keys.push(...((data ?? []) as { id: string; api_key: string; calls: number }[]));
  const { data: shared } = await supabase.from("api_keys").select("id,api_key,service").in("service", ["deapi", "deepai"]).eq("is_active", true).limit(20);
  const deapiRows = (shared ?? []).filter((x: any) => x.service === "deapi") as { id: string; api_key: string }[];
  for (const row of deapiRows) {
    const generated = await deapiImage(prompt, row.api_key).catch(() => null);
    if (generated) return aiJson({ url: generated, provider: "deapi" });
  }
  for (const row of (shared ?? []).filter((x: any) => x.service === "deepai") as { id: string; api_key: string }[]) if (!keys.some((x) => x.api_key === row.api_key)) keys.push({ id: row.id, api_key: row.api_key, calls: 0 });
  const deapiEnv = Deno.env.get("DEAPI_API_KEY");
  if (deapiEnv) {
    const generated = await deapiImage(prompt, deapiEnv).catch(() => null);
    if (generated) return aiJson({ url: generated, provider: "deapi" });
  }
  const fallback = Deno.env.get("DEEPAI_API_KEY");
  if (fallback && !keys.some((x) => x.api_key === fallback)) keys.push({ id: "env", api_key: fallback, calls: 0 });
  for (const row of keys) {
    try {
      const form = new FormData(); form.set("text", `album cover artwork for a song about ${prompt}, clean modern album cover, rich gradient lighting, no text, no watermark`);
      const res = await fetchTimeout("https://api.deepai.org/api/text2img", { method: "POST", headers: { "api-key": row.api_key }, body: form }, 8000);
      const body = await res.text();
      if (!res.ok) continue;
      const url = (JSON.parse(body) as { output_url?: string }).output_url;
      if (url) return aiJson({ url });
    } catch { /* try next key */ }
  }
  const generated = await lovableCover(prompt);
  if (generated) return aiJson({ url: generated });
  // Never return a broken/HTML asset to the UI; keep a valid image visible while providers recover.
  return aiJson({ url: "https://music.megsyai.com/bg-poster.jpg", generated: false });
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
      if (body?.callback_query && isMusicAdmin(body.callback_query.from?.id)) {
        await musicWebhookTelegram("answerCallbackQuery", { callback_query_id: body.callback_query.id });
        if (body.callback_query.data === "music_admin_refresh") {
          await musicWebhookTelegram("sendMessage", { chat_id: body.callback_query.message?.chat?.id, text: await musicAdminPanel(), parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "Add task", callback_data: "music_admin_addtask" }, { text: "Add deAPI key", callback_data: "music_admin_addkey" }]] } });
        } else if (body.callback_query.data === "music_admin_addtask") {
          const adminId = body.callback_query.from.id as number;
          await saveAdminDraft(adminId, { type: "task", step: "title" });
          await musicWebhookTelegram("sendMessage", { chat_id: body.callback_query.message?.chat?.id, text: "Step 1/4 — Send the task name." });
        } else if (body.callback_query.data === "music_admin_addkey") {
          const adminId = body.callback_query.from.id as number;
          await saveAdminDraft(adminId, { type: "key" });
          await musicWebhookTelegram("sendMessage", { chat_id: body.callback_query.message?.chat?.id, text: "Send the deAPI key in this format:\\n`/addkey YOUR_DEAPI_KEY | optional label`\\nThe key will be stored securely in Supabase.", parse_mode: "Markdown" });
        }
        return json({ ok: true, type: "admin_callback" });
      }
      const incomingText = typeof body?.message?.text === "string" ? body.message.text.trim() : "";
      const adminId = body?.message?.from?.id;
      if (incomingText === "/101") {
        if (!isMusicAdmin(body.message.from?.id)) return json({ ok: true, type: "ignored" });
        await musicWebhookTelegram("sendMessage", {
          chat_id: body.message.chat.id,
          text: await musicAdminPanel(),
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[{ text: "Add task", callback_data: "music_admin_addtask" }, { text: "Add deAPI key", callback_data: "music_admin_addkey" }], [{ text: "Refresh", callback_data: "music_admin_refresh" }]] },
        });
        return json({ ok: true, type: "admin" });
      }
      if (isMusicAdmin(adminId) && adminId) {
        const draft = await getAdminDraft(adminId);
        if (incomingText === "/addtask") {
          await saveAdminDraft(adminId, { type: "task", step: "title" });
          await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Step 1/4 — Send the task name." });
          return json({ ok: true, type: "admin_addtask_prompt" });
        }
        if (incomingText.startsWith("/addkey")) {
          const raw = incomingText.slice("/addkey".length).trim();
          if (!raw) {
            await saveAdminDraft(adminId, { type: "key" });
            await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Send the deAPI key in this format:\\n`/addkey YOUR_DEAPI_KEY | optional label`\\nThe key will be stored securely in Supabase.", parse_mode: "Markdown" });
            return json({ ok: true, type: "admin_addkey_prompt" });
          }
          const [apiKey, label = ""] = raw.split("|").map((x: string) => x.trim());
          if (!apiKey || apiKey.length < 10) { await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Invalid deAPI key format." }); return json({ ok: true, type: "admin_addkey_invalid" }); }
          const { error } = await supabase.from("api_keys").insert({ service: "deapi", api_key: apiKey, label: label || "Music deAPI", is_active: true });
          if (error) { await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Could not save the deAPI key." }); return json({ ok: false, type: "admin_addkey_error" }); }
          await clearAdminDraft(adminId);
          await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "deAPI key added successfully to Supabase." });
          return json({ ok: true, type: "admin_addkey_saved" });
        }
        if (draft?.type === "task") {
          const step = String(draft.step ?? "title");
          if (step === "title") {
            if (!incomingText || incomingText.startsWith("/")) { await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Please send the task name as text." }); return json({ ok: true, type: "admin_task_title_invalid" }); }
            await saveAdminDraft(adminId, { type: "task", step: "image", title: incomingText.slice(0, 120) });
            await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Step 2/4 — Send the task image, or send /skip." });
            return json({ ok: true, type: "admin_task_title_saved" });
          }
          if (step === "image") {
            let imageUrl: string | null = null;
            if (Array.isArray(body.message?.photo)) imageUrl = await saveTelegramPhoto(body.message, adminId);
            else if (incomingText !== "/skip") { await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Please send an image, or send /skip." }); return json({ ok: true, type: "admin_task_image_invalid" }); }
            if (Array.isArray(body.message?.photo) && !imageUrl) { await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "I could not save that image. Please send it again." }); return json({ ok: true, type: "admin_task_image_error" }); }
            await saveAdminDraft(adminId, { ...draft, step: "link", imageUrl });
            await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Step 3/4 — Send the task link, or send /skip." });
            return json({ ok: true, type: "admin_task_image_saved" });
          }
          if (step === "link") {
            if (!incomingText || incomingText.startsWith("/") && incomingText !== "/skip") { await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Please send the task link, or send /skip." }); return json({ ok: true, type: "admin_task_link_invalid" }); }
            await saveAdminDraft(adminId, { ...draft, step: "reward", linkUrl: incomingText === "/skip" ? null : incomingText });
            await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Step 4/4 — Send the number of points, for example 100." });
            return json({ ok: true, type: "admin_task_link_saved" });
          }
          if (step === "reward") {
            const reward = Number(incomingText);
            if (!Number.isFinite(reward) || reward < 0 || reward > 1000000) { await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Please send a valid points number." }); return json({ ok: true, type: "admin_task_reward_invalid" }); }
            const { error } = await supabase.from("music_tasks").insert({ title: String(draft.title ?? "Music task"), image_url: typeof draft.imageUrl === "string" ? draft.imageUrl : null, link_url: typeof draft.linkUrl === "string" ? draft.linkUrl : null, reward, verify: "link", is_active: true, sort_order: 0 });
            if (error) { await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: "Could not save the task." }); return json({ ok: false, type: "admin_task_error" }); }
            await clearAdminDraft(adminId);
            await musicWebhookTelegram("sendMessage", { chat_id: body.message.chat.id, text: `Task added successfully: *${String(draft.title ?? "Music task")}*\\nPoints: ${reward}`, parse_mode: "Markdown" });
            return json({ ok: true, type: "admin_task_saved" });
          }
        }
      }
      if (incomingText === "/start") {
        const photo = "https://music.megsyai.com/music-start.jpg";
        const caption = "*Music AI*\n\nMine MUSIC, GRAM and USDT from your own AI studio.";
        await musicWebhookTelegram("sendPhoto", {
          chat_id: body.message.chat.id,
          photo,
          caption,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[
              { text: "Open App", url: "http://t.me/Mosuclbot/App" },
              { text: "Community", url: "https://t.me/muscox" },
            ]],
          },
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
const NFT_ITEMS: Record<string, { title: string; desc: string; stars: number }> = {
  swansong: { title: "Let It In", desc: "Music NFT with GRAM and USDT mining", stars: 270 },
  cherry: { title: "Cherry", desc: "Music NFT with a steady GRAM stream", stars: 540 },
  "fight-the-sea": { title: "Fight the Sea", desc: "Music NFT with GRAM and USDT mining", stars: 1080 },
  "under-the-stairs": { title: "California Lullabye", desc: "Music NFT with daily mining", stars: 1620 },
  "border-blaster": { title: "Shot Down", desc: "Rare Music NFT with daily mining", stars: 2160 },
  "big-disco-ball": { title: "Big Disco Ball", desc: "Rare Music NFT with USDT mining", stars: 2880 },
  "grey-snow": { title: "Cherubs", desc: "Rare Music NFT with stablecoin output", stars: 3780 },
  "invisible-light": { title: "Invisible Light", desc: "Rare Music NFT with GRAM and USDT mining", stars: 4860 },
  "private-hurricane": { title: "Faded War", desc: "Epic Music NFT with daily mining", stars: 6120 },
  "stars-collide": { title: "Infinite Horizon", desc: "Epic Music NFT with USDT mining", stars: 7560 },
  "the-spirit-world": { title: "The Spirit World", desc: "Epic Music NFT with GRAM and USDT mining", stars: 9360 },
  "golden-sunrise": { title: "Golden Sunrise", desc: "Epic Music NFT with daily mining", stars: 11520 },
  overthrown: { title: "Memory Replaced", desc: "Legendary Music NFT with daily mining", stars: 14040 },
  gemini: { title: "Gemini", desc: "Legendary Music NFT with GRAM and USDT mining", stars: 17100 },
  "2020": { title: "Branches", desc: "The rarest Music NFT in the vault", stars: 20700 },
};
async function invoice(data: any) {
  const token = Deno.env.get("Sooo");
  if (!token) return json({ error: "stars secret is not configured" }, 503);
  const planItems: Record<string, { title: string; desc: string; stars: number }> = {
    starter: { title: "Starter Membership", desc: "3 AI songs every day and creator perks", stars: 250 },
    pro: { title: "Pro Membership", desc: "10 AI songs every day and creator perks", stars: 650 },
    elite: { title: "Elite Membership", desc: "30 AI songs every day and creator perks", stars: 1500 },
  };
  const requestedItem = data.itemId === "plan" ? data.planId : data.itemId === "nft" ? data.nftId : data.itemId;
  const item = data.itemId === "plan" ? planItems[requestedItem] : data.itemId === "nft" ? NFT_ITEMS[requestedItem] : ITEMS[requestedItem];
  if (!item) return json({ error: data.itemId === "nft" ? "Unknown NFT" : "Unknown item" }, 400);
  const productKey = data.itemId === "plan" ? `plan:${requestedItem}` : data.itemId === "nft" ? `nft:${requestedItem}` : `music:${data.itemId}`;
  const payload = `music-ai:${productKey}:${crypto.randomUUID()}`;
  const { error: paymentError } = await supabase.from("star_payments").insert({
    profile_id: null,
    telegram_id: typeof data.telegramId === "number" ? data.telegramId : null,
    product: productKey,
    stars: item.stars,
    payload,
    status: "pending",
    meta: { source: "music", itemId: data.itemId, planId: data.planId ?? null, nftId: data.nftId ?? null },
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
