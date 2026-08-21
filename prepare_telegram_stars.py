import json
from pathlib import Path
src = json.loads(Path('/home/ubuntu/.mcp/tool-results/2026-08-21_08-46-17.583362533_supabase_get_edge_function_761d0d89.json').read_text())
files = []
for item in src.get('files', []):
    name = item.get('name') or item.get('path') or 'index.ts'
    content = item.get('content', '')
    content = content.replace("const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_MUSIC');", "const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_NOVA');")
    content = content.replace("Deno.env.get('stars')", "Deno.env.get('Sooo')")
    content = content.replace("const STARS_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_MUSIC');", "const STARS_BOT_TOKEN = Deno.env.get('Sooo');")
    marker = "    if (body?.task === 'stars_setup') {"
    setup = "    if (body?.task === 'nova_setup') {\n      const me = await tg('getMe', {});\n      const hook = await tg('setWebhook', { url: `${SUPABASE_URL}/functions/v1/telegram-bot`, allowed_updates: ['message', 'callback_query'] });\n      const info = await tg('getWebhookInfo', {});\n      return new Response(JSON.stringify({ me: me?.result, hook, info: info?.result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });\n    }\n\n"
    content = content.replace(marker, setup + marker, 1)
    files.append({'name': name, 'content': content})
payload = {'project_id': 'ltgampdtawuefwwayncx', 'name': 'telegram-bot', 'entrypoint_path': 'telegram-bot/index.ts', 'verify_jwt': False, 'files': files}
Path('/tmp/supabase_telegram_stars.json').write_text(json.dumps(payload))
print('prepared', len(files), 'files')
