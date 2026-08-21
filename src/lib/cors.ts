/** Shared CORS headers so a frontend on another host (Vercel) can call these routes. */
export const corsHeaders: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

/** JSON response with CORS headers. */
export function corsJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

/** Preflight handler. */
export function corsPreflight() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
