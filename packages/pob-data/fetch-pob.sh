#!/usr/bin/env bash
set -euo pipefail

# Fetch PoB Lua source files from the PathOfBuildingCommunity GitHub repo.
# These are MIT licensed and used by the wasmoon engine bridge.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT_DIR="$REPO_ROOT/apps/web/public/data/pob"

POB_TAG="${POB_TAG:-v2.66.2}"
POB_ARCHIVE="https://github.com/PathOfBuildingCommunity/PathOfBuilding/archive/refs/tags/${POB_TAG}.tar.gz"

mkdir -p "$OUT_DIR"

MANIFEST="$OUT_DIR/manifest.json"
if [ -f "$MANIFEST" ]; then
  existing_tag=$(python3 -c "import json; print(json.load(open('$MANIFEST')).get('sourceTag',''))" 2>/dev/null || echo "")
  if [ "$existing_tag" = "$POB_TAG" ]; then
    echo "==> PoB data already fetched ($POB_TAG). Use POB_TAG=vX.Y.Z to update."
    exit 0
  fi
fi

echo "==> Downloading PoB source ($POB_TAG)..."
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

curl -sfL "$POB_ARCHIVE" -o "$TMPDIR/pob.tar.gz"
echo "  [ok] Downloaded archive"

echo "==> Extracting Lua files..."
tar -xzf "$TMPDIR/pob.tar.gz" -C "$TMPDIR"

# Find the extracted directory (PathOfBuilding-X.Y.Z/)
POB_SRC=$(find "$TMPDIR" -maxdepth 1 -type d -name "PathOfBuilding-*" | head -1)
if [ -z "$POB_SRC" ]; then
  echo "[error] Could not find extracted PoB directory"
  exit 1
fi

SRC="$POB_SRC/src"
if [ ! -d "$SRC" ]; then
  echo "[error] No src/ directory in archive"
  exit 1
fi

# Copy the directories we need
echo "==> Copying Lua modules..."
rm -rf "$OUT_DIR/Modules" "$OUT_DIR/Classes" "$OUT_DIR/Data" "$OUT_DIR/TreeData"

for dir in Modules Classes Data TreeData; do
  if [ -d "$SRC/$dir" ]; then
    cp -r "$SRC/$dir" "$OUT_DIR/$dir"
    count=$(find "$OUT_DIR/$dir" -name "*.lua" | wc -l | tr -d ' ')
    echo "  [ok] $dir/ ($count Lua files)"
  fi
done

# Copy top-level Lua files
for f in Launch.lua HeadlessWrapper.lua GameVersions.lua; do
  if [ -f "$SRC/$f" ]; then
    cp "$SRC/$f" "$OUT_DIR/$f"
    echo "  [ok] $f"
  fi
done

# Copy runtime support files
if [ -d "$POB_SRC/runtime/lua" ]; then
  mkdir -p "$OUT_DIR/runtime"
  cp -r "$POB_SRC/runtime/lua/"* "$OUT_DIR/runtime/"
  echo "  [ok] runtime/"
fi

# Generate manifest
echo "==> Generating manifest..."
TOTAL_FILES=$(find "$OUT_DIR" -name "*.lua" | wc -l | tr -d ' ')
TOTAL_BYTES=$(find "$OUT_DIR" -name "*.lua" -exec cat {} + | wc -c | tr -d ' ')

# Get commit hash for the tag
COMMIT=$(curl -sfL "https://api.github.com/repos/PathOfBuildingCommunity/PathOfBuilding/git/refs/tags/${POB_TAG}" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('object',{}).get('sha','unknown'))" 2>/dev/null || echo "unknown")

cat > "$MANIFEST" << MANIFEST_EOF
{
  "game": "poe1",
  "sourceTag": "$POB_TAG",
  "sourceCommit": "$COMMIT",
  "totalFiles": $TOTAL_FILES,
  "rawBytes": $TOTAL_BYTES,
  "fetchedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
MANIFEST_EOF

echo "  [ok] manifest.json ($TOTAL_FILES files, $((TOTAL_BYTES / 1024 / 1024)) MB)"
echo "==> Done. PoB data in $OUT_DIR/"
