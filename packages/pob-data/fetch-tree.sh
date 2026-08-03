#!/usr/bin/env bash
set -euo pipefail

# Fetch passive tree data from GGG's official repo and sprite atlases from poecdn.
# Source: https://github.com/grindinggear/skilltree-export (MIT-compatible)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT_DIR="$REPO_ROOT/apps/web/public/data"

mkdir -p "$OUT_DIR/tree" "$OUT_DIR/passive-skill"

# --- Tree JSON from GGG's official repo ---
echo "==> Fetching tree data from grindinggear/skilltree-export"

tree_file="$OUT_DIR/tree/tree-3_29.json"
if [ -f "$tree_file" ]; then
  echo "  [skip] tree-3_29.json already exists"
else
  curl -sfL "https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json" \
    -o "$tree_file"
  echo "  [ok] tree-3_29.json ($(wc -c < "$tree_file" | tr -d ' ') bytes)"
fi

# --- Sprite atlases from poecdn (zoom level 3) ---
echo "==> Fetching sprite atlases from poecdn"

# Extract sprite URLs from tree JSON
SPRITE_URLS=$(python3 -c "
import json
tree = json.load(open('$tree_file'))
sprites = tree.get('sprites', {})
urls = set()
for cat in sprites.values():
    if isinstance(cat, dict):
        for entries in cat.values():
            if isinstance(entries, list):
                for e in entries:
                    if isinstance(e, dict) and 'filename' in e and '-3.' in e['filename']:
                        urls.add(e['filename'])
            elif isinstance(entries, dict) and 'filename' in entries and '-3.' in entries['filename']:
                urls.add(entries['filename'])
for u in sorted(urls):
    print(u)
")

while IFS= read -r url; do
  filename=$(echo "$url" | sed 's|.*/||' | sed 's|?.*||')
  outfile="$OUT_DIR/passive-skill/$filename"

  if [ -f "$outfile" ]; then
    echo "  [skip] $filename"
    continue
  fi

  echo -n "  [fetch] $filename... "
  if curl -sfL "$url" -o "$outfile"; then
    echo "ok ($(wc -c < "$outfile" | tr -d ' ') bytes)"
  else
    echo "FAILED"
    rm -f "$outfile"
  fi
done <<< "$SPRITE_URLS"

echo "==> Done."
echo "  Tree: $(find "$OUT_DIR/tree" -type f | wc -l | tr -d ' ') files"
echo "  Sprites: $(find "$OUT_DIR/passive-skill" -type f | wc -l | tr -d ' ') files"
