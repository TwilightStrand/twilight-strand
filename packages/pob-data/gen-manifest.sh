#!/usr/bin/env bash
set -euo pipefail

# Generate a manifest listing all Lua files in the PoB data directory.
# This is needed because Next.js static serving doesn't support directory listings.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
POB_DIR="$REPO_ROOT/apps/web/public/data/pob"

if [ ! -d "$POB_DIR" ]; then
  echo "PoB data not found at $POB_DIR. Run 'pnpm data:fetch' first."
  exit 1
fi

# Generate a JSON array of all relative Lua file paths
MANIFEST="$POB_DIR/file-list.json"

cd "$POB_DIR"
find . \( -name "*.lua" -o -name "*.jsonc" -o -name "*.json" \) -type f | sort | sed 's|^\./||' | python3 -c "
import json, sys
files = [line.strip() for line in sys.stdin if line.strip()]
json.dump(files, sys.stdout, indent=None)
print()
" > "$MANIFEST"

COUNT=$(python3 -c "import json; print(len(json.load(open('$MANIFEST'))))")
echo "Generated file-list.json with $COUNT Lua files"
