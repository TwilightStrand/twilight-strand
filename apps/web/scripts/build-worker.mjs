import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

await build({
  entryPoints: [resolve(root, "engine/worker.ts")],
  bundle: true,
  format: "esm",
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
  external: ["/data/pob/driver/driver.mjs"],
  sourcemap: true,
  minify: process.argv.includes("--minify"),
  logLevel: "info",
});
