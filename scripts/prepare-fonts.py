"""Rebuild lossless WOFF2 copies: python3 -m pip install fonttools brotli."""
import hashlib
import json
from pathlib import Path

from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
catalog_path = root / 'src/config/fontCatalog.json'
catalog = json.loads(catalog_path.read_text())
for item in catalog:
    source = root / 'src/assets/fonts' / item['sourceFile']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == item['sourceSha256']
    target = source.with_suffix('.woff2')
    font = TTFont(source, recalcTimestamp=False)
    font.flavor = 'woff2'
    font.save(target)
    decoded = TTFont(target)
    assert font.getBestCmap() == decoded.getBestCmap(), item['family']
    assert font['hmtx'].metrics == decoded['hmtx'].metrics, item['family']
    item['file'] = target.name
    item['bytes'] = target.stat().st_size
    item['sha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
    print(f"{item['family']}: {source.stat().st_size} -> {item['bytes']} bytes")
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
