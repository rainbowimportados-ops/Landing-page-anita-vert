from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / 'assets'
OUTPUT_DIR = SOURCE_DIR / 'comparadores'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

for case_id in ('caso-1', 'caso-2', 'caso-3'):
    source = SOURCE_DIR / f'{case_id}.webp'
    with Image.open(source) as image:
        width, height = image.size
        split = width // 2
        before = image.crop((0, 0, split, height))
        after = image.crop((split, 0, width, height))
        before.save(OUTPUT_DIR / f'{case_id}-antes.webp', format='WEBP', quality=92, method=6)
        after.save(OUTPUT_DIR / f'{case_id}-depois.webp', format='WEBP', quality=92, method=6)
        print(f'{case_id}: {image.size} -> {before.size} + {after.size}')
