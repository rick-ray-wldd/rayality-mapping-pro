"""Package only the verified public static build, never the checkout or local config."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text())['version']
files = [(p, p.relative_to(root / 'dist').as_posix()) for p in sorted((root / 'dist').rglob('*')) if p.is_file()]
if not any(name == 'index.html' for _, name in files):
    raise SystemExit('Run npm run build first')
for name in ['LICENSE', 'Readme.md', 'THIRD_PARTY_NOTICES.md', 'CONTRIBUTING.md']:
    files.append((root / name, name))
files += [(p, p.relative_to(root).as_posix()) for p in sorted((root / 'docs').glob('*.md'))]
out = root / 'release'
out.mkdir(exist_ok=True)
archive = out / f'rayality-mapping-pro-{version}-static.zip'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as z:
    for source, name in files:
        if source.is_symlink() or '.env' in name or '.vercel' in name:
            raise SystemExit(f'Unexpected private path: {name}')
        info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        z.writestr(info, source.read_bytes())
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(archive.with_suffix('.zip.sha256')).write_text(f'{checksum}  {archive.name}\n')
print(f'{archive.name}: {checksum}')
