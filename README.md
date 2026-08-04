# Twilight Strand

Open-source Path of Exile build planner. Runs the full PoB calculation engine in your browser via WebAssembly.

## Features

- Full PoB engine running in-browser (wasmoon + Lua 5.4)
- Import builds via PoB code, pobb.in URL, pastebin URL, or XML file
- Real DPS, defence, and resistance calculations
- Interactive passive tree with node search, tooltips, and allocation
- Items, skills, config, and calcs tabs
- Dark/light theme, keyboard shortcuts, PWA with offline support
- Shareable build URLs, local saves, build comparison
- Self-hostable via Docker

## Quick Start

```bash
pnpm install
pnpm data:fetch          # Download PoB Lua files + tree data
pnpm dev                 # Start dev server (builds worker + Next.js)
```

Open http://localhost:3003 and import a build.

## Development

```bash
node apps/web/scripts/build-worker.mjs     # Rebuild engine worker
node apps/web/scripts/convert-tree-lua.mjs  # Convert tree data to JSON
pnpm test                                   # Run tests
pnpm typecheck                              # Type check
```

## Docker

```bash
docker compose up --build
```

## Architecture

```
apps/web/          Next.js 15 (App Router, Turbopack)
  engine/          Wasmoon worker, bridge, codec
  components/      React components (tree, items, skills, etc.)
  stores/          Zustand stores (build, tree, UI)
packages/
  pob-codec/       @tsc/pob-codec (base64+zlib encode/decode)
  pob-data/        Data fetching scripts
  engine/          Rust WASM calc engine (stubs)
```

## License

MIT
