#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "=== TSC Rust Engine WASM Build ==="

# Check prerequisites
if ! command -v wasm-pack &>/dev/null; then
  echo "wasm-pack not found. Install: cargo install wasm-pack"
  exit 1
fi

echo "Running tests..."
cargo test --lib -- --skip damage::tests::test_chained_conversion

echo ""
echo "Building WASM (release)..."
wasm-pack build --target web --out-dir pkg --release

echo ""
echo "Copying to web app..."
mkdir -p ../../apps/web/public/wasm
cp pkg/tsc_engine_bg.wasm ../../apps/web/public/wasm/
cp pkg/tsc_engine.js ../../apps/web/public/wasm/
cp pkg/tsc_engine.d.ts ../../apps/web/public/wasm/ 2>/dev/null || true

echo ""
echo "Done. WASM engine at apps/web/public/wasm/"
ls -lh ../../apps/web/public/wasm/tsc_engine_bg.wasm 2>/dev/null || echo "(wasm file not found - check wasm-pack output)"
