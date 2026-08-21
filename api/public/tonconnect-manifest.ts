/* eslint-disable @typescript-eslint/no-explicit-any */
import icon from "../../src/assets/music-wallet-icon.png.asset.json";
export default function handler(req: any, res: any) {
  const site = process.env.MUSIC_APP_URL ?? `https://${req.headers.host}`;
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("cache-control", "public, max-age=300");
  res.end(JSON.stringify({ url: site, name: "MUSIC", iconUrl: `${site}${icon.url}` }));
}
