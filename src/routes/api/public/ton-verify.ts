import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { corsJson, corsPreflight } from "@/lib/cors";

const schema = z.object({
  memo: z.string().min(4).max(40),
  minTon: z.number().positive().max(1000),
});

type Tx = {
  in_msg?: {
    value?: string;
    message_content?: { decoded?: { comment?: string } };
  };
  hash?: string;
};

/** Confirms an incoming TON transfer that carries `memo` on the project wallet. */
export const Route = createFileRoute("/api/public/ton-verify")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return corsJson({ paid: false, error: "Invalid request" }, 400);
        const data = parsed.data;

        const wallet = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj";
        const url = `https://toncenter.com/api/v3/transactions?account=${wallet}&limit=40&sort=desc`;
        const key = process.env["TONCENTER_API_KEY"];

        const res = await fetch(url, { headers: key ? { "X-API-Key": key } : {} });
        if (!res.ok) return corsJson({ paid: false, error: `TON explorer error ${res.status}` });

        const body = (await res.json()) as { transactions?: Tx[] };
        const match = (body.transactions ?? []).find((t) => {
          const comment = t.in_msg?.message_content?.decoded?.comment;
          if (comment !== data.memo) return false;
          const nano = Number(t.in_msg?.value ?? 0);
          return nano >= data.minTon * 1e9 * 0.98;
        });

        return corsJson({ paid: Boolean(match), hash: match?.hash ?? null });
      },
    },
  },
});
