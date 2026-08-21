import json
from pathlib import Path
src = Path('/home/ubuntu/.mcp/tool-results/2026-08-21_04-58-57.159078192_supabase_get_edge_function_a830e7f0.json')
data = json.loads(src.read_text())
code = next(x['content'] for x in data['files'] if x.get('name') == 'functions/telegram-bot/index.ts')
code = code.replace('Deno.env.get(\'TELEGRAM_BOT_TOKEN_HELLO\') || Deno.env.get(\'TELEGRAM_BOT_TOKEN\')', 'Deno.env.get(\'TELEGRAM_BOT_TOKEN_MUSIC\')')
code = code.replace('Deno.env.get("TELEGRAM_BOT_TOKEN_HELLO") || Deno.env.get("TELEGRAM_BOT_TOKEN")', 'Deno.env.get("TELEGRAM_BOT_TOKEN_MUSIC")')
code = code.replace('Deno.env.get(\'TELEGRAM_STARS_BOT_TOKEN\') || TELEGRAM_BOT_TOKEN', 'Deno.env.get(\'TELEGRAM_BOT_TOKEN_MUSIC\')')
code = code.replace('Deno.env.get("TELEGRAM_STARS_BOT_TOKEN") || TELEGRAM_BOT_TOKEN', 'Deno.env.get("TELEGRAM_BOT_TOKEN_MUSIC")')
shared = next(x['content'] for x in data['files'] if x.get('name') == 'functions/_shared/notification-texts.ts')
Path('/home/ubuntu/joyride-buddy-core/supabase/functions/_shared').mkdir(parents=True, exist_ok=True)
Path('/home/ubuntu/joyride-buddy-core/supabase/functions/_shared/notification-texts.ts').write_text(shared)
Path('/home/ubuntu/joyride-buddy-core/supabase/functions/telegram-bot/index.ts').write_text(code)
