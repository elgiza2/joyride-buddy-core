import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

/**
 * Checks the project TON wallet for an incoming transfer carrying `memo`.
 * Returns { paid: true } once the amount is at least `minTon`.
 */
export const verifyTonPayment = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const wallet = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj";
    const url = `https://toncenter.com/api/v3/transactions?account=${wallet}&limit=40&sort=desc`;
    const key = process.env["TONCENTER_API_KEY"];

    const res = await fetch(url, {
      headers: key ? { "X-API-Key": key } : {},
    });
    if (!res.ok) {
      return { paid: false as const, error: `TON explorer error ${res.status}` };
    }

    const body = (await res.json()) as { transactions?: Tx[] };
    const match = (body.transactions ?? []).find((t) => {
      const comment = t.in_msg?.message_content?.decoded?.comment;
      if (comment !== data.memo) return false;
      const nano = Number(t.in_msg?.value ?? 0);
      return nano >= data.minTon * 1e9 * 0.98;
    });

    return { paid: Boolean(match) as boolean, hash: match?.hash ?? null };
  });
