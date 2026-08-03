# Path of Building Community - Source Summary

## License

**MIT** (primary), with third-party components under LGPL v2+ (base64.lua), Apache 2.0, ISC, BSD 3-Clause. Commercially friendly; derivative works permitted. The LGPL base64 module is the only copyleft piece and is trivially replaceable.

**Implication for our project:** We can freely reuse PoB's Lua data files and bundle structure. Bundling the Lua engine (as SolvedExile does) is clean under MIT. A Rust re-implementation of the calc logic is also fine; the MIT license places no restrictions on clean-room or reference-based rewrites.

## Key Modules (src/Modules/)

| Module | Role |
|--------|------|
| CalcOffence.lua | Damage pipeline: base, conversion, scaling, crit, DoTs |
| CalcDefence.lua | EHP, max hit, mitigation, avoidance, recovery |
| CalcPerform.lua | Orchestrates full calculation |
| CalcSetup.lua | Environment/context init |
| CalcTriggers.lua | Trigger skill handling (CoC, CwC, etc.) |
| CalcActiveSkill.lua | Active skill resolution |
| CalcSections.lua | UI stat section definitions |
| ModParser.lua | Mod text to structured objects (the hardest module) |
| ConfigOptions.lua | Build config toggles |
| Data.lua | Game data loading/init |

## HeadlessWrapper.lua

Official headless mode exists in the repo. Stubs all rendering/IO, exposes three entry points: `newBuild()`, `loadBuildFromXML(xml)`, `loadBuildFromJSON(json)`. SolvedExile extends this with custom `_wasm_*` bridge functions. We can do the same.

## Community Health

5.4k stars, 2.4k forks, 9,333 commits on dev branch. 780 open issues, 124 open PRs. Actively maintained; updated for each PoE patch. Large contributor base means the Lua data files stay current, which is critical since we depend on them for game data.

## Implications

- Bundle PoB Lua files for Phase 1 (wasmoon approach) with zero legal risk
- HeadlessWrapper is the official entry point; extend it, don't fork it
- Data files (gems, uniques, mods, tree) are community-maintained and patch-current
- For the Rust engine, reference the Lua calc modules as specification; MIT allows this
