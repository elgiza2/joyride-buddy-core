import base64, json, pathlib
root = pathlib.Path('/home/ubuntu/joyride-buddy-core')
exclude = {'node_modules', '.git', 'dist', '.output', '.wrangler', 'scripts_pack_deploy.py'}
files = []
for p in root.rglob('*'):
    if not p.is_file() or any(part in exclude for part in p.parts) or p.relative_to(root).as_posix() == 'public/bg.mp4':
        continue
    rel = p.relative_to(root).as_posix()
    if rel.startswith('.env') or rel.endswith('.lock') and rel == 'bun.lock':
        continue
    data = p.read_bytes()
    try:
        text = data.decode('utf-8')
        files.append({'file': rel, 'data': text, 'encoding': 'utf-8'})
    except UnicodeDecodeError:
        files.append({'file': rel, 'data': base64.b64encode(data).decode('ascii'), 'encoding': 'base64'})
payload = {'name': 'joyride-buddy-core5555', 'target': 'production', 'teamId': 'team_qPOOwl17ySuaLUerPtG4wzEV', 'projectSettings': {'framework': 'vite', 'buildCommand': 'npm run build', 'installCommand': 'npm install'}, 'files': files}
pathlib.Path('/tmp/vercel_deploy.json').write_text(json.dumps(payload))
print(len(files))
