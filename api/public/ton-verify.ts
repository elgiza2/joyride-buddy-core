/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { corsJson, corsPreflight } from "../../src/lib/cors";
const schema = z.object({
  memo: z.string().min(4).max(40),
  minTon: z.number().positive().max(1000),
});
export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return send(res, corsPreflight());
  if (req.method !== "POST")
    return send(res, corsJson({ paid: false, error: "Method not allowed" }, 405));
  const parsed = schema.safeParse(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
  if (!parsed.success) return send(res, corsJson({ paid: false, error: "Invalid request" }, 400));
  const wallet = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj";
  const key = process.env.TONCENTER_API_KEY;
  const response = await fetch(
    `https://toncenter.com/api/v3/transactions?account=${wallet}&limit=40&sort=desc`,
    { headers: key ? { "X-API-Key": key } : {} },
  );
  if (!response.ok)
    return send(res, corsJson({ paid: false, error: `TON explorer error ${response.status}` }));
  const body = (await response.json()) as {
    transactions?: Array<{
      hash?: string;
      in_msg?: { value?: string; message_content?: { decoded?: { comment?: string } } };
    }>;
  };
  const match = (body.transactions ?? []).find(
    (t) =>
      t.in_msg?.message_content?.decoded?.comment === parsed.data.memo &&
      Number(t.in_msg?.value ?? 0) >= parsed.data.minTon * 1e9 * 0.98,
  );
  return send(res, corsJson({ paid: Boolean(match), hash: match?.hash ?? null }));
}
function send(res: any, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  response.arrayBuffer().then((b) => res.end(Buffer.from(b)));
}
