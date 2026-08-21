import json
from pathlib import Path
root = Path('/home/ubuntu/joyride-buddy-core/supabase/functions/music-bot')
files = [{'name': p.relative_to(root).as_posix(), 'content': p.read_text()} for p in root.rglob('*') if p.is_file()]
payload = {'project_id': 'ltgampdtawuefwwayncx', 'name': 'music-bot', 'entrypoint_path': 'index.ts', 'verify_jwt': False, 'files': files}
Path('/tmp/supabase_music_bot.json').write_text(json.dumps(payload))
print('prepared', len(files), 'files')
