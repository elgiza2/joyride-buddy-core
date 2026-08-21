/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { corsJson, corsPreflight } from "../../src/lib/cors";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list"), playerKey: z.string().min(1).max(64) }),
  z.object({
    action: z.literal("complete"),
    playerKey: z.string().min(1).max(64),
    taskId: z.string().uuid(),
    telegramId: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal("request"),
    playerKey: z.string().min(1).max(64),
    username: z.string().max(64).optional(),
    txHash: z.string().max(200).optional(),
  }),
]);

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return send(res, corsPreflight());
  if (req.method !== "POST") return send(res, corsJson({ error: "Method not allowed" }, 405));
  const parsed = schema.safeParse(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
  if (!parsed.success) return send(res, corsJson({ error: "Invalid request" }, 400));
  const data = parsed.data;
  const { db, tg } = await import("../../src/lib/telegram-bot.server");
  const client = db();
  if (data.action === "list") {
    const [{ data: tasks }, { data: done }] = await Promise.all([
      client
        .from("music_tasks")
        .select("id,title,image_url,link_url,reward,verify")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      client.from("music_task_completions").select("task_id").eq("player_key", data.playerKey),
    ]);
    const doneIds = new Set((done ?? []).map((r: any) => r.task_id));
    return send(
      res,
      corsJson({
        tasks: (tasks ?? [])
          .filter((t: any) => !doneIds.has(t.id))
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            imageUrl: t.image_url ?? null,
            linkUrl: t.link_url ?? null,
            reward: Number(t.reward ?? 0),
            verify: t.verify ?? "link",
          })),
      }),
    );
  }
  if (data.action === "complete") {
    const { data: task } = await client
      .from("music_tasks")
      .select("id,reward,verify")
      .eq("id", data.taskId)
      .eq("is_active", true)
      .maybeSingle();
    if (!task) return send(res, corsJson({ ok: false, error: "Task not found" }));
    if (task.verify === "telegram_member") {
      if (!data.telegramId)
        return send(res, corsJson({ ok: false, error: "Open the app inside Telegram" }));
      const result = await tg("getChatMember", {
        chat_id: -1003503918946,
        user_id: data.telegramId,
      });
      const status = result.result?.status;
      if (!result.ok || !status || ["left", "kicked"].includes(status))
        return send(res, corsJson({ ok: false, error: "Join the channel first, then tap Check" }));
    }
    const { error } = await client
      .from("music_task_completions")
      .insert({ player_key: data.playerKey, task_id: data.taskId });
    if (error && !error.message.includes("duplicate"))
      return send(res, corsJson({ ok: false, error: "Could not save your progress" }));
    return send(res, corsJson({ ok: true, reward: Number(task.reward ?? 0) }));
  }
  await client.from("music_task_requests").insert({
    player_key: data.playerKey,
    tg_username: data.username ?? null,
    amount_gram: 10,
    status: "paid",
    tx_hash: data.txHash ?? null,
  });
  return send(res, corsJson({ ok: true, admin: "eIgiza" }));
}
function send(res: any, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  response.arrayBuffer().then((b) => res.end(Buffer.from(b)));
}
