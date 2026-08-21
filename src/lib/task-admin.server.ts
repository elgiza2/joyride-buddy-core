import { db } from "@/lib/telegram-bot.server";

export type TaskDraft = {
  step?: "title" | "image" | "link" | "reward" | "deepai";
  title?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
};

export async function getDraft(telegramId: number): Promise<TaskDraft | null> {
  const { data } = await db()
    .from("music_task_drafts")
    .select("draft")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  return ((data as { draft?: TaskDraft } | null)?.draft as TaskDraft) ?? null;
}

export async function setDraft(telegramId: number, draft: TaskDraft) {
  await db()
    .from("music_task_drafts")
    .upsert(
      { telegram_id: telegramId, draft, updated_at: new Date().toISOString() },
      { onConflict: "telegram_id" },
    );
}

export async function clearDraft(telegramId: number) {
  await db().from("music_task_drafts").delete().eq("telegram_id", telegramId);
}

export async function saveTask(task: {
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  reward: number;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db().from("music_tasks").insert({
    title: task.title,
    image_url: task.imageUrl,
    link_url: task.linkUrl,
    reward: task.reward,
    verify: "link",
    is_active: true,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
