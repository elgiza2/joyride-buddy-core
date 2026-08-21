/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { getPost, PLAN_LENGTH } from "@/lib/content-plan";
import { BRAND_IMAGE_STYLE } from "@/lib/brand";
import { lovableImage, dataUrlToBytes } from "@/lib/lovable-image.server";

export const APP_URL =
  process.env["MUSIC_APP_URL"] ??
  "https://project--cabbd000-2e02-47bd-9490-cb3561f12ac2-dev.lovable.app";

/** The link used by every "open the app" button (channel posts + bot). */
export const MINI_APP_LINK = "http://t.me/Mosuclbot/App";

/** Numeric channel id avoids username-resolution failures in sendPhoto/sendMessage. */
export const MUSIC_CHANNEL_ID = -1003503918946;

function token() {
  const t = process.env["MUSIC_TELEGRAM_BOT_TOKEN"];
  if (!t) throw new Error("MUSIC_TELEGRAM_BOT_TOKEN is not configured");
  return t;
}

export function db() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function tg(method: string, body: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    ok: boolean;
    result?: any;
    description?: string;
  };
  if (!data.ok) {
    console.error(`Telegram ${method} failed [${res.status}]: ${data.description}`);
  }
  return data;
}

/** Same as `tg`, but sends multipart form data (file uploads). */
export async function tgForm(method: string, form: FormData) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { ok: boolean; result?: any; description?: string };
  if (!data.ok) {
    console.error(`Telegram ${method} failed [${res.status}]: ${data.description}`);
  }
  return data;
}

export function isAdmin(userId: number | undefined) {
  if (!userId) return false;
  const ids = (process.env["MUSIC_TELEGRAM_ADMIN_IDS"] ?? "").split(/[,\s]+/).filter(Boolean);
  return ids.includes(String(userId));
}

export type BotState = {
  autopost_enabled: boolean;
  day_index: number;
  last_post_at: string | null;
};

export async function getState(): Promise<BotState> {
  const { data } = await db()
    .from("music_bot_state")
    .select("autopost_enabled, day_index, last_post_at")
    .eq("id", "default")
    .maybeSingle();
  return (
    (data as BotState | null) ?? {
      autopost_enabled: false,
      day_index: 0,
      last_post_at: null,
    }
  );
}

export async function setState(patch: Partial<BotState>) {
  await db()
    .from("music_bot_state")
    .upsert({ id: "default", ...patch, updated_at: new Date().toISOString() });
}

async function cover(prompt: string): Promise<string | null> {
  const key = process.env["DEEPAI_API_KEY"];
  if (key) {
    try {
      const form = new FormData();
      form.set("text", `${prompt}, ${BRAND_IMAGE_STYLE}`);
      const res = await fetch("https://api.deepai.org/api/text2img", {
        method: "POST",
        headers: { "api-key": key },
        body: form,
      });
      if (res.ok) {
        const data = (await res.json()) as { output_url?: string };
        if (data.output_url) return data.output_url;
      }
    } catch (e) {
      console.error("DeepAI cover failed", e);
    }
  }
  // No usable DeepAI key: fall back to the Lovable AI Gateway.
  return lovableImage(`${prompt}, ${BRAND_IMAGE_STYLE}`);
}

/** Publishes the next post of the 90-day plan to the channel. */
export async function publishNext() {
  const channel = MUSIC_CHANNEL_ID;

  const state = await getState();
  const post = getPost(state.day_index);
  const image = await cover(post.imagePrompt);

  const reply_markup = {
    inline_keyboard: [[{ text: post.cta, url: MINI_APP_LINK }]],
  };

  const bytes = image?.startsWith("data:") ? dataUrlToBytes(image) : null;

  let sent: { ok: boolean; result?: any; description?: string };
  if (bytes) {
    // Generated images come back inline, so upload them as a file.
    const form = new FormData();
    form.set("chat_id", String(channel));
    form.set("caption", post.caption);
    form.set("parse_mode", "Markdown");
    form.set("reply_markup", JSON.stringify(reply_markup));
    form.set(
      "photo",
      new Blob([bytes.bytes.slice().buffer as ArrayBuffer], { type: bytes.type }),
      "cover.png",
    );
    sent = await tgForm("sendPhoto", form);
  } else if (image) {
    sent = await tg("sendPhoto", {
      chat_id: channel,
      photo: image,
      caption: post.caption,
      parse_mode: "Markdown",
      reply_markup,
    });
  } else {
    sent = await tg("sendMessage", {
      chat_id: channel,
      text: post.caption,
      parse_mode: "Markdown",
      reply_markup,
    });
  }

  if (!sent.ok) return { ok: false, error: sent.description, post };

  await db()
    .from("music_channel_posts")
    .insert({
      day_index: state.day_index,
      title: post.title,
      message_id: sent.result?.message_id ?? null,
      image_url: bytes ? (sent.result?.photo?.at(-1)?.file_id ?? null) : image,
    });

  await setState({
    day_index: (state.day_index + 1) % PLAN_LENGTH,
    last_post_at: new Date().toISOString(),
  });

  return { ok: true, post };
}

export type AdminStats = {
  players: number;
  tasksDone: number;
  activeTasks: number;
  paidRequests: number;
  keysActive: number;
  keysTotal: number;
};

/** Live counters for the admin panel. */
export async function getStats(): Promise<AdminStats> {
  const c = db();
  const count = async (table: string, filter?: (q: any) => any) => {
    let q = c.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count: n } = await q;
    return n ?? 0;
  };
  const [tasksDone, activeTasks, paidRequests, keysActive, keysTotal] = await Promise.all([
    count("music_task_completions"),
    count("music_tasks", (q) => q.eq("is_active", true)),
    count("music_task_requests", (q) => q.eq("status", "paid")),
    count("music_deepai_keys", (q) => q.eq("active", true)),
    count("music_deepai_keys"),
  ]);
  const { data: players } = await c.from("music_task_completions").select("player_key").limit(5000);
  return {
    players: new Set((players ?? []).map((p: { player_key: string }) => p.player_key)).size,
    tasksDone,
    activeTasks,
    paidRequests,
    keysActive,
    keysTotal,
  };
}

export function adminPanel(state: BotState, stats?: AdminStats) {
  const next = getPost(state.day_index);
  const s = stats
    ? `\n\n*Stats*\n` +
      `Players: ${stats.players}\n` +
      `Tasks completed: ${stats.tasksDone}\n` +
      `Active tasks: ${stats.activeTasks}\n` +
      `Paid task requests: ${stats.paidRequests}\n` +
      `DeepAI keys: ${stats.keysActive} active / ${stats.keysTotal}`
    : "";
  return {
    text:
      `*Music AI — admin panel*\n\n` +
      `Auto-posting: ${state.autopost_enabled ? "ON (every 24h)" : "OFF"}\n` +
      `Plan progress: day ${state.day_index + 1} / ${PLAN_LENGTH}\n` +
      `Last post: ${state.last_post_at ? new Date(state.last_post_at).toUTCString() : "never"}\n` +
      `Next up: ${next.title} — ${next.theme}` +
      s,
    reply_markup: {
      inline_keyboard: [
        [
          state.autopost_enabled
            ? { text: "Stop auto-posting", callback_data: "ap:off" }
            : { text: "Start auto-posting (24h)", callback_data: "ap:on" },
        ],
        [{ text: "Post now", callback_data: "ap:now" }],
        [{ text: "Add DeepAI key", callback_data: "ap:key" }],
        [{ text: "New task", callback_data: "ap:newtask" }],
        [{ text: "Refresh stats", callback_data: "ap:status" }],
      ],
    },
  };
}
