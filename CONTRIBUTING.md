# Contributing to Twilight Strand

Thanks for your interest. This doc covers how to get set up, make changes, and submit them.

## Getting started

```bash
git clone https://github.com/TwilightStrand/twilight-strand.git
cd twilight-strand
pnpm install
pnpm data:fetch    # download PoB data files
pnpm data:gen      # generate TypeScript from Lua sources
pnpm dev           # starts on port 3003
```

Requirements: Node 20+, pnpm 10+, Rust toolchain (for engine changes).

## Project structure

```
apps/web/              Next.js app
  components/          React components by feature area
  engine/              Lua worker, Rust bridge, converters
  data/                Auto-generated data (do not edit *.generated.ts)
  stores/              Zustand state management
  scripts/             Data generators, build scripts
  public/data/pob/     PoB Lua files and tree data

packages/engine/       Rust WASM stat calculator
packages/build-codec/  Binary build format
packages/pob-data/     Data fetch scripts

contributing/          Design docs and guidelines
```

## Making changes

1. Create a branch from `main`
2. Make your changes
3. Run the quality gates: `pnpm typecheck && pnpm test`
4. For Rust changes: `cargo test` in `packages/engine`
5. Open a PR against `main`

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(engine): add support for new keystone
fix(tree): connection rendering at low zoom
perf(renderer): batch node draw calls
chore: update dependencies
```

Scope is auto-detected from the changed files. Keep the subject under 72 characters.

## Code guidelines

See `CLAUDE.md` for the full set. The key ones:

- **TypeScript strict** - never cast types, always narrow them
- **Comments explain WHY** - not what or how
- **No backward compatibility hacks** - if something is unused, delete it
- **No premature abstractions** - three similar lines beats a helper nobody understands
- **Generated data** - never edit `*.generated.ts` files directly; modify the generator script in `scripts/` and re-run `pnpm data:gen`

## Design guidelines

See [contributing/UX.md](contributing/UX.md) for UX principles and design patterns.

## Data pipeline

All game data is auto-generated from Path of Building's Lua source files:

```bash
pnpm data:fetch    # download from PoB GitHub
pnpm data:gen      # run all generators
```

Generators live in `apps/web/scripts/gen-*.mjs`. Each reads Lua files and outputs a `*.generated.ts` file. When PoB updates for a new league, run both commands to refresh everything.

## Rust engine

The Rust WASM engine in `packages/engine/` mirrors PoB's calculation logic for sub-millisecond evaluation.

```bash
cd packages/engine
cargo test          # run 292 tests
```

Key files:
- `lib.rs` - main evaluate_build function
- `stat_parser.rs` - mod text line parser
- `damage.rs` - 5-type conversion chain
- `uniques.rs` / `supports.rs` / `keystones.rs` - special item/gem/keystone effects

When adding a new unique, support, or keystone: add the effect, add a test, run the snapshot tests.

## Architecture

The app uses a dual-engine approach:
1. **Rust engine** (primary) - fast path for real-time recalc, node power, optimizer
2. **Lua engine** (validation) - runs full PoB calculation for ground-truth accuracy

Both should produce the same output. The Rust engine is being expanded to eventually replace Lua entirely. The `EngineComparison` component in Settings shows divergences between the two.

## Testing

```bash
pnpm test           # TypeScript tests (114)
pnpm engine:test    # Rust tests (292)
pnpm typecheck      # type checking
pnpm test:all       # everything
```

## Need help?

Open an issue. Check `HANDOVER.md` for pointers to key source files.
