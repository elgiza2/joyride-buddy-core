/**
 * Base URL of the backend that serves this app's `/api/*` routes.
 *
 * Empty by default (same origin, e.g. the Lovable deployment).
 * When the frontend is hosted somewhere else (Vercel), set the public,
 * non-secret variable `VITE_API_BASE` to the Lovable deployment URL —
 * e.g. https://project--<id>.lovable.app — and every backend call below
 * goes there, so no secret keys are ever needed on the frontend host.
 */
export const API_BASE = (import.meta.env["VITE_API_BASE"] ?? "").replace(/\/+$/, "");

/** Absolute URL for a backend path such as `/api/public/prices`. */
export function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** POST JSON to a backend route and return the parsed response. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

/** GET JSON from a backend route. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { headers: { accept: "application/json" } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}
