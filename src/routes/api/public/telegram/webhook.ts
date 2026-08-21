import { createFileRoute } from "@tanstack/react-router";
import { MUSIC_BANNER_PATH } from "@/lib/brand";

/** Telegram bot webhook: /start deep link + /101 admin panel. */
export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["MUSIC_TELEGRAM_WEBHOOK_SECRET"];
        if (
          secret &&
          request.headers.get("x-telegram-bot-api-secret-token") !== secret
        ) {
          return new Response("Unauthorized", { status: 401 });
        }

        const {
          tg,
          isAdmin,
          getState,
          setState,
          publishNext,
          adminPanel,
          getStats,
          APP_URL,
          MINI_APP_LINK,
        } = await import("@/lib/telegram-bot.server");


        const update = (await request.json()) as any;

        try {
          const cb = update.callback_query;
          if (cb) {
            const from = cb.from?.id as number | undefined;
            if (!isAdmin(from)) {
              await tg("answerCallbackQuery", {
                callback_query_id: cb.id,
                text: "Admins only",
                show_alert: true,
              });
              return Response.json({ ok: true });
            }

            const action = String(cb.data ?? "");
            let note = "Updated";

            if (action === "ap:on") {
              await setState({ autopost_enabled: true });
              note = "Auto-posting started";
            } else if (action === "ap:off") {
              await setState({ autopost_enabled: false });
              note = "Auto-posting stopped";
            } else if (action === "ap:now") {
              const r = await publishNext();
              note = r.ok ? "Posted to the channel" : `Failed: ${r.error}`;
            } else if (action === "ap:key" || action === "ap:newtask") {
              const { setDraft } = await import("@/lib/task-admin.server");
              await setDraft(from!, { step: action === "ap:key" ? "deepai" : "title" });
              await tg("sendMessage", {
                chat_id: cb.message?.chat?.id,
                text:
                  action === "ap:key"
                    ? "Send the new *DeepAI API key*. Send /cancel to stop."
                    : "New task 1/4\n\nSend the task *name*.",
                parse_mode: "Markdown",
              });
              await tg("answerCallbackQuery", { callback_query_id: cb.id });
              return Response.json({ ok: true });
            }

            const panel = adminPanel(await getState(), await getStats());
            await tg("answerCallbackQuery", { callback_query_id: cb.id, text: note });
            await tg("editMessageText", {
              chat_id: cb.message?.chat?.id,
              message_id: cb.message?.message_id,
              text: panel.text,
              parse_mode: "Markdown",
              reply_markup: panel.reply_markup,
            });
            return Response.json({ ok: true });

          }

          const msg = update.message;
          const text: string = msg?.text ?? "";
          const chatId = msg?.chat?.id;
          if (!chatId) return Response.json({ ok: true });

          /* ---- Admin task builder: /newtask → name → image → link → reward ---- */
          if (isAdmin(msg.from?.id)) {
            const { getDraft, setDraft, clearDraft, saveTask } = await import(
              "@/lib/task-admin.server"
            );

            if (text.startsWith("/newtask")) {
              await setDraft(msg.from.id, { step: "title" });
              await tg("sendMessage", {
                chat_id: chatId,
                text: "New task 1/4\n\nSend the task *name*.",
                parse_mode: "Markdown",
              });
              return Response.json({ ok: true });
            }
            if (text.startsWith("/cancel")) {
              await clearDraft(msg.from.id);
              await tg("sendMessage", { chat_id: chatId, text: "Cancelled." });
              return Response.json({ ok: true });
            }

            const draft = await getDraft(msg.from.id);
            if (draft?.step === "deepai" && text) {
              const { addKey, listKeys } = await import("@/lib/deepai.server");
              try {
                await addKey(text.trim());
                await clearDraft(msg.from.id);
                const keys = await listKeys();
                await tg("sendMessage", {
                  chat_id: chatId,
                  text: `Key added. Active keys: ${keys.filter((k) => k.active).length}/${keys.length}`,
                });
              } catch (err) {
                await tg("sendMessage", { chat_id: chatId, text: `Failed: ${String(err)}` });
              }
              return Response.json({ ok: true });
            }
            if (draft?.step) {

              if (draft.step === "title" && text) {
                await setDraft(msg.from.id, { ...draft, title: text, step: "image" });
                await tg("sendMessage", {
                  chat_id: chatId,
                  text: "2/4 — send the task *image* (photo), or send `skip`.",
                  parse_mode: "Markdown",
                });
                return Response.json({ ok: true });
              }
              if (draft.step === "image") {
                let imageUrl: string | null = null;
                const photo = msg.photo?.[msg.photo.length - 1];
                if (photo) {
                  const f = await tg("getFile", { file_id: photo.file_id });
                  const path = f.result?.file_path;
                  const botToken = process.env["MUSIC_TELEGRAM_BOT_TOKEN"];
                  if (path && botToken) {
                    imageUrl = `https://api.telegram.org/file/bot${botToken}/${path}`;
                  }
                } else if (text && text.startsWith("http")) {
                  imageUrl = text;
                }
                await setDraft(msg.from.id, { ...draft, imageUrl, step: "link" });
                await tg("sendMessage", {
                  chat_id: chatId,
                  text: "3/4 — send the task *link*.",
                  parse_mode: "Markdown",
                });
                return Response.json({ ok: true });
              }
              if (draft.step === "link" && text) {
                await setDraft(msg.from.id, { ...draft, linkUrl: text, step: "reward" });
                await tg("sendMessage", {
                  chat_id: chatId,
                  text: "4/4 — send the *reward* in MUSIC (a number).",
                  parse_mode: "Markdown",
                });
                return Response.json({ ok: true });
              }
              if (draft.step === "reward" && text) {
                const reward = Number(text.replace(/[^0-9.]/g, ""));
                if (!Number.isFinite(reward) || reward <= 0) {
                  await tg("sendMessage", { chat_id: chatId, text: "Send a number, e.g. 2500" });
                  return Response.json({ ok: true });
                }
                const saved = await saveTask({
                  title: draft.title ?? "Task",
                  imageUrl: draft.imageUrl ?? null,
                  linkUrl: draft.linkUrl ?? null,
                  reward,
                });
                await clearDraft(msg.from.id);
                await tg("sendMessage", {
                  chat_id: chatId,
                  text: saved.ok
                    ? `Task published: ${draft.title} (+${reward} MUSIC)`
                    : `Failed: ${saved.error}`,
                });
                return Response.json({ ok: true });
              }
            }
          }

          if (text.startsWith("/101")) {
            if (!isAdmin(msg.from?.id)) {
              await tg("sendMessage", { chat_id: chatId, text: "Admins only." });
              return Response.json({ ok: true });
            }
            const panel = adminPanel(await getState(), await getStats());
            await tg("sendMessage", {
              chat_id: chatId,
              text: panel.text,
              parse_mode: "Markdown",
              reply_markup: panel.reply_markup,
            });
            return Response.json({ ok: true });
          }

          if (text.startsWith("/start")) {
            const result = await tg("sendPhoto", {
              chat_id: chatId,
              photo: `${APP_URL}${MUSIC_BANNER_PATH}`,
              caption: "*Music AI*\n\nMine MUSIC, GRAM and USDT from your own AI studio.",
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Open Music AI", url: MINI_APP_LINK }],
                  [{ text: "Join our community", url: "https://t.me/muscox" }],
                ],
              },
            });
            if (!result.ok) {
              await tg("sendMessage", {
                chat_id: chatId,
                text: "Music AI",
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "Open Music AI", url: MINI_APP_LINK }],
                    [{ text: "Join our community", url: "https://t.me/muscox" }],
                  ],
                },
              });
            }
          }
        } catch (e) {
          console.error("Telegram webhook error", e);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
