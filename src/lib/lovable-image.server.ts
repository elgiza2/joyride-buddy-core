/**
 * Image generation through the Lovable AI Gateway.
 *
 * Needs no third-party key: LOVABLE_API_KEY is provided by the hosting
 * environment. Returns a base64 data URL (or null when unavailable).
 */
export async function lovableImage(prompt: string): Promise<string | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error(`Lovable image failed [${res.status}]: ${await res.text()}`);
      return null;
    }

    const json = (await res.json()) as {
      choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    };
    return json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
  } catch (e) {
    console.error("Lovable image request failed", e);
    return null;
  }
}

/** Converts a data URL into raw bytes for multipart uploads (Telegram). */
export function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; type: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const binary = atob(match[2]!);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, type: match[1]! };
}
