import { apiPost } from "@/lib/api";

export type PublicTask = {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  reward: number;
  verify: string;
};

/** Price, in GRAM, to list your own task. */
export const TASK_LISTING_GRAM = 10;
export const TASK_ADMIN_USERNAME = "eIgiza";

const PATH = "/api/public/tasks";

/** Active tasks the player has not completed yet. */
export async function listTasks(input: { data: { playerKey: string } }): Promise<PublicTask[]> {
  const res = await apiPost<{ tasks: PublicTask[] }>(PATH, { action: "list", ...input.data });
  return res.tasks ?? [];
}

/** Marks a task complete. Telegram tasks are verified against real membership. */
export async function completeTask(input: {
  data: { playerKey: string; taskId: string; telegramId?: number | undefined };
}): Promise<{ ok: boolean; reward?: number; error?: string }> {
  return apiPost<{ ok: boolean; reward?: number; error?: string }>(PATH, {
    action: "complete",
    ...input.data,
  });
}

/** Records a paid listing request and reveals the admin contact. */
export async function createTaskRequest(input: {
  data: { playerKey: string; username?: string | undefined; txHash?: string | undefined };
}): Promise<{ ok: boolean; admin: string }> {
  return apiPost<{ ok: boolean; admin: string }>(PATH, { action: "request", ...input.data });
}
