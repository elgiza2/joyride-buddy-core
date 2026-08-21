import json, pathlib
root = pathlib.Path('/home/ubuntu/joyride-buddy-core/supabase/functions/music-api')
files = []
for p in root.rglob('*'):
    if p.is_file():
        files.append({'name': p.relative_to(root).as_posix(), 'content': p.read_text()})
payload = {'project_id': 'ltgampdtawuefwwayncx', 'name': 'music-api', 'entrypoint_path': 'index.ts', 'verify_jwt': False, 'files': files}
pathlib.Path('/tmp/supabase_music_api.json').write_text(json.dumps(payload))
print(len(files))
