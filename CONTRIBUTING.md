# Contributing to Twilight Strand

## Quick Start

```bash
git clone <repo>
cd PoBAlternative
pnpm install
pnpm data:fetch
pnpm dev
```

## Development

- Frontend: `apps/web/` (Next.js 15, TypeScript, Tailwind)
- Rust engine: `packages/engine/` (Rust, wasm-bindgen)
- PoB codec: `packages/pob-codec/` (TypeScript)

## Testing

```bash
pnpm test              # Frontend tests
cargo test             # Rust engine tests
```

## Pull Requests

- One feature per PR
- Include tests for new features
- Update ROADMAP.md if adding/completing a feature
- Run `pnpm typecheck` before submitting

## Architecture

The app uses a dual-engine approach:
1. **Lua engine** (wasmoon) - runs full PoB calculation for accuracy
2. **Rust engine** (wasm-bindgen) - fast path for real-time recalc and optimization

Both engines should produce the same output for a given build. The Rust engine is being expanded to eventually replace the Lua engine entirely.
