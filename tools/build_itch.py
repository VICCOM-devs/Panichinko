"""Build the itch.io HTML5 upload from demo/index.html.

Usage: python tools/build_itch.py 0.1.0
Strips the window.__pch test hook, checks the menu version string, and writes
dist/index.html plus dist/panichinko-demo-v<VER>-html5.zip (index.html at the zip root).
"""
import hashlib, pathlib, re, sys, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
VER = sys.argv[1] if len(sys.argv) > 1 else '0.1.0'
src = (ROOT / 'demo' / 'index.html').read_text(encoding='utf-8')
out = re.sub(r'/\* test hook \*/\nwindow\.__pch=.*?\n', '', src, flags=re.S)
assert '__pch' not in out, 'test hook still present'
assert f'v{VER}' in out, f'menu version string v{VER} not found in demo/index.html'
dist = ROOT / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'index.html').write_text(out, encoding='utf-8')
z = dist / f'panichinko-demo-v{VER}-html5.zip'
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
    f.write(dist / 'index.html', 'index.html')
print(z.relative_to(ROOT), hashlib.sha256(z.read_bytes()).hexdigest())
