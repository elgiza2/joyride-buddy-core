import { apiPost } from "@/lib/api";

/**
 * Confirms an incoming TON transfer carrying `memo` on the project wallet,
 * via the backend route `/api/public/ton-verify`.
 */
export async function verifyTonPayment(input: {
  data: { memo: string; minTon: number };
}): Promise<{ paid: boolean; hash?: string | null; error?: string }> {
  try {
    return await apiPost<{ paid: boolean; hash?: string | null }>(
      "/api/public/ton-verify",
      input.data,
    );
  } catch (e) {
    return { paid: false, error: e instanceof Error ? e.message : "Verification failed" };
  }
}
