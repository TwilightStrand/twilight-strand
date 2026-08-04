# Twilight Strand

Open-source Path of Exile build planner. Runs the full PoB calculation engine in your browser via WebAssembly, with a Rust WASM engine for fast recalculation.

## Features

- **Full PoB engine** running in-browser (wasmoon + Lua 5.4) with real DPS, defence, and resistance calculations
- **Rust WASM engine** for instant stat evaluation (50,000 evals/sec, 140KB binary)
- **Import** from PoB code, pobb.in, pastebin, XML file, or PoE account
- **Interactive passive tree** with search, tooltips, minimap, specs, zoom, node power heatmap, and optimizer
- **Items** with weapon swap, mod colors, socket visuals, influence markers, and trade price check
- **Skills** with gem links, DPS contribution per group, and main skill indicator
- **Config** with interactive options, presets (Mapping/Bossing), bandit/pantheon display
- **Calcs** with filter, DoT breakdown, cluster jewel search, and export
- **Dark/light theme**, keyboard shortcuts (`?` for help), PWA with offline support
- **Build management**: save, export, share (URL hash), compare, undo/redo, cloud saves
- **Auth**: GitHub + Discord OAuth with PostgreSQL cloud build storage
- **Self-hostable** via Docker with PostgreSQL

## Quick Start

```bash
pnpm install
pnpm data:fetch          # Download PoB Lua files + tree data
pnpm dev                 # Start dev server (builds worker + Next.js)
```

Open http://localhost:3003 and import a build.

## Development

```bash
node apps/web/scripts/build-worker.mjs     # Rebuild Lua engine worker
node apps/web/scripts/convert-tree-lua.mjs # Convert tree data to JSON
pnpm test                                  # Run TypeScript tests
pnpm typecheck                             # Type check

# Rust engine
cd packages/engine && cargo test           # Run Rust tests (80)
cd packages/engine && bash build.sh        # Build WASM (requires wasm-pack)
```

## Auth Setup

1. Create GitHub and Discord OAuth apps
2. Copy `apps/web/.env.example` to `.env.local` and fill in credentials
3. Run `pnpm drizzle-kit push` to create database tables

## Docker

```bash
docker compose up --build    # Starts web app + PostgreSQL
```

## Architecture

```
apps/web/          Next.js 15 (App Router, Turbopack, Tailwind 4)
  engine/          Lua worker (wasmoon), Rust bridge, PoB codec
  components/      React components (tree, items, skills, config, calcs, settings)
  stores/          Zustand stores (build, tree, UI)
  db/              Drizzle ORM schema + PostgreSQL connection
  lib/             Auth, trade, scoring utilities
packages/
  engine/          Rust WASM calc engine (1,500+ lines, 80 tests)
  pob-codec/       @tsc/pob-codec (base64+zlib encode/decode)
  pob-data/        Data fetching scripts
```

## Performance

| Metric | Value |
|--------|-------|
| Rust single eval | 20us (49,255 evals/sec) |
| Rust rank 100 nodes | 5.95ms |
| WASM binary | 140KB |
| Lua engine boot | ~12s |

## License

MIT
