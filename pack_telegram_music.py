import json
from pathlib import Path
root = Path('/home/ubuntu/joyride-buddy-core/supabase/functions')
files = []
for rel in ['telegram-bot/index.ts']:
    p = root / rel
    files.append({'name': rel, 'content': p.read_text()})
shared = root / '_shared/notification-texts.ts'
if shared.exists():
    files.append({'name': '_shared/notification-texts.ts', 'content': shared.read_text()})
payload = {'project_id': 'ltgampdtawuefwwayncx', 'name': 'telegram-bot', 'entrypoint_path': 'telegram-bot/index.ts', 'verify_jwt': False, 'files': files}
Path('/tmp/supabase_telegram_music.json').write_text(json.dumps(payload))
