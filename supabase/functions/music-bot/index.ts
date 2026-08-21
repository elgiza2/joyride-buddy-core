import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const token = () => Deno.env.get("stars");
const telegram = async (method: string, payload: Record<string, unknown>) => {
  const value = token();
  if (!value) throw new Error("stars secret is not configured");
  const response = await fetch(`https://api.telegram.org/bot${value}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await response.json();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    const body = await req.json().catch(() => ({}));

    if (body?.task === "setup") {
      const me = await telegram("getMe", {});
      const hook = await telegram("setWebhook", {
        url: `${supabaseUrl}/functions/v1/music-bot`,
        allowed_updates: ["message", "pre_checkout_query", "callback_query"],
      });
      const info = await telegram("getWebhookInfo", {});
      return json({ me: me?.result, hook, info: info?.result });
    }

    const update = body ?? {};
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      const result = await telegram("answerPreCheckoutQuery", {
        pre_checkout_query_id: query.id,
        ok: true,
      });
      return json({ ok: Boolean(result?.ok), type: "pre_checkout" });
    }

    const message = update.message;
    if (message?.successful_payment) {
      const payment = message.successful_payment;
      await telegram("sendMessage", {
        chat_id: message.chat.id,
        text: `Payment received successfully. Thank you!\nOrder: ${payment.invoice_payload ?? "music-ai"}`,
      });
      return json({ ok: true, type: "successful_payment" });
    }

    if (message?.text === "/start") {
      await telegram("sendMessage", {
        chat_id: message.chat.id,
        text: "Welcome to Music AI. You can complete Stars purchases from the app.",
      });
      return json({ ok: true, type: "start" });
    }

    return json({ ok: true, type: "ignored" });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error instanceof Error ? error.message : "Internal error" }, 500);
  }
});
