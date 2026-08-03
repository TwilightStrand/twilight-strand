# Rust WASM Ecosystem for PoE Build Calculator (August 2026)

## Core Toolchain

- **wasm-bindgen** `0.2.120` (latest on docs.rs) - mature, 225M+ downloads. Generates JS/TS glue code. SolvedExile uses `0.2.118`.
- **wasm-pack** - builds Rust to WASM with npm-ready output. Stable.
- **tsify** `0.4.5` - derives TS type definitions from Rust structs via `#[derive(Tsify)]`. Produces `.d.ts` files automatically with wasm-bindgen. Recommended for typed API boundary.
- **ts-rs** - alternative to tsify; generates TS types without wasm-bindgen coupling. Useful if you want types shared across Rust CLI and WASM targets.

## Architecture Pattern

Use `wasm-bindgen` with `tsify` for the typed API surface. Run the WASM module inside a Web Worker via `postMessage`. Structure: `crate` compiles to `pkg/` with `.wasm` + `.js` glue + `.d.ts`. The worker imports the glue, main thread communicates via structured messages. SolvedExile confirms this pattern works at scale (12.5 MB binary, 24 exports).

## Performance

Rust WASM is 8-10x faster than JS for compute-heavy work. Against Lua-in-WASM specifically: SHA2 hashing benchmark shows Rust-WASM at ~985ms vs Lua 5.3 at ~42s (43x slower). LuaJIT narrows that to 750ms but LuaJIT doesn't compile to WASM; wasmoon uses PUC Lua 5.4. WASM SIMD adds another 6-15x for vectorizable workloads.

## PoE-Specific Rust Crates

- **poe2kit** - PoE 2 data extractor/parser in Rust (active, covers dat files)
- **poe-rs** (`Dav1dde/poe-rs`) - PoE HTTP API abstraction in Rust
- **poe_gem_parser** - Gem data parser using pest grammar
- No existing Rust crate for PoB-style mod parsing or damage calculation. This is greenfield.

## Lua Bridge

- **wasmoon** `1.16.0` - last published ~3 years ago, but SolvedExile uses it in production today. PUC Lua 5.4 compiled to WASM. No serious alternatives; fengari (pure JS) is slower. wasmoon remains the pragmatic choice for running PoB Lua in-browser.

## Recommendation

Start with wasmoon for PoB parity (proven path). Build the Rust engine as a separate `wasm-bindgen` + `tsify` crate targeting `wasm32-unknown-unknown`. Use `poe2kit` patterns for dat file parsing. The Rust engine replaces Lua incrementally, validated against the Lua oracle per-function.
