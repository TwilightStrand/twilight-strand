# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-04
**Repo:** 145 commits this session
**Status:** Production-ready MVP with dual engine, community features, auto-generated game data, k3s deploy ready

## Quick Stats

| Metric | Count |
|--------|-------|
| Commits | 145 |
| React components | 43 |
| Rust engine modules | 16 (5,003 lines) |
| Tests | 250 (199 Rust + 32 TS + 19 E2E) |
| API routes | 9 |
| Generated game data | 53 cluster bases, 300 notables, 1,160 gems, 1,202 uniques, 3,397 tree nodes |
| Type errors | 0 |

## Data Pipeline

All game data auto-generated from PoB Lua source files. Never hand-coded.

```bash
pnpm data:fetch    # Download PoB files from GitHub
pnpm data:gen      # Generate TypeScript from Lua sources
```

Re-run every league when PoB updates.

## Dual Engine

| Engine | Speed | Purpose |
|--------|-------|---------|
| Lua (wasmoon) | ~15s boot, ~8s eval | Full PoB accuracy, source of truth |
| Rust (WASM) | 50k evals/sec | Heatmap, optimizer, power report, real-time |

Phase: Rust mirrors Lua. Goal: full replacement for sub-ms builds.

## Deploy

**GH Actions** builds Docker image → pushes to GHCR on every push to main.

**k3s manifests** in `deploy/k3s/`:
```bash
kubectl apply -f namespace.yml
kubectl apply -f secrets.yml     # from secrets.yml.example
kubectl apply -f postgres.yml    # optional, for auth
kubectl apply -f app.yml         # 2 replicas + ingress + TLS
```

Works without Postgres (localStorage saves, auth returns 503 gracefully).

## Dev Commands

```bash
pnpm dev              # Dev server (port 3003)
pnpm test             # TS tests (32)
pnpm engine:test      # Rust tests (199)
pnpm test:all         # All tests
pnpm typecheck        # TypeScript check
pnpm data:gen         # Regenerate game data
pnpm worker:build     # Rebuild Lua worker
```

## Known Issues

1. Turbopack caches stale modules sometimes - delete `.next/cache`
2. Auth needs server restart after first dep install
3. Rust engine doesn't cover all PoB edge cases yet
4. Cluster optimizer prices are estimates unless "Check $" is clicked
5. Item/skill editor changes don't auto-recalculate (need re-import)

## Next Session Priorities

1. **Dual engine validation** - run both on 100+ builds, find where Rust diverges
2. **Wire Rust for real-time node toggle** - instant stat recalc when clicking tree nodes
3. **More unique item effects in Rust** - currently 30+, PoB has 500+
4. **Parse more PoB data** - base item types, mod pools, enchant data
5. **Cluster optimizer UX** - show which jewel sockets to use, apply cluster to build

## Architecture

See ARCHITECTURE.md. Key files:
- `apps/web/engine/worker.ts` - Lua engine (wasmoon + PoB boot)
- `apps/web/engine/bridge.ts` - Main thread ↔ Worker messaging
- `apps/web/engine/rust-bridge.ts` - Rust WASM bridge
- `packages/engine/src/lib.rs` - Rust stat calculator
- `apps/web/stores/build-store.ts` - Build state + two-phase eval
- `apps/web/data/*.generated.ts` - Auto-generated game data

## Research

`docs/research/` has SolvedExile reverse-engineering, competitor analysis (7 tools), feature gap matrix.
