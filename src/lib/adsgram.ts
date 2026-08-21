import { apiUrl } from "@/lib/api";
/** Minimal Adsgram (sad.adsgram.ai) rewarded-ad integration. */

let blockId = (import.meta.env["VITE_ADSGRAM_BLOCK_ID"] as string | undefined) ?? "43800";

async function resolveBlockId() {
  try {
    const res = await fetch(apiUrl("/api/public/config"));
    const data = (await res.json()) as { adsgramBlockId?: string };
    if (data.adsgramBlockId) blockId = data.adsgramBlockId;
  } catch {
    /* keep the fallback */
  }
  return blockId;
}

type AdController = {
  show: () => Promise<{ done?: boolean; description?: string }>;
};

type AdsgramGlobal = {
  init: (opts: { blockId: string; debug?: boolean }) => AdController;
};

let controller: AdController | null = null;
let loading: Promise<void> | null = null;

function loadScript() {
  if (typeof document === "undefined") return Promise.reject(new Error("no dom"));
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-adsgram]");
    if (existing) return resolve();
    const el = document.createElement("script");
    el.src = "https://sad.adsgram.ai/js/sad.min.js";
    el.async = true;
    el.dataset["adsgram"] = "1";
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Adsgram failed to load"));
    document.head.appendChild(el);
  });
  return loading;
}

export async function showRewardedAd(): Promise<boolean> {
  await loadScript();
  const sdk = (window as unknown as { Adsgram?: AdsgramGlobal }).Adsgram;
  if (!sdk) throw new Error("Adsgram is unavailable");
  controller ??= sdk.init({ blockId: await resolveBlockId() });
  const result = await controller.show();
  return result?.done !== false;
}
