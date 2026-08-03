import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

await build({
  entryPoints: [resolve(root, "engine/worker.ts")],
  bundle: true,
  format: "iife",
  target: "es2022",
  outfile: resolve(root, "public/engine-worker.js"),
  platform: "browser",
  conditions: ["browser", "import"],
  define: {
    "process.versions.node": "undefined",
    "process.release": "undefined",
    "process.argv": "[]",
    "process.exitCode": "0",
  },
  // wasmoon's Emscripten glue references Node.js builtins in dead code branches.
  // Shimming them as empty modules is safe because the browser path never calls them.
  alias: {
    "module": resolve(root, "engine/shims/empty.js"),
    "url": resolve(root, "engine/shims/url-shim.js"),
    "fs": resolve(root, "engine/shims/empty.js"),
    "path": resolve(root, "engine/shims/path-shim.js"),
  },
  sourcemap: true,
  minify: process.argv.includes("--minify"),
  logLevel: "info",
});
