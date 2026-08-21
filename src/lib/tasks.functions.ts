import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicTask = {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  reward: number;
  verify: string;
};

const playerSchema = z.object({ playerKey: z.string().min(1).max(64) });

/** Active tasks the player has not completed yet. */
export const listTasks = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => playerSchema.parse(i))
  .handler(async ({ data }): Promise<PublicTask[]> => {
    const { db } = await import("@/lib/telegram-bot.server");
    const client = db();
    const [{ data: tasks }, { data: done }] = await Promise.all([
      client
        .from("music_tasks")
        .select("id, title, image_url, link_url, reward, verify")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      client.from("music_task_completions").select("task_id").eq("player_key", data.playerKey),
    ]);
    const doneIds = new Set((done ?? []).map((r: { task_id: string }) => r.task_id));
    return (tasks ?? [])
      .filter((t: { id: string }) => !doneIds.has(t.id))
      .map((t: any) => ({
        id: t.id as string,
        title: t.title as string,
        imageUrl: (t.image_url as string | null) ?? null,
        linkUrl: (t.link_url as string | null) ?? null,
        reward: Number(t.reward ?? 0),
        verify: (t.verify as string) ?? "link",
      }));
  });

/** Marks a task complete. Telegram tasks are verified against real membership. */
export const completeTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        playerKey: z.string().min(1).max(64),
        taskId: z.string().uuid(),
        telegramId: z.number().int().positive().optional(),
      })
      .parse(i),
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; reward?: number; error?: string }> => {
      const { db, tg } = await import("@/lib/telegram-bot.server");
      const client = db();
      const { data: task } = await client
        .from("music_tasks")
        .select("id, reward, verify, chat_id")
        .eq("id", data.taskId)
        .eq("is_active", true)
        .maybeSingle();
      if (!task) return { ok: false, error: "Task not found" };

      if ((task as any).verify === "telegram_member") {
        if (!data.telegramId) return { ok: false, error: "Open the app inside Telegram" };
        const res = await tg("getChatMember", {
          chat_id: -1003503918946,
          user_id: data.telegramId,
        });
        const status = res.result?.status as string | undefined;
        if (!res.ok || !status || ["left", "kicked"].includes(status)) {
          return { ok: false, error: "Join the channel first, then tap Check" };
        }
      }

      const { error } = await client
        .from("music_task_completions")
        .insert({ player_key: data.playerKey, task_id: data.taskId });
      if (error && !error.message.includes("duplicate")) {
        return { ok: false, error: "Could not save your progress" };
      }
      return { ok: true, reward: Number((task as any).reward ?? 0) };
    },
  );

/** Price, in GRAM, to list your own task. */
export const TASK_LISTING_GRAM = 10;
export const TASK_ADMIN_USERNAME = "eIgiza";

/** Records a paid listing request and reveals the admin contact. */
export const createTaskRequest = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        playerKey: z.string().min(1).max(64),
        username: z.string().max(64).optional(),
        txHash: z.string().max(200).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; admin: string }> => {
    const { db } = await import("@/lib/telegram-bot.server");
    await db()
      .from("music_task_requests")
      .insert({
        player_key: data.playerKey,
        tg_username: data.username ?? null,
        amount_gram: TASK_LISTING_GRAM,
        status: "paid",
        tx_hash: data.txHash ?? null,
      });
    return { ok: true, admin: TASK_ADMIN_USERNAME };
  });
